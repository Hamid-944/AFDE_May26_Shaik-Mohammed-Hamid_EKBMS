from pydantic import BaseModel
from typing import List


class DashboardStats(BaseModel):
    total_articles: int
    published_articles: int
    pending_approvals: int
    total_users: int
    total_categories: int
    total_views: int


class TopArticle(BaseModel):
    id: int
    title: str
    view_count: int
    avg_rating: float
    author_name: str


class CategoryStat(BaseModel):
    category_name: str
    article_count: int


class SearchTrend(BaseModel):
    query: str
    count: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    top_articles: List[TopArticle]
    category_distribution: List[CategoryStat]
    recent_search_trends: List[SearchTrend]
    monthly_articles: List[dict]
