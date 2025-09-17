"""
Main FastAPI application entry point for the Note App.
Provides a comprehensive note-taking API with folder management and audio transcription.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import uvicorn
import os
from pathlib import Path

from app.api import notes, folders, transcription
from app.core.config import settings
from app.core.database import engine, Base
from app.models import note, folder

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Note App API",
    description="A comprehensive note-taking application with folder management and audio transcription",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(folders.router, prefix="/api/folders", tags=["folders"])
app.include_router(transcription.router, prefix="/api/transcription", tags=["transcription"])

# Serve static files for frontend
frontend_path = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Note App API is running"}

@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    """Serve the frontend application"""
    frontend_file = Path(__file__).parent.parent.parent / "frontend" / "dist" / "index.html"
    if frontend_file.exists():
        return HTMLResponse(content=frontend_file.read_text())
    return HTMLResponse(content="<h1>Note App Frontend not built yet</h1>")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
