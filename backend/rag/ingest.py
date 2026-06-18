"""DB 레코드 → 문서화 → Qdrant 하이브리드 인덱싱.

원본 ingest_qdrant.py(shain1912/runway)의 dense+BM25 적재 패턴을 차용하되,
마크다운 파일 대신 플랫폼 DB(제보/제안/설문/진단/공공데이터)를 문서 소스로 삼는다.
각 레코드 = 1 문서: {text, metadata{type,id,district,category}}.
"""
import uuid
import threading

from . import config as C

ID_NS = uuid.UUID("b7e2c1a4-3d5f-4a8b-9c1e-2f6d8a0b4e33")

# 인덱싱 진행 상태 (대시보드 폴링용)
STATE = {"running": False, "result": None, "error": None, "started_at": None}
_LOCK = threading.Lock()


def run_ingest_bg(full=False):
    """백그라운드 스레드에서 자체 세션으로 인덱싱 실행 (HTTP 타임아웃 방지)."""
    with _LOCK:
        if STATE["running"]:
            return False
        STATE.update(running=True, result=None, error=None)

    def _work():
        from database import SessionLocal
        db = SessionLocal()
        try:
            STATE["result"] = ingest(db, full=full)
        except Exception as e:
            STATE["error"] = str(e)
        finally:
            db.close()
            STATE["running"] = False

    threading.Thread(target=_work, daemon=True).start()
    return True


def _doc(typ, rid, district, category, title, body):
    text = f"[{typ}] {title or ''}\n지역: {district or '-'} / 분류: {category or '-'}\n{body or ''}".strip()
    return {
        "id": str(uuid.uuid5(ID_NS, f"{typ}:{rid}")),
        "text": text,
        "metadata": {"type": typ, "id": rid, "district": district or "", "category": category or ""},
    }


def aggregate_documents(db):
    """플랫폼 DB 5종을 문서 리스트로 집계."""
    import models
    docs = []

    # 제보
    for r in db.query(models.Report).all():
        docs.append(_doc("제보", r.id, r.region, r.category, r.title,
                         f"{r.content or ''}\n상태:{r.status or ''}"))
    # 제안
    for p in db.query(models.NewProposal).all():
        docs.append(_doc("제안", p.id, p.region, p.category, p.title, p.content))
    # 진단(체크리스트) — 표본 캡(최근 N건)으로 임베딩 시간 현실화. env RAG_DIAG_LIMIT로 조정.
    import os as _os
    diag_limit = int(_os.getenv("RAG_DIAG_LIMIT", "500"))
    for c in (db.query(models.ChecklistResult)
              .order_by(models.ChecklistResult.result_id.desc()).limit(diag_limit).all()):
        body = f"중분류:{c.중분류 or ''} 점수:{c.점수 or ''} 만족도:{c.만족도 or ''}\n리뷰:{c.리뷰 or ''}"
        docs.append(_doc("진단", c.result_id, c.진단지역, c.대분류, c.질문기준, body))
    # AI 대화형 설문 이슈
    try:
        for s in db.query(models.SurveyChatInterview).all():
            docs.append(_doc("설문", s.id, s.location_bucket, s.primary_category, s.issue_text,
                             f"심각도:{s.severity_score or ''}"))
    except Exception:
        pass
    # 공공데이터 통계
    try:
        for t in db.query(models.PublicThemeStat).all():
            docs.append(_doc("공공데이터", f"stat-{t.id}", t.region, t.theme,
                             t.metric, f"{t.value_text} ({t.year or ''}) {t.note or ''}"))
    except Exception:
        pass

    return docs


def _ensure_collection(client, dim, sparse_ok):
    from qdrant_client import models as qm
    names = [c.name for c in client.get_collections().collections]
    if C.COLLECTION in names:
        return
    sparse_cfg = {"bm25": qm.SparseVectorParams(modifier=qm.Modifier.IDF)} if sparse_ok else None
    client.create_collection(
        collection_name=C.COLLECTION,
        vectors_config={"dense": qm.VectorParams(size=dim, distance=qm.Distance.COSINE)},
        sparse_vectors_config=sparse_cfg,
    )


def ingest(db, full=False):
    """문서 집계 → 임베딩 → Qdrant 적재. 결과 요약 dict 반환."""
    from qdrant_client import models as qm
    from . import core

    client = C.get_qdrant()
    if client is None:
        return {"ok": False, "error": "Qdrant 연결 실패 (6333 기동 필요)"}

    docs = aggregate_documents(db)
    if not docs:
        return {"ok": True, "documents": 0, "points": 0, "note": "집계된 데이터 없음"}

    embedder = core.load_dense_model()
    dim = int(embedder.encode("t").shape[0])
    sparse_ok = core.load_sparse_model() is not None

    if full:
        try:
            client.delete_collection(C.COLLECTION)
        except Exception:
            pass
    _ensure_collection(client, dim, sparse_ok)

    # 청크: 문서 텍스트를 토큰 윈도우로 분할
    max_tokens = max(int(embedder.max_seq_length) - 48, 64)
    rows = []
    for d in docs:
        for j, part in enumerate(core.split_to_token_windows(d["text"], max_tokens)):
            rows.append((f"{d['id']}-{j}", part, d["metadata"]))

    texts = [r[1] for r in rows]
    dense = core.embed_dense(texts, show_progress_bar=False)
    sparse = core.embed_sparse(texts) if sparse_ok else []
    have_sparse = len(sparse) == len(texts)

    points = []
    for i, (pid, text, meta) in enumerate(rows):
        vec = {"dense": dense[i].tolist()}
        if have_sparse:
            vec["bm25"] = core.to_sparse_vector(sparse[i])
        points.append(qm.PointStruct(
            id=str(uuid.uuid5(ID_NS, pid)),
            vector=vec,
            payload={"page_content": text, "metadata": meta},
        ))

    for i in range(0, len(points), 100):
        client.upsert(collection_name=C.COLLECTION, wait=True, points=points[i:i + 100])

    return {"ok": True, "documents": len(docs), "points": len(points),
            "sparse": have_sparse, "by_type": _count_by_type(docs)}


def _count_by_type(docs):
    out = {}
    for d in docs:
        t = d["metadata"]["type"]
        out[t] = out.get(t, 0) + 1
    return out


def source_counts(db):
    """인덱싱 없이 집계 가능 건수만 (대시보드 표시용)."""
    return _count_by_type(aggregate_documents(db))
