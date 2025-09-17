"""
Notes API endpoints for CRUD operations.
Provides comprehensive note management functionality.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.note import Note
from app.models.folder import Folder
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Pydantic models for request/response
class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    folder_id: Optional[int] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = False

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[int] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None

class NoteResponse(BaseModel):
    id: int
    title: str
    content: Optional[str]
    folder_id: Optional[int]
    folder_name: Optional[str]
    tags: List[str]
    is_favorite: bool
    is_archived: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    word_count: int
    char_count: int

    class Config:
        from_attributes = True

@router.post("/", response_model=NoteResponse)
async def create_note(note_data: NoteCreate, db: Session = Depends(get_db)):
    """Create a new note."""
    # Validate folder exists if folder_id is provided
    if note_data.folder_id:
        folder = db.query(Folder).filter(Folder.id == note_data.folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
    
    # Create new note
    db_note = Note(
        title=note_data.title,
        content=note_data.content,
        folder_id=note_data.folder_id,
        tags=note_data.tags or [],
        is_favorite=note_data.is_favorite
    )
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    return db_note.to_dict()

@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    folder_id: Optional[int] = None,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    is_archived: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get notes with filtering and pagination."""
    query = db.query(Note)
    
    # Apply filters
    if folder_id is not None:
        query = query.filter(Note.folder_id == folder_id)
    
    if search:
        query = query.filter(
            (Note.title.contains(search)) | 
            (Note.content.contains(search))
        )
    
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
        query = query.filter(Note.tags.contains(tag_list))
    
    if is_favorite is not None:
        query = query.filter(Note.is_favorite == is_favorite)
    
    if is_archived is not None:
        query = query.filter(Note.is_archived == is_archived)
    
    # Apply pagination and ordering
    notes = query.order_by(Note.updated_at.desc()).offset(skip).limit(limit).all()
    
    return [note.to_dict() for note in notes]

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: int, db: Session = Depends(get_db)):
    """Get a specific note by ID."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return note.to_dict()

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: int, note_data: NoteUpdate, db: Session = Depends(get_db)):
    """Update a note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Validate folder exists if folder_id is provided
    if note_data.folder_id is not None:
        if note_data.folder_id != note.folder_id:
            folder = db.query(Folder).filter(Folder.id == note_data.folder_id).first()
            if not folder:
                raise HTTPException(status_code=404, detail="Folder not found")
    
    # Update note fields
    update_data = note_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)
    
    db.commit()
    db.refresh(note)
    
    return note.to_dict()

@router.delete("/{note_id}")
async def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Delete a note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted successfully"}

@router.post("/{note_id}/move")
async def move_note(note_id: int, folder_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Move a note to a different folder."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Validate folder exists if folder_id is provided
    if folder_id is not None:
        folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
    
    note.folder_id = folder_id
    db.commit()
    
    return {"message": "Note moved successfully", "note_id": note_id, "folder_id": folder_id}

@router.post("/{note_id}/copy")
async def copy_note(note_id: int, folder_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Copy a note to a different folder."""
    original_note = db.query(Note).filter(Note.id == note_id).first()
    if not original_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Validate folder exists if folder_id is provided
    if folder_id is not None:
        folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
    
    # Create copy
    copied_note = Note(
        title=f"{original_note.title} (Copy)",
        content=original_note.content,
        folder_id=folder_id,
        tags=original_note.tags.copy() if original_note.tags else [],
        is_favorite=False
    )
    
    db.add(copied_note)
    db.commit()
    db.refresh(copied_note)
    
    return {"message": "Note copied successfully", "note_id": copied_note.id}

@router.get("/search/", response_model=List[NoteResponse])
async def search_notes(
    q: str = Query(..., min_length=1),
    folder_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Search notes by content and title."""
    query = db.query(Note).filter(
        (Note.title.contains(q)) | 
        (Note.content.contains(q))
    )
    
    if folder_id is not None:
        query = query.filter(Note.folder_id == folder_id)
    
    notes = query.order_by(Note.updated_at.desc()).limit(50).all()
    
    return [note.to_dict() for note in notes]
