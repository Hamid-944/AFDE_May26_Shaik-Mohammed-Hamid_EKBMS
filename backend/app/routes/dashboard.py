from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models.user import User
from app.models.article import Article, ArticleStatus
from app.models.category import Category
from app.models.rating import Rating
from app.models.approval import ApprovalWorkflow, ApprovalStatus
from app.models.search_log import SearchLog
from app.core.deps import get_current_user
from app.schemas.dashboard import DashboardResponse, DashboardStats, TopArticle, CategoryStat, SearchTrend

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats = DashboardStats(
        total_articles=db.query(Article).count(),
        published_articles=db.query(Article).filter(Article.status == ArticleStatus.PUBLISHED).count(),
        pending_approvals=db.query(ApprovalWorkflow).filter(ApprovalWorkflow.status == ApprovalStatus.PENDING).count(),
        total_users=db.query(User).filter(User.is_active == True).count(),
        total_categories=db.query(Category).count(),
        total_views=db.query(func.sum(Article.view_count)).scalar() or 0,
    )

    top_rows = (
        db.query(
            Article.id,
            Article.title,
            Article.view_count,
            func.avg(Rating.score).label("avg_rating"),
            User.name.label("author_name"),
        )
        .join(User, Article.author_id == User.id)
        .outerjoin(Rating, Rating.article_id == Article.id)
        .filter(Article.status == ArticleStatus.PUBLISHED)
        .group_by(Article.id, Article.title, Article.view_count, User.name)
        .order_by(Article.view_count.desc())
        .limit(5)
        .all()
    )
    top_articles = [
        TopArticle(
            id=r.id, title=r.title, view_count=r.view_count,
            avg_rating=round(float(r.avg_rating), 2) if r.avg_rating else 0.0,
            author_name=r.author_name,
        )
        for r in top_rows
    ]

    cat_rows = (
        db.query(Category.name, func.count(Article.id).label("cnt"))
        .outerjoin(Article, Article.category_id == Category.id)
        .group_by(Category.name)
        .order_by(func.count(Article.id).desc())
        .limit(8)
        .all()
    )
    category_distribution = [CategoryStat(category_name=r.name, article_count=r.cnt) for r in cat_rows]

    trend_rows = (
        db.query(SearchLog.query, func.count(SearchLog.id).label("cnt"))
        .group_by(SearchLog.query)
        .order_by(func.count(SearchLog.id).desc())
        .limit(10)
        .all()
    )
    search_trends = [SearchTrend(query=r.query, count=r.cnt) for r in trend_rows]

    now = datetime.now(timezone.utc)
    monthly = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        month_end = (month_start.replace(month=month_start.month % 12 + 1, day=1)
                     if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1, day=1))
        count = db.query(Article).filter(
            Article.created_at >= month_start, Article.created_at < month_end
        ).count()
        monthly.append({"month": month_start.strftime("%b %Y"), "articles": count})

    return DashboardResponse(
        stats=stats,
        top_articles=top_articles,
        category_distribution=category_distribution,
        recent_search_trends=search_trends,
        monthly_articles=monthly,
    )



