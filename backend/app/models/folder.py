"""
Folder model for organizing notes.
Supports hierarchical folder structure with parent-child relationships.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Folder(Base):
    """Folder model for organizing notes in a hierarchical structure."""
    
    __tablename__ = "folders"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    parent = relationship("Folder", remote_side=[id], back_populates="children")
    children = relationship("Folder", back_populates="parent")
    notes = relationship("Note", back_populates="folder", cascade="all, delete-orphan")
    owner = relationship("User", back_populates="folders")
    
    def __repr__(self):
        return f"<Folder(id={self.id}, name='{self.name}', parent_id={self.parent_id})>"
    
    @property
    def path(self):
        """Get the full path of the folder."""
        if self.parent:
            return f"{self.parent.path}/{self.name}"
        return self.name
    
    def to_dict(self):
        """Convert folder to dictionary representation."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "parent_id": self.parent_id,
            "owner_id": self.owner_id,
            "owner_name": self.owner.username if self.owner else None,
            "path": self.path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "notes_count": len(self.notes) if self.notes else 0,
            "children_count": len(self.children) if self.children else 0
        }
