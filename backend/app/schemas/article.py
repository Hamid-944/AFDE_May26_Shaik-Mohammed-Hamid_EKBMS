from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.article import ArticleStatus
from app.schemas.user import UserSummary
from app.schemas.category import CategoryOut
from app.schemas.tag import TagOut


class AttachmentOut(BaseModel):
    id: int
    original_name: str
    file_type: str
    file_size: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ArticleCreate(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []
    status: ArticleStatus = ArticleStatus.DRAFT


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None
    status: Optional[ArticleStatus] = None


class ArticleOut(BaseModel):
    id: int
    title: str
    content: str
    summary: Optional[str] = None
    status: ArticleStatus
    view_count: int
    is_featured: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    author: UserSummary
    category: Optional[CategoryOut] = None
    tags: List[TagOut] = []
    attachments: List[AttachmentOut] = []
    avg_rating: Optional[float] = None
    comment_count: Optional[int] = 0
    is_bookmarked: Optional[bool] = False

    model_config = {"from_attributes": True}


class ArticleListItem(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    status: ArticleStatus
    view_count: int
    created_at: datetime
    updated_at: datetime
    author: UserSummary
    category: Optional[CategoryOut] = None
    tags: List[TagOut] = []
    avg_rating: Optional[float] = None
    comment_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class PaginatedArticles(BaseModel):
    items: List[ArticleListItem]
    total: int
    page: int
    per_page: int
    pages: int
