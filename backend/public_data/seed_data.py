"""공공데이터 대시보드 실데이터 시드.

모든 수치는 실제 공개 출처에서 수집(2026-06 리서치). 구 단위 전수 확보 지표만 구별로,
나머지는 부산 전체/부산진구 기준으로 표기. 출처 URL 포함.
구 단위 미확보(인구 피라미드 등)는 시드하지 않고 프론트에서 '예시'로 표기.
"""

SRC = {
    "pop": "행정안전부 주민등록인구(2026-05) / 통계청",
    "taas": "한국도로교통공단 TAAS 시군구별 교통사고(2024)",
    "lib": "문화체육관광부 2024 전국 문화기반시설 총람(2024.1.1)",
    "cctv": "data.go.kr/data/15092265 부산진구 방범용 CCTV(2025-11)",
    "pm": "에어코리아/국가환경지표 부산 대기질(2023)",
    "shelter": "행정안전부·KNN 부산 무더위쉼터(2024)",
    "startup": "부산상공회의소 신설법인 동향(2023)",
    "house": "KOSIS 구·군별 세대 및 등록인구 / 부산진구(2021)",
    "school": "부산광역시교육청 교육기본통계(2024)",
}

# ── 16개 구·군: 총인구(2026-05), 교통사고 발생/사망/부상(TAAS 2024), 공공도서관 수(2024) ──
DISTRICTS = [
    # region,        pop,     acc,  dth, inj,   lib
    ("부산진구",     365104, 1373, 21, 1786,  4),
    ("해운대구",     370920,  739,  3,  980,  7),
    ("사하구",       282633,  830,  8, 1035,  2),
    ("동래구",       271437,  734, 10,  977,  4),
    ("북구",         260994,  656,  5,  896,  5),
    ("남구",         254174,  782,  7, 1082,  2),
    ("연제구",       211509,  637,  2,  846,  3),
    ("금정구",       205968,  679,  7,  955,  3),
    ("사상구",       192718,  644, 11,  845,  2),
    ("기장군",       175273,  616, 12,  906,  7),
    ("수영구",       168513,  828,  3, 1115,  3),
    ("강서구",       153175,  723,  6,  962,  3),
    ("서구",         101320,  377,  3,  497,  1),
    ("영도구",       100748,  222,  4,  284,  2),
    ("동구",          83432,  466,  6,  622,  3),
    ("중구",          36375,  361,  3,  534,  1),
]

# ── 부산 인구 추이 (실측 시점) ──
POP_TREND = [
    (2005, 3439916), (2015, 3448737), (2020, 3349016),
    (2024, 3266598), (2025, 3241600), (2026, 3234293),
]

# ── 통계 리스트 (테마별 핵심 지표) — region 라벨로 부산진구/부산 구분 ──
# theme, region, metric, value_text, year, note, source_key, order
THEME_STATS = [
    ("안전",        "부산진구", "방범용 CCTV",     "1,130대",     "2025", None,            "cctv",    1),
    ("교통",        "부산진구", "교통사고 발생",   "1,373건",     "2024", "부산 16개 구·군 중 최다", "taas", 2),
    ("환경",        "부산",     "미세먼지(PM10)",  "31㎍/㎥",      "2023", "7대 특·광역시 최저권", "pm",    3),
    ("문화·여가",   "부산진구", "공공도서관",      "4개관",       "2024", None,            "lib",     4),
    ("보건·복지",   "부산",     "무더위쉼터",      "915곳",       "2024", None,            "shelter", 5),
    ("산업·일자리", "부산",     "신설법인",        "4,495개",     "2023", "부산진구 비중 3위(9.6%)", "startup", 6),
    ("주거",        "부산진구", "세대수",          "173,353세대", "2021", None,            "house",   7),
    ("교육",        "부산",     "학교(초·중·고)",  "616교",       "2024", None,            "school",  8),
]

# ── 공공데이터 리스트(지도 레이어): 실건수 확보분만 채움, 나머지 null(미확정) ──
# key, label, region, count, source_key|None, order
LAYERS = [
    ("walk",    "통행불편지역",   None,      None, None,      1),
    ("bell",    "비상벨",         None,      None, None,      2),
    ("lamp",    "보안등",         None,      None, None,      3),
    ("cctv",    "안심이CCTV",     "부산진구", 1130, "cctv",    4),
    ("shelter", "무더위쉼터",     "부산",     915,  "shelter", 5),
    ("child",   "어린이보호구역", None,      None, None,      6),
    ("wifi",    "공공와이파이",   None,      None, None,      7),
    ("toilet",  "공중화장실",     None,      None, None,      8),
    ("fire",    "소화전",         None,      None, None,      9),
]


def seed_public_data(db):
    """idempotent: 기존 행 비우고 실데이터 재적재 (참조 테이블, 소량)."""
    import models
    db.query(models.PublicDistrict).delete()
    db.query(models.PublicPopTrend).delete()
    db.query(models.PublicThemeStat).delete()
    db.query(models.PublicLayer).delete()

    for region, pop, acc, dth, inj, lib in DISTRICTS:
        db.add(models.PublicDistrict(region=region, population=pop, accidents=acc,
                                     acc_deaths=dth, acc_injuries=inj, libraries=lib))
    for year, val in POP_TREND:
        db.add(models.PublicPopTrend(region="부산광역시", year=year, value=val, source=SRC["pop"]))
    for theme, region, metric, vtext, year, note, skey, order in THEME_STATS:
        db.add(models.PublicThemeStat(theme=theme, region=region, metric=metric, value_text=vtext,
                                      year=year, note=note, source=SRC.get(skey), sort_order=order))
    for key, label, region, count, skey, order in LAYERS:
        db.add(models.PublicLayer(key=key, label=label, region=region, count=count,
                                  source=SRC.get(skey) if skey else None, sort_order=order))
    db.commit()
    return {
        "districts": len(DISTRICTS), "pop_trend": len(POP_TREND),
        "theme_stats": len(THEME_STATS), "layers": len(LAYERS),
    }
