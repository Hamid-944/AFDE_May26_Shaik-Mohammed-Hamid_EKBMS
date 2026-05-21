from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserSummary


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: int
    content: str
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    user: UserSummary
    replies: List["CommentOut"] = []

    model_config = {"from_attributes": True}


CommentOut.model_rebuild()
