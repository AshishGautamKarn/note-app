"""
Note model for storing user notes.
Supports rich text content, tags, and folder organization.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Note(Base):
    """Note model for storing user notes with rich content and metadata."""
    
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=True)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    tags = Column(JSON, nullable=True)  # Store as JSON array
    is_favorite = Column(Boolean, default=False, index=True)
    is_archived = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    folder = relationship("Folder", back_populates="notes")
    
    def __repr__(self):
        return f"<Note(id={self.id}, title='{self.title}', folder_id={self.folder_id})>"
    
    def to_dict(self):
        """Convert note to dictionary representation."""
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "folder_id": self.folder_id,
            "folder_name": self.folder.name if self.folder else None,
            "tags": self.tags or [],
            "is_favorite": self.is_favorite,
            "is_archived": self.is_archived,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "word_count": len(self.content.split()) if self.content else 0,
            "char_count": len(self.content) if self.content else 0
        }
    
    def update_content(self, title: str = None, content: str = None, tags: list = None):
        """Update note content and metadata."""
        if title is not None:
            self.title = title
        if content is not None:
            self.content = content
        if tags is not None:
            self.tags = tags
        self.updated_at = func.now()
