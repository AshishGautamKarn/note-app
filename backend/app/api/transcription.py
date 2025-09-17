"""
Audio transcription API endpoints.
Provides speech-to-text functionality for creating notes from audio.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models.note import Note
from app.models.folder import Folder
from app.services.transcription_service import TranscriptionService
from pydantic import BaseModel
import os
import tempfile

router = APIRouter()

# Pydantic models
class TranscriptionResponse(BaseModel):
    text: str
    confidence: Optional[float] = None
    language: Optional[str] = None
    duration: Optional[float] = None

class TranscriptionWithNoteResponse(BaseModel):
    transcription: TranscriptionResponse
    note_id: int
    note_title: str

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form("en-US")
):
    """Transcribe audio file to text."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    # Validate file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    
    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        # Transcribe audio
        transcription_service = TranscriptionService()
        result = await transcription_service.transcribe_audio(temp_file_path, language)
        
        return TranscriptionResponse(
            text=result["text"],
            confidence=result.get("confidence"),
            language=result.get("language"),
            duration=result.get("duration")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@router.post("/transcribe-and-create-note", response_model=TranscriptionWithNoteResponse)
async def transcribe_and_create_note(
    file: UploadFile = File(...),
    title: str = Form(...),
    folder_id: Optional[int] = Form(None),
    language: Optional[str] = Form("en-US"),
    db: Session = Depends(get_db)
):
    """Transcribe audio and create a note with the transcribed text."""
    # Validate folder exists if folder_id is provided
    if folder_id:
        folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
    
    # Transcribe audio
    transcription_result = await transcribe_audio(file, language)
    
    # Create note with transcribed text
    note = Note(
        title=title,
        content=transcription_result.text,
        folder_id=folder_id,
        tags=["transcribed", "audio"]
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return TranscriptionWithNoteResponse(
        transcription=transcription_result,
        note_id=note.id,
        note_title=note.title
    )

@router.post("/transcribe-and-update-note/{note_id}", response_model=TranscriptionWithNoteResponse)
async def transcribe_and_update_note(
    note_id: int,
    file: UploadFile = File(...),
    append: bool = Form(True),
    language: Optional[str] = Form("en-US"),
    db: Session = Depends(get_db)
):
    """Transcribe audio and update an existing note with the transcribed text."""
    # Get existing note
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Transcribe audio
    transcription_result = await transcribe_audio(file, language)
    
    # Update note content
    if append and note.content:
        note.content += f"\n\n{transcription_result.text}"
    else:
        note.content = transcription_result.text
    
    # Add transcription tag if not already present
    if note.tags and "transcribed" not in note.tags:
        note.tags.append("transcribed")
    elif not note.tags:
        note.tags = ["transcribed"]
    
    db.commit()
    db.refresh(note)
    
    return TranscriptionWithNoteResponse(
        transcription=transcription_result,
        note_id=note.id,
        note_title=note.title
    )

@router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported languages for transcription."""
    return {
        "languages": [
            {"code": "en-US", "name": "English (US)"},
            {"code": "en-GB", "name": "English (UK)"},
            {"code": "es-ES", "name": "Spanish (Spain)"},
            {"code": "es-MX", "name": "Spanish (Mexico)"},
            {"code": "fr-FR", "name": "French (France)"},
            {"code": "de-DE", "name": "German (Germany)"},
            {"code": "it-IT", "name": "Italian (Italy)"},
            {"code": "pt-BR", "name": "Portuguese (Brazil)"},
            {"code": "ru-RU", "name": "Russian (Russia)"},
            {"code": "ja-JP", "name": "Japanese (Japan)"},
            {"code": "ko-KR", "name": "Korean (Korea)"},
            {"code": "zh-CN", "name": "Chinese (Simplified)"},
            {"code": "zh-TW", "name": "Chinese (Traditional)"},
            {"code": "ar-SA", "name": "Arabic (Saudi Arabia)"},
            {"code": "hi-IN", "name": "Hindi (India)"},
        ]
    }
