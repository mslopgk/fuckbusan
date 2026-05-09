from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel
import httpx
import base64
import os

router = APIRouter(prefix="/api/ai-citizens", tags=["AI Citizens"])

_ROUTERS_DIR = os.path.dirname(os.path.abspath(__file__))
_IS_LAMBDA = bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
AVATARS_DIR = (
    "/tmp/uploads/avatars" if _IS_LAMBDA
    else os.path.join(_ROUTERS_DIR, "..", "uploads", "avatars")
)


class AICitizen(BaseModel):
    id: int
    name: str
    age: int
    district: str
    tags: List[str]
    categories: List[str]
    quote: str
    avatar_initial: str
    importance: int


MOCK_CITIZENS: List[dict] = [
    {
        "id": 1, "name": "이서연", "age": 22, "district": "해운대구", "gender": "여성",
        "tags": ["#대학생", "#카페탐방러", "#야간도보족"],
        "categories": ["안전", "교통"],
        "quote": "늦게까지 공부하고 집에 갈 때 골목이 어두워서 늘 불안해요. 학교에서 집까지 이어지는 길에 가로등을 조금만 더 밝혀주면 좋겠어요.",
        "avatar_initial": "이", "importance": 1,
    },
    {
        "id": 2, "name": "김민준", "age": 35, "district": "부산진구", "gender": "남성",
        "tags": ["#직장인", "#대중교통이용자", "#환경관심"],
        "categories": ["교통", "환경"],
        "quote": "출퇴근 버스가 너무 붐벼서 힘들어요. 배차 간격이 줄어들면 대중교통 이용률도 올라갈 것 같아요.",
        "avatar_initial": "김", "importance": 2,
    },
    {
        "id": 3, "name": "박지은", "age": 42, "district": "남구", "gender": "여성",
        "tags": ["#워킹맘", "#학부모", "#등하굣길걱정"],
        "categories": ["교육", "안전"],
        "quote": "아이 등하굣길에 횡단보도가 너무 적어요. 어린이 보호구역인데도 차가 빨리 달려서 매일 마음이 조마조마해요.",
        "avatar_initial": "박", "importance": 3,
    },
    {
        "id": 4, "name": "최동현", "age": 67, "district": "동구", "gender": "남성",
        "tags": ["#은퇴자", "#산책애호가", "#복지서비스이용"],
        "categories": ["보건복지", "환경"],
        "quote": "동네 공원 벤치가 많이 낡았어요. 어르신들이 쉬기 좋은 그늘 쉼터가 더 생겼으면 합니다.",
        "avatar_initial": "최", "importance": 4,
    },
    {
        "id": 5, "name": "이수빈", "age": 28, "district": "서구", "gender": "여성",
        "tags": ["#1인가구", "#야간근무자", "#주거비부담"],
        "categories": ["안전", "주거"],
        "quote": "야간에 귀가할 때 골목이 너무 어둡고 CCTV도 없어서 무서워요. 주거 안전 환경이 개선됐으면 해요.",
        "avatar_initial": "이", "importance": 5,
    },
    {
        "id": 6, "name": "강태양", "age": 31, "district": "강서구", "gender": "남성",
        "tags": ["#스타트업창업자", "#커뮤니티활동가", "#청년창업"],
        "categories": ["산업일자리", "문화여가"],
        "quote": "청년 창업 공간이 너무 부족해요. 빈 공공건물을 코워킹 스페이스로 바꿔주면 지역 경제에도 도움이 될 것 같아요.",
        "avatar_initial": "강", "importance": 6,
    },
    {
        "id": 7, "name": "윤미라", "age": 55, "district": "사하구", "gender": "여성",
        "tags": ["#상인", "#전통시장", "#소상공인"],
        "categories": ["산업일자리", "교통"],
        "quote": "전통시장 앞에 주차 공간이 없어서 손님이 많이 줄었어요. 공영주차장이 근처에 생기면 좋겠어요.",
        "avatar_initial": "윤", "importance": 7,
    },
    {
        "id": 8, "name": "정하늘", "age": 19, "district": "금정구", "gender": "여성",
        "tags": ["#고등학생", "#운동선수", "#청소년문화"],
        "categories": ["교육", "문화여가"],
        "quote": "방과 후에 운동할 수 있는 공공 체육 시설이 부족해요. 청소년 전용 공간이 더 많아지면 좋겠어요.",
        "avatar_initial": "정", "importance": 8,
    },
    {
        "id": 9, "name": "홍수아", "age": 44, "district": "수영구", "gender": "여성",
        "tags": ["#장애인", "#복지서비스이용자", "#배리어프리"],
        "categories": ["보건복지", "주거"],
        "quote": "휠체어를 타고 다니면 턱이 너무 많아서 힘들어요. 보도 턱낮추기 공사를 더 빨리 진행해 주세요.",
        "avatar_initial": "홍", "importance": 9,
    },
    {
        "id": 10, "name": "오준혁", "age": 38, "district": "북구", "gender": "남성",
        "tags": ["#환경활동가", "#텃밭가드너", "#친환경생활"],
        "categories": ["환경", "문화여가"],
        "quote": "아파트 단지 내 공용 텃밭이 있으면 주민들이 함께 가꾸며 소통할 수 있을 것 같아요. 빈 공터 활용이 아쉬워요.",
        "avatar_initial": "오", "importance": 10,
    },
    # --- 2nd persona per existing district ---
    {
        "id": 11, "name": "박서준", "age": 29, "district": "해운대구", "gender": "남성",
        "tags": ["#직장인", "#야간러너", "#해수욕장단골"],
        "categories": ["환경", "문화여가"],
        "quote": "해운대 해변 야간 러닝 코스에 조명이 부족해요. 안전하게 운동할 수 있는 환경이 만들어졌으면 합니다.",
        "avatar_initial": "박", "importance": 11,
    },
    {
        "id": 12, "name": "조은희", "age": 48, "district": "부산진구", "gender": "여성",
        "tags": ["#자영업자", "#서면상권", "#골목상인"],
        "categories": ["산업일자리", "교통"],
        "quote": "서면 이면도로에 배달 차량이 너무 많아서 보행자가 위험해요. 보행자 우선도로 지정이 필요합니다.",
        "avatar_initial": "조", "importance": 12,
    },
    {
        "id": 13, "name": "이민호", "age": 40, "district": "남구", "gender": "남성",
        "tags": ["#회사원", "#용호동거주", "#출퇴근족"],
        "categories": ["교통", "환경"],
        "quote": "용호동에서 지하철역까지 버스 연결이 불편해요. 순환버스 하나만 있어도 출퇴근이 훨씬 편해질 것 같아요.",
        "avatar_initial": "이", "importance": 13,
    },
    {
        "id": 14, "name": "최지영", "age": 33, "district": "동구", "gender": "여성",
        "tags": ["#초량시장단골", "#혼자사는직장인", "#야경매니아"],
        "categories": ["안전", "문화여가"],
        "quote": "초량 이바구길 야간 조명이 예쁘긴 한데, 골목 일부는 너무 어두워서 혼자 걷기 무서워요.",
        "avatar_initial": "최", "importance": 14,
    },
    {
        "id": 15, "name": "황지수", "age": 26, "district": "서구", "gender": "여성",
        "tags": ["#간호사", "#야간교대근무", "#1인가구"],
        "categories": ["안전", "보건복지"],
        "quote": "야간 교대 후 귀가할 때 버스가 끊겨 택시를 타야 해요. 심야 공공교통이 한 노선이라도 늘어나면 좋겠어요.",
        "avatar_initial": "황", "importance": 15,
    },
    {
        "id": 16, "name": "김상철", "age": 52, "district": "강서구", "gender": "남성",
        "tags": ["#물류센터직원", "#자전거통근자", "#지역주민"],
        "categories": ["교통", "안전"],
        "quote": "강서구에서 사상역까지 자전거 도로가 끊겨서 차도를 달려야 할 때가 많아요. 연결 자전거도로가 필요합니다.",
        "avatar_initial": "김", "importance": 16,
    },
    {
        "id": 17, "name": "박연수", "age": 37, "district": "사하구", "gender": "여성",
        "tags": ["#학부모", "#감천문화마을", "#커뮤니티활동"],
        "categories": ["교육", "문화여가"],
        "quote": "감천문화마을 주변 어린이 놀이공간이 너무 낡았어요. 아이들이 안전하게 뛰어놀 수 있는 공간이 필요합니다.",
        "avatar_initial": "박", "importance": 17,
    },
    {
        "id": 18, "name": "임재현", "age": 21, "district": "금정구", "gender": "남성",
        "tags": ["#부산대학생", "#자취생", "#배달앱의존"],
        "categories": ["주거", "산업일자리"],
        "quote": "부산대 주변 원룸이 너무 비싸요. 공공 청년 주택이 캠퍼스 가까이 생기면 많은 학생들에게 도움이 될 거예요.",
        "avatar_initial": "임", "importance": 18,
    },
    {
        "id": 19, "name": "최수민", "age": 43, "district": "수영구", "gender": "여성",
        "tags": ["#광안리카페사장", "#젠트리피케이션우려", "#지역상인"],
        "categories": ["산업일자리", "주거"],
        "quote": "광안리 임대료가 너무 올라서 오래된 가게들이 밀려나고 있어요. 상권 보호 정책이 필요합니다.",
        "avatar_initial": "최", "importance": 19,
    },
    {
        "id": 20, "name": "강민서", "age": 60, "district": "북구", "gender": "여성",
        "tags": ["#아파트부녀회", "#구포시장단골", "#경로당이용자"],
        "categories": ["보건복지", "교통"],
        "quote": "구포시장에서 집까지 언덕길이 가팔라서 무릎이 아파요. 경사 완화 공사나 에스컬레이터가 있으면 좋겠어요.",
        "avatar_initial": "강", "importance": 20,
    },
    # --- New districts (기장군, 사상구, 동래구, 연제구, 영도구, 중구) ---
    {
        "id": 21, "name": "윤성호", "age": 45, "district": "기장군", "gender": "남성",
        "tags": ["#어촌계원", "#수산업종사자", "#기장미역"],
        "categories": ["산업일자리", "환경"],
        "quote": "기장 바다 수질 오염이 걱정돼요. 미역 양식에 영향이 생기기 전에 해양 환경 보호 대책이 마련됐으면 합니다.",
        "avatar_initial": "윤", "importance": 21,
    },
    {
        "id": 22, "name": "서지안", "age": 31, "district": "기장군", "gender": "여성",
        "tags": ["#카페창업준비생", "#귀농이주민", "#전원생활선호"],
        "categories": ["산업일자리", "주거"],
        "quote": "기장에 젊은 창업자들을 위한 지원 프로그램이 있으면 좋겠어요. 귀농귀촌 청년들이 더 쉽게 자리잡을 수 있게요.",
        "avatar_initial": "서", "importance": 22,
    },
    {
        "id": 23, "name": "권태호", "age": 39, "district": "사상구", "gender": "남성",
        "tags": ["#제조업직원", "#공단근처거주", "#소음민원경험"],
        "categories": ["환경", "보건복지"],
        "quote": "사상 공단 인근 소음과 분진이 심해요. 방음벽 설치와 공기질 개선이 이루어지면 주민 건강에 도움이 될 거예요.",
        "avatar_initial": "권", "importance": 23,
    },
    {
        "id": 24, "name": "오소연", "age": 27, "district": "사상구", "gender": "여성",
        "tags": ["#물류스타트업", "#대중교통의존", "#신혼부부"],
        "categories": ["교통", "주거"],
        "quote": "사상역 주변 주차 공간이 부족해서 매일 고생해요. 공영주차장 확충과 환승 편의 시설이 더 갖춰지면 좋겠어요.",
        "avatar_initial": "오", "importance": 24,
    },
    {
        "id": 25, "name": "문재영", "age": 55, "district": "동래구", "gender": "남성",
        "tags": ["#동래온천단골", "#지역원로", "#전통문화애호가"],
        "categories": ["문화여가", "보건복지"],
        "quote": "동래 온천 문화가 점점 사라지는 것 같아 아쉬워요. 온천 관광 인프라를 현대화해서 지역 문화를 살려줬으면 합니다.",
        "avatar_initial": "문", "importance": 25,
    },
    {
        "id": 26, "name": "한나영", "age": 34, "district": "동래구", "gender": "여성",
        "tags": ["#유치원교사", "#육아맘", "#도보통근자"],
        "categories": ["교육", "안전"],
        "quote": "동래 유치원 통학로에 인도가 좁고 불법주차가 많아요. 어린이 안전을 위한 통학로 정비가 시급합니다.",
        "avatar_initial": "한", "importance": 26,
    },
    {
        "id": 27, "name": "김동우", "age": 42, "district": "연제구", "gender": "남성",
        "tags": ["#공무원", "#연산동거주", "#자전거애호가"],
        "categories": ["교통", "환경"],
        "quote": "연제구 도심에 자전거 거치대가 너무 부족해요. 공공자전거 스테이션이 더 많이 생기면 출퇴근이 훨씬 편해질 것 같아요.",
        "avatar_initial": "김", "importance": 27,
    },
    {
        "id": 28, "name": "박혜진", "age": 50, "district": "연제구", "gender": "여성",
        "tags": ["#아파트부녀회장", "#복지관이용자", "#5060세대"],
        "categories": ["보건복지", "주거"],
        "quote": "연제구 노인복지관이 하나밖에 없어요. 어르신들이 걸어서 다닐 수 있는 작은 복지 공간이 더 생겼으면 합니다.",
        "avatar_initial": "박", "importance": 28,
    },
    {
        "id": 29, "name": "장민국", "age": 58, "district": "영도구", "gender": "남성",
        "tags": ["#조선소퇴직자", "#절영해안산책로", "#어르신봉사자"],
        "categories": ["산업일자리", "문화여가"],
        "quote": "영도 조선소 인근 유휴 부지를 문화 공간으로 바꿔주면 좋겠어요. 지역 재생과 일자리 창출에도 도움이 될 거예요.",
        "avatar_initial": "장", "importance": 29,
    },
    {
        "id": 30, "name": "이채원", "age": 23, "district": "영도구", "gender": "여성",
        "tags": ["#예술대학생", "#영도힙스터", "#공방운영희망"],
        "categories": ["문화여가", "산업일자리"],
        "quote": "영도에 청년 예술가를 위한 저렴한 작업 공간이 부족해요. 빈 창고나 공장을 예술 공간으로 개조해 주면 좋겠어요.",
        "avatar_initial": "이", "importance": 30,
    },
    {
        "id": 31, "name": "송기철", "age": 62, "district": "중구", "gender": "남성",
        "tags": ["#국제시장상인", "#전통시장지킴이", "#관광상품판매"],
        "categories": ["산업일자리", "교통"],
        "quote": "국제시장 주변 주차가 너무 불편해서 외지 관광객들이 금방 떠나버려요. 공영주차장 연계 셔틀이 있으면 좋겠어요.",
        "avatar_initial": "송", "importance": 31,
    },
    {
        "id": 32, "name": "정미소", "age": 29, "district": "중구", "gender": "여성",
        "tags": ["#카페바리스타", "#남포동근무", "#야간귀가족"],
        "categories": ["안전", "교통"],
        "quote": "남포동 야간에 취객이 많아서 여성 혼자 귀가하기 무서워요. 안심귀가 서비스나 여성 안전 부스가 더 있으면 좋겠어요.",
        "avatar_initial": "정", "importance": 32,
    },
]

