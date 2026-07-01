"""홈 화면 KPI / 카드 데이터 — DB 집계."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from database import get_db
import models

router = APIRouter(prefix="/api/home", tags=["home"])


GUGUN = ['부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
         '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구']


def _count(db, model, col):
    try:
        return db.query(func.count(col)).scalar() or 0
    except Exception:
        return 0


def _cnt_region(db, q, col, region):
    """region(구) 지정 시 col contains 구 로 필터한 건수."""
    try:
        if region:
            q = q.filter(col.contains(region))
        return q.count()
    except Exception:
        return 0


@router.get("/stats")
def home_stats(region: str = None, db: Session = Depends(get_db)):
    """region(구·군) 지정 시 해당 구 통계, 미지정 시 부산전체."""
    if region:
        reports = _cnt_region(db, db.query(models.Report), models.Report.region, region)
        proposals = _cnt_region(db, db.query(models.NewProposal), models.NewProposal.region, region)
        diagnoses = _cnt_region(db, db.query(models.ChecklistResult), models.ChecklistResult.진단지역, region)
        surveys = _cnt_region(db, db.query(models.SurveyChatInterview), models.SurveyChatInterview.location_bucket, region)
    else:
        reports = _count(db, models.Report, models.Report.id)
        proposals = _count(db, models.NewProposal, models.NewProposal.id)
        diagnoses = _count(db, models.ChecklistResult, models.ChecklistResult.result_id)
        surveys = _count(db, models.SurveyChatSession, models.SurveyChatSession.session_id) \
            + _count(db, models.SurveyResponse, models.SurveyResponse.id)
    return {
        "region": region or "부산전체",
        "reports_count": reports, "proposals_count": proposals,
        "diagnoses_count": diagnoses, "surveys_count": surveys,
        "citizens_count": _count(db, models.Persona, models.Persona.id),
        "total": reports + proposals + diagnoses + surveys,
    }


_DONG_SUFFIX = ('동', '읍', '면')


def _dong_of(region, gu):
    """region 문자열에서 구(gu) 다음 읍·면·동 토큰 추출. 없으면 None."""
    if not region:
        return None
    # 구 이후 부분 우선
    tail = region.split(gu, 1)[1].strip() if gu in region else region
    for tok in tail.replace(',', ' ').split():
        if tok.endswith(_DONG_SUFFIX) and len(tok) >= 2:
            return tok
    # 전체에서 동 토큰 탐색
    for tok in region.replace(',', ' ').split():
        if tok.endswith(_DONG_SUFFIX) and len(tok) >= 2 and tok not in GUGUN:
            return tok
    return None


@router.get("/district-ranking")
def district_ranking(limit: int = 5, region: str = None, db: Session = Depends(get_db)):
    """region 미지정: 구·군 랭킹. region(구) 지정: 해당 구의 읍·면·동 랭킹.
    참여 합계(제보+제안+진단) 기준, 공개용."""
    def all_regions():
        out = []
        for model, col, idc in (
            (models.Report, models.Report.region, models.Report.id),
            (models.NewProposal, models.NewProposal.region, models.NewProposal.id),
            (models.ChecklistResult, models.ChecklistResult.진단지역, models.ChecklistResult.result_id),
        ):
            try:
                out += db.query(col, func.count(idc)).group_by(col).all()
            except Exception:
                pass
        return out

    rows = all_regions()
    totals = {}
    if region:
        # 읍·면·동 랭킹
        for r, c in rows:
            if not r or region not in r:
                continue
            dong = _dong_of(r, region)
            if dong:
                totals[dong] = totals.get(dong, 0) + c
    else:
        # 구·군 랭킹
        totals = {g: 0 for g in GUGUN}
        for r, c in rows:
            if not r:
                continue
            for g in GUGUN:
                if g in r:
                    totals[g] += c
                    break

    ranked = sorted(({"region": k, "count": v} for k, v in totals.items()), key=lambda x: x["count"], reverse=True)
    return ranked[:limit]


@router.get("/citizens")
def home_citizens(db: Session = Depends(get_db)):
    rows = db.query(models.Persona).limit(8).all()
    out = []
    for p in rows:
        tags = p.tags
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except Exception:
                tags = []
        out.append({
            "id": p.id,
            "name": p.name,
            "age": p.age or 0,
            "tags": tags or [],
            "desc": p.quote or "",
        })
    return out


@router.get("/archives")
def home_archives(db: Session = Depends(get_db)):
    """우수 사례 — 좋아요 많은 제안 top 6."""
    rows = (
        db.query(models.NewProposal)
        .order_by(models.NewProposal.likes_count.desc())
        .limit(6)
        .all()
    )
    result = []
    for p in rows:
        files = []
        if p.files:
            try:
                files = json.loads(p.files) if isinstance(p.files, str) else p.files
            except Exception:
                files = []
        result.append({
            "id": p.id,
            "title": p.title,
            "desc": (p.content or "")[:80],
            "img": files[0] if files else None,
        })
    return result
