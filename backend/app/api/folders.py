"""
Folders API endpoints for CRUD operations.
Provides comprehensive folder management functionality with hierarchical structure.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.folder import Folder
from app.models.note import Note
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Pydantic models for request/response
class FolderCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None

class FolderResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    path: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    notes_count: int
    children_count: int

    class Config:
        from_attributes = True

@router.post("/", response_model=FolderResponse)
async def create_folder(folder_data: FolderCreate, db: Session = Depends(get_db)):
    """Create a new folder."""
    # Validate parent folder exists if parent_id is provided
    if folder_data.parent_id:
        parent_folder = db.query(Folder).filter(Folder.id == folder_data.parent_id).first()
        if not parent_folder:
            raise HTTPException(status_code=404, detail="Parent folder not found")
    
    # Check if folder with same name already exists in the same parent
    existing_folder = db.query(Folder).filter(
        Folder.name == folder_data.name,
        Folder.parent_id == folder_data.parent_id
    ).first()
    
    if existing_folder:
        raise HTTPException(status_code=400, detail="Folder with this name already exists in the same location")
    
    # Create new folder
    db_folder = Folder(
        name=folder_data.name,
        description=folder_data.description,
        parent_id=folder_data.parent_id
    )
    
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    
    return db_folder.to_dict()

@router.get("/", response_model=List[FolderResponse])
async def get_folders(
    parent_id: Optional[int] = None,
    include_children: bool = False,
    db: Session = Depends(get_db)
):
    """Get folders with optional filtering by parent."""
    query = db.query(Folder)
    
    if parent_id is not None:
        query = query.filter(Folder.parent_id == parent_id)
    elif not include_children:
        # Only get root folders (no parent)
        query = query.filter(Folder.parent_id.is_(None))
    
    folders = query.order_by(Folder.name).all()
    
    return [folder.to_dict() for folder in folders]

@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder(folder_id: int, db: Session = Depends(get_db)):
    """Get a specific folder by ID."""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    return folder.to_dict()

@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(folder_id: int, folder_data: FolderUpdate, db: Session = Depends(get_db)):
    """Update a folder."""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Validate parent folder exists if parent_id is provided
    if folder_data.parent_id is not None and folder_data.parent_id != folder.parent_id:
        parent_folder = db.query(Folder).filter(Folder.id == folder_data.parent_id).first()
        if not parent_folder:
            raise HTTPException(status_code=404, detail="Parent folder not found")
        
        # Prevent circular reference
        if folder_data.parent_id == folder_id:
            raise HTTPException(status_code=400, detail="Folder cannot be its own parent")
        
        # Check if moving would create a circular reference
        current_parent = folder_data.parent_id
        while current_parent:
            if current_parent == folder_id:
                raise HTTPException(status_code=400, detail="Cannot move folder: would create circular reference")
            parent = db.query(Folder).filter(Folder.id == current_parent).first()
            current_parent = parent.parent_id if parent else None
    
    # Check for name conflicts if name is being changed
    if folder_data.name and folder_data.name != folder.name:
        existing_folder = db.query(Folder).filter(
            Folder.name == folder_data.name,
            Folder.parent_id == folder_data.parent_id or folder.parent_id,
            Folder.id != folder_id
        ).first()
        
        if existing_folder:
            raise HTTPException(status_code=400, detail="Folder with this name already exists in the same location")
    
    # Update folder fields
    update_data = folder_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(folder, field, value)
    
    db.commit()
    db.refresh(folder)
    
    return folder.to_dict()

@router.delete("/{folder_id}")
async def delete_folder(folder_id: int, force: bool = False, db: Session = Depends(get_db)):
    """Delete a folder."""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Check if folder has children
    children_count = db.query(Folder).filter(Folder.parent_id == folder_id).count()
    if children_count > 0 and not force:
        raise HTTPException(
            status_code=400, 
            detail=f"Folder has {children_count} subfolders. Use force=true to delete recursively."
        )
    
    # Check if folder has notes
    notes_count = db.query(Note).filter(Note.folder_id == folder_id).count()
    if notes_count > 0 and not force:
        raise HTTPException(
            status_code=400, 
            detail=f"Folder has {notes_count} notes. Use force=true to delete all notes."
        )
    
    # Delete folder (cascade will handle notes and children)
    db.delete(folder)
    db.commit()
    
    return {"message": "Folder deleted successfully"}

@router.get("/{folder_id}/tree", response_model=List[FolderResponse])
async def get_folder_tree(folder_id: int, db: Session = Depends(get_db)):
    """Get the complete folder tree starting from a specific folder."""
    def get_children(parent_id: int):
        children = db.query(Folder).filter(Folder.parent_id == parent_id).all()
        result = []
        for child in children:
            child_dict = child.to_dict()
            child_dict["children"] = get_children(child.id)
            result.append(child_dict)
        return result
    
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    folder_dict = folder.to_dict()
    folder_dict["children"] = get_children(folder_id)
    
    return [folder_dict]

@router.get("/{folder_id}/notes", response_model=List[dict])
async def get_folder_notes(
    folder_id: int,
    include_subfolders: bool = False,
    db: Session = Depends(get_db)
):
    """Get all notes in a folder, optionally including subfolders."""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    def get_folder_ids(parent_id: int):
        """Recursively get all folder IDs including children."""
        folder_ids = [parent_id]
        children = db.query(Folder).filter(Folder.parent_id == parent_id).all()
        for child in children:
            folder_ids.extend(get_folder_ids(child.id))
        return folder_ids
    
    if include_subfolders:
        folder_ids = get_folder_ids(folder_id)
        notes = db.query(Note).filter(Note.folder_id.in_(folder_ids)).all()
    else:
        notes = db.query(Note).filter(Note.folder_id == folder_id).all()
    
    return [note.to_dict() for note in notes]
