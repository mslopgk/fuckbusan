from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys

# [추가] backend 디렉토리를 모듈 경로에 추가하여 routers 임포트 가능하게 함
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

import logging
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from sqlalchemy import text

# Routers
from routers import dashboard, ai, user_router, checklist_router, report_router, survey_router, home_router, admin_router, notification_router, search_router, ai_citizens

import models
from database import engine

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Check DB Connection & Create Tables
    try:
        logger.info("Startup: Checking database connection...")
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Startup: Database connection successful.")
        
        logger.info("Startup: Creating tables...")
        models.Base.metadata.create_all(bind=engine)
        logger.info("Startup: Tables created successfully.")

        # Safe column migrations — silently ignored if column already exists
        with engine.connect() as conn:
            for stmt in [
                "ALTER TABLE checklist_result ADD COLUMN 진단대상 VARCHAR(50) NULL",
            ]:
                try:
                    conn.execute(text(stmt))
                    conn.commit()
                except Exception:
                    pass
    except Exception as e:
        logger.error(f"Startup Error: Database connection failed. {e}")
        # We don't exit to allow frontend to serve even if DB fails, but dependent APIs will fail.
    
    yield
    
    # Shutdown
    logger.info("Shutdown: Application stopping...")

app = FastAPI(
    title="부산시 지능형 공공디자인 통합 진단 플랫폼 API",
    lifespan=lifespan
)

# Lambda 환경 감지 (AWS_LAMBDA_FUNCTION_NAME 자동 주입)
IS_LAMBDA = bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

# CORS — 로컬 dev + CloudFront 배포 모두 허용
_cors_origins = ["*"]
_extra_origins = os.getenv("CORS_ORIGINS", "")  # CloudFront URL 등 콤마 구분
if _extra_origins:
    _cors_origins = [o.strip() for o in _extra_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(user_router.router)
app.include_router(checklist_router.router)
app.include_router(report_router.router)
app.include_router(survey_router.router)
app.include_router(home_router.router)
app.include_router(admin_router.router)
app.include_router(notification_router.router)
app.include_router(search_router.router)
app.include_router(ai_citizens.router)

# Static Files & Frontend Serving (로컬 전용 — Lambda/CloudFront 환경에선 스킵)
current_dir = os.path.dirname(os.path.abspath(__file__))

# 업로드 디렉토리 — 로컬 파일 저장 폴백용 (Lambda에선 /tmp 써야 하므로 조건부)
if IS_LAMBDA:
    uploads_dir = "/tmp/uploads"
else:
    uploads_dir = os.path.join(current_dir, "uploads")
os.makedirs(os.path.join(uploads_dir, "avatars"), exist_ok=True)

if not IS_LAMBDA:
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

    dist_dir = os.path.join(current_dir, "../dist")
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/")
def read_root():
    return {"message": "Busan Design Backend is Running!"}


if not IS_LAMBDA:
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        dist_dir = os.path.join(current_dir, "../dist")
        file_path = os.path.join(dist_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        if full_path in ["favicon.ico", "favicon.svg", "apple-touch-icon.png"]:
            raise HTTPException(status_code=404, detail="Icon not found")
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend build not found. Please run 'npm run build'."}

# Lambda 핸들러
from mangum import Mangum
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)