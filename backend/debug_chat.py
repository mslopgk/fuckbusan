import asyncio
import os
from dotenv import load_dotenv
from ai_service import ai_service

# Load env to ensure key is available if not already loaded by module
load_dotenv()

async def test_chat():
    print(f"API Key present: {'Yes' if os.getenv('OPENAI_API_KEY') else 'No'}")
    
    context = {
        "district": "해운대구",
        "year": "2026",
        "score": 85.5,
        "grade": "A"
    }
    history = []
    message = "해운대구의 안전 상태는 어때?"
    
    print("Sending request to OpenAI...")
    try:
        response = await ai_service.chat_with_context(message, history, context)
        print("Response received:")
        print(response)
    except Exception as e:
        print(f"FATAL ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_chat())