CATEGORY_MAP = {
    "all": None,
    "safety": "안전",
    "housing": "주거",
    "work": "산업일자리",
    "edu": "교육",
    "env": "환경",
    "culture": "문화여가",
    "health": "보건복지",
    "traffic": "교통",
}


def _avatar_path(citizen_id: int) -> str:
    return os.path.join(AVATARS_DIR, f"{citizen_id}.png")


def _avatar_url(citizen_id: int) -> str:
    return f"/uploads/avatars/{citizen_id}.png"


def _build_prompt(citizen: dict) -> str:
    age = citizen["age"]
    gender = citizen.get("gender", "남성")
    gender_en = "woman" if gender == "여성" else "man"
    gender_explicit = (
        "female woman with clearly feminine facial features and hairstyle"
        if gender == "여성"
        else "male man with clearly masculine facial features and hairstyle"
    )
    tags = [t.lstrip("#") for t in citizen["tags"][:3]]
    tag_desc = ", ".join(tags)
    return (
        f"3D cartoon avatar of a Korean {age}-year-old {gender_explicit}, "
        f"personality: {tag_desc}, "
        "Pixar-style 3D character, circular head-and-shoulders portrait, "
        "face centered in frame, pure white background, "
        "warm friendly smile, soft diffused studio lighting, "
        "consistent stylized 3D art, professional avatar illustration, "
        "no text, no watermark, no border"
    )


