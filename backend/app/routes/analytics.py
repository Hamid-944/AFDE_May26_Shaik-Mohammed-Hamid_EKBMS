from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.analytics import (
    AnalyticsMostViewed,
    AnalyticsCategoryTrend,
    AnalyticsAuthorStats,
    AnalyticsSearchTrend,
    ETLRunLog,
)
from app.core.deps import get_current_user
from app.schemas.analytics import (
    MostViewedItem,
    CategoryTrendItem,
    AuthorStatsItem,
    SearchTrendItem,
    AnalyticsSummary,
    ETLRunOut,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/most-viewed", response_model=List[MostViewedItem])
def most_viewed(
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(AnalyticsMostViewed).order_by(AnalyticsMostViewed.view_count.desc()).limit(limit).all()


@router.get("/category-trends", response_model=List[CategoryTrendItem])
def category_trends(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(AnalyticsCategoryTrend).order_by(AnalyticsCategoryTrend.total_views.desc()).all()


@router.get("/author-activity", response_model=List[AuthorStatsItem])
def author_activity(
    limit: int = 15,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(AnalyticsAuthorStats).order_by(AnalyticsAuthorStats.article_count.desc()).limit(limit).all()


@router.get("/search-keywords", response_model=List[SearchTrendItem])
def search_keywords(
    limit: int = 15,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(AnalyticsSearchTrend).order_by(AnalyticsSearchTrend.search_count.desc()).limit(limit).all()


@router.get("/summary", response_model=AnalyticsSummary)
def analytics_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    last_run = db.query(ETLRunLog).order_by(ETLRunLog.run_at.desc()).first()
    return AnalyticsSummary(
        most_viewed=db.query(AnalyticsMostViewed).order_by(AnalyticsMostViewed.view_count.desc()).limit(10).all(),
        category_trends=db.query(AnalyticsCategoryTrend).order_by(AnalyticsCategoryTrend.total_views.desc()).all(),
        author_stats=db.query(AnalyticsAuthorStats).order_by(AnalyticsAuthorStats.article_count.desc()).limit(10).all(),
        search_trends=db.query(AnalyticsSearchTrend).order_by(AnalyticsSearchTrend.search_count.desc()).limit(15).all(),
        last_etl_run=last_run,
    )
