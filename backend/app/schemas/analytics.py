from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ETLRunOut(BaseModel):
    id: int
    run_at: datetime
    status: str
    records_extracted: int
    records_transformed: int
    records_loaded: int
    records_skipped: int
    errors: Optional[str] = None
    duration_seconds: Optional[float] = None

    model_config = {"from_attributes": True}


class MostViewedItem(BaseModel):
    article_title: str
    category: Optional[str] = None
    author_name: Optional[str] = None
    view_count: int
    avg_rating: Optional[float] = None
    source: str

    model_config = {"from_attributes": True}


class CategoryTrendItem(BaseModel):
    category_name: str
    article_count: int
    total_views: int
    avg_rating: Optional[float] = None

    model_config = {"from_attributes": True}


class AuthorStatsItem(BaseModel):
    author_name: str
    author_email: Optional[str] = None
    article_count: int
    total_views: int
    avg_rating: Optional[float] = None

    model_config = {"from_attributes": True}


class SearchTrendItem(BaseModel):
    keyword: str
    search_count: int

    model_config = {"from_attributes": True}


class AnalyticsSummary(BaseModel):
    most_viewed: List[MostViewedItem]
    category_trends: List[CategoryTrendItem]
    author_stats: List[AuthorStatsItem]
    search_trends: List[SearchTrendItem]
    last_etl_run: Optional[ETLRunOut] = None