@router.get("", response_model=List[dict])
def list_citizens(
    district: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sort: Optional[str] = Query("importance"),
):
    result = list(MOCK_CITIZENS)

    if district and district != "전체":
        result = [c for c in result if c["district"] == district]

    cat_label = CATEGORY_MAP.get(category) if category else None
    if cat_label:
        result = [c for c in result if cat_label in c["categories"]]

    if sort == "age":
        result = sorted(result, key=lambda c: c["age"])
    else:
        result = sorted(result, key=lambda c: c["importance"])

    return result


@router.get("/{citizen_id}", response_model=dict)
def get_citizen(citizen_id: int):
    for c in MOCK_CITIZENS:
        if c["id"] == citizen_id:
            return c
    raise HTTPException(status_code=404, detail="시민을 찾을 수 없습니다.")


async def _generate_avatar(citizen_id: int) -> dict:
    """Imagen 4로 아바타 생성 후 디스크 저장. URL 딕셔너리 반환."""
    citizen = next((c for c in MOCK_CITIZENS if c["id"] == citizen_id), None)
    if not citizen:
        raise HTTPException(status_code=404, detail="시민을 찾을 수 없습니다.")

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured")

    prompt = _build_prompt(citizen)
    imagen_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"imagen-4.0-fast-generate-001:predict?key={api_key}"
    )

    async with httpx.AsyncClient(timeout=90.0) as client:
        resp = await client.post(imagen_url, json={
            "instances": [{"prompt": prompt}],
            "parameters": {"sampleCount": 1, "aspectRatio": "1:1"},
        })
        resp.raise_for_status()
        data = resp.json()

    b64 = data["predictions"][0]["bytesBase64Encoded"]
    img_bytes = base64.b64decode(b64)

    os.makedirs(AVATARS_DIR, exist_ok=True)
    path = _avatar_path(citizen_id)
    with open(path, "wb") as f:
        f.write(img_bytes)

    return {"url": _avatar_url(citizen_id), "cached": False}


@router.get("/{citizen_id}/avatar")
async def get_citizen_avatar(citizen_id: int):
    """캐시된 아바타 URL 반환; 없으면 Imagen 4로 생성 후 서버 저장."""
    path = _avatar_path(citizen_id)
    if os.path.exists(path):
        return {"url": _avatar_url(citizen_id), "cached": True}
    return await _generate_avatar(citizen_id)


@router.post("/{citizen_id}/avatar/regenerate")
async def regenerate_citizen_avatar(citizen_id: int):
    """캐시 삭제 후 Imagen 4로 재생성."""
    path = _avatar_path(citizen_id)
    if os.path.exists(path):
        os.remove(path)
    return await _generate_avatar(citizen_id)
