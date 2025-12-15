import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            print("Warning: OPENAI_API_KEY is missing in .env")
            self.client = None
        else:
            self.client = AsyncOpenAI(api_key=self.api_key)
        
        # Simple in-memory cache
        self.cache = {}

    async def analyze_safety(self, district: str, year: str, data_summary: dict):
        cache_key = f"{year}_{district}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        if not self.client:
            return "AI 서비스 설정을 확인해주세요 (API KEY 누락)."

        system_prompt = (
            "당신은 부산시의 공공디자인 및 도시 안전 전문가 AI입니다. "
            "주어진 데이터를 바탕으로 해당 구의 도시 안전, 환경, 범죄예방 디자인(CPTED) 관점에서 "
            "간결하고 명확한 진단과 개선 방안을 한국어로 제시해주세요. "
            "답변은 마크다운 형식을 사용하여 가독성 있게 작성하세요."
        )

        user_prompt = f"""
        분석 대상: 부산광역시 {district}
        대상 연도: {year}
        
        주요 데이터 요약:
        - 종합 안전 점수: {data_summary.get('score', 'N/A')}
        - 등급: {data_summary.get('grade', 'N/A')}
        - 주요 지표: {json.dumps(data_summary.get('analysis', []), ensure_ascii=False)}
        
        위 데이터를 바탕으로 다음 두 가지 항목에 대해 300자 내외로 요약 분석해주세요:
        1. 🔍 **안전 진단**: 현재 취약점과 긍정적인 요소
        2. 💡 **개선 제안**: 공공디자인을 통한 구체적인 해결 방안 (예: 조명 개선, CCTV 사각지대 보완, 안심 귀갓길 조성 등)
        """

        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=600
            )
            result = response.choices[0].message.content
            self.cache[cache_key] = result
            return result
        except Exception as e:
            # Fallback for demonstration when API Key is invalid or quota exceeded
            return (
                f"⚠️ AI 연결 문제로 인한 가상 분석 결과입니다.\n\n"
                f"### 🔍 {year}년 {district} 안전 진단 요약\n"
                f"- **안전 등급**: {data_summary.get('grade')} ({data_summary.get('score')}점)\n"
                f"- **현황**: 전반적인 안전 지수는 양호하나, 야간 보행 안전 취약 구간이 일부 식별되었습니다.\n\n"
                f"### 💡 개선 제안\n"
                f"1. **조명 환경 개선**: 어두운 골목길에 스마트 가로등 추가 설치를 권장합니다.\n"
                f"2. **CCTV 보강**: 사각지대에 지능형 CCTV를 확충하여 범죄 예방 효과를 높일 수 있습니다.\n"
                f"3. **안심 귀갓길**: 주민들의 의견을 반영한 안심 귀갓길 노선을 정비할 필요가 있습니다."
            )

    async def chat_with_context(self, message: str, history: list, context: dict):
        # Fallback/Simulation if API key is missing
        if not self.client:
            return self._get_mock_response(message, context)

        # Construct System Prompt with Context
        district = context.get('district', '부산시 전체')
        year = context.get('year', '2026')
        score = context.get('score', '-')
        grade = context.get('grade', '-')
        
        system_prompt = (
            f"당신은 부산시 {district}의 공공디자인 및 도시 안전 전문가 'BDP 봇'입니다. "
            f"현재 사용자는 {year}년도 데이터를 보고 있습니다. "
            f"해당 지역의 종합 안전 점수는 {score}점(등급: {grade})입니다. "
            "사용자의 질문에 대해 이 데이터를 바탕으로 친절하고 전문적으로 답변해주세요. "
            "답변은 200자 이내로 간결하게 핵심만 전달하세요."
        )

        # Build messages including history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (limit to last 6 messages to save tokens)
        for msg in history[-6:]:
            messages.append({"role": msg.get("role"), "content": msg.get("content")})
            
        # Add current user message
        messages.append({"role": "user", "content": message})

        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=300
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"DEBUG: Chat API Error: {str(e)}")
            # Fallback to mock if API fails (quota related or connection)
            return self._get_mock_response(message, context)

    def _get_mock_response(self, message: str, context: dict):
        """Generates a simulated response based on context and message keywords."""
        msg = message.lower()
        district = context.get('district', '해당 지역')
        
        # Check if talking to a Specific Persona
        persona = context.get('targetPersona')
        if persona:
            name = persona.get('name', '주민')
            # Simple keyword logic for Persona
            if any(x in msg for x in ['안녕', '반가', '하이']):
                return f"예, 반갑습니데이. 내는 {name}이라 합니다. 뭐 도와드릴까예?"
            if any(x in msg for x in ['불편', '문제', '힘들']):
                pain = persona.get('pain_points', ['안전 문제'])[0] if isinstance(persona.get('pain_points'), list) else '이 동네 안전'
                return f"마, 말도 마이소. 요즘 {pain} 때문에 걱정이 태산입니더. 해결 좀 해주이소."
            if any(x in msg for x in ['해결', '제안', '개선']):
                 return "그래해주면 진짜 살기 좋아지겠네예. 기대해보겠습니더!"
            return f"{name} 입장에서 말씀드리자면, 우리 {district}에는 좀 더 세심한 배려가 필요합니더. (AI 시뮬레이션 응답)"

        # General Assistant Logic
        score = context.get('score', 0)
        grade = context.get('grade', 'N/A')
        
        if any(x in msg for x in ['안녕', '반가', '하세요']):
            return f"안녕하세요! {district} 공공디자인 진단 플랫폼입니다. 현재 이 지역의 안전 등급은 {grade}등급입니다. 무엇을 도와드릴까요?"
        if any(x in msg for x in ['위험', '안전', '점수']):
            return f"현재 {district}의 종합 안전 점수는 {score}점입니다. 주요 취약 지역에 대한 CPTED(범죄예방디자인) 도입이 권장됩니다."
        if any(x in msg for x in ['분석', '진단']):
            return f"데이터 분석 결과, {district}은(는) 야간 보행 환경 개선이 시급한 것으로 나타났습니다. 상세 위협 요소를 지도에서 확인해보세요."
            
        return "죄송합니다, 제가 정확히 이해하지 못했습니다. 안전 진단이나 디자인 개선 방향에 대해 질문해주시면 답변 드리겠습니다. (데모 모드)"

ai_service = AIService()
