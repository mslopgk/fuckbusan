from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from ai_service import ai_service

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
