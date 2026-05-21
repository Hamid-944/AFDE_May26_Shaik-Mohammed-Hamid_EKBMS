from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.approval import ApprovalStatus
from app.schemas.user import UserSummary


class ApprovalAction(BaseModel):
    status: ApprovalStatus
    reviewer_comments: Optional[str] = None


class ApprovalOut(BaseModel):
    id: int
    article_id: int
    status: ApprovalStatus
    reviewer_comments: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewer: Optional[UserSummary] = None

    model_config = {"from_attributes": True}
