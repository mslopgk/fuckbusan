from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import logging
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from sqlalchemy import text

# Routers
from routers import auth, dashboard, ai, user_router, checklist_router, report_router
import models
import database

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
        with database.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Startup: Database connection successful.")
        
        logger.info("Startup: Creating tables...")
        models.Base.metadata.create_all(bind=database.engine)
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
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8501", 
    "http://0.0.0.0:8501",
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

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # Serve specific files if they exist in dist (e.g., favicon.ico)
    file_path = os.path.join(dist_dir, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Fallback to index.html for SPA routing
    index_file = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return {"error": "Frontend build not found. Please run 'npm run build'."}

if __name__ == "__main__":
    import uvicorn
    # Backend moved to 8000 to allow Frontend on 8501
    uvicorn.run(app, host="0.0.0.0", port=8000)