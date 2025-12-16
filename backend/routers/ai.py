from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List

# [주의] ai_service.py 파일이 backend 폴더 안에 있어야 합니다!
try:
    from ai_service import ai_service
except ImportError:
    # 혹시 파일이 없어도 서버가 죽지는 않게 처리
    ai_service = None 

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])

class AnalysisRequest(BaseModel):
    year: str
    district: str
    data_summary: Dict[str, Any]

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]
    context: Dict[str, Any]

@router.post("/analyze")
async def analyze_data(request: AnalysisRequest):
    if ai_service is None:
        raise HTTPException(status_code=503, detail="AI 서비스 파일(ai_service.py)을 찾을 수 없습니다.")
        
    try:
        if request.district == 'all':
            return {"analysis": "전체 지역에 대한 상세 AI 분석을 보려면 특정 구/군을 선택해주세요."}

        result = await ai_service.analyze_safety(
            district=request.district,
            year=request.year,
            data_summary=request.data_summary
        )
        return {"analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(request: ChatRequest):
    if ai_service is None:
        raise HTTPException(status_code=503, detail="AI 서비스 파일(ai_service.py)을 찾을 수 없습니다.")

    try:
        response = await ai_service.chat_with_context(
            message=request.message,
            history=request.history,
            context=request.context
        )
        return {"response": response}
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))