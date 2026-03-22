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
from routers import auth, dashboard, ai, user_router, checklist_router, report_router

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

# CORS Configuration
origins = [
    "http://localhost:8501",
    "http://127.0.0.1:8501",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(user_router.router)
app.include_router(checklist_router.router)
app.include_router(report_router.router)

# Static Files & Frontend Serving
current_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(current_dir, "../dist")
assets_dir = os.path.join(dist_dir, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# uploads folder
uploads_dir = os.path.join(current_dir, "uploads")
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Busan Design Backend is Running!"}

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # Static files check (images, assets etc.)
    file_path = os.path.join(dist_dir, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Specific 404 for common browser-auto-requested icons if they aren't provided
    if full_path in ["favicon.ico", "favicon.svg", "apple-touch-icon.png"]:
        raise HTTPException(status_code=404, detail="Icon not found")
    
    # Fallback to index.html for SPA routing
    index_file = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return {"error": "Frontend build not found. Please run 'npm run build'."}

if __name__ == "__main__":
    import uvicorn
    # Backend moved to 8000 to allow Frontend on 8501
    uvicorn.run(app, host="0.0.0.0", port=8000)