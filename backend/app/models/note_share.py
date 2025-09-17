from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class SharePermission(str, enum.Enum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"

class NoteShare(Base):
    __tablename__ = "note_shares"

    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    permission = Column(Enum(SharePermission), default=SharePermission.READ)
    is_active = Column(Boolean, default=True)
    shared_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    note = relationship("Note", back_populates="shares")
    user = relationship("User", back_populates="shared_notes", foreign_keys=[user_id])
    shared_by_user = relationship("User", foreign_keys=[shared_by])
