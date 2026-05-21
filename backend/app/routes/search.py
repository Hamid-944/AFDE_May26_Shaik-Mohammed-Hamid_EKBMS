from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.article import Article, ArticleStatus
from app.models.tag import Tag
from app.models.rating import Rating
from app.models.search_log import SearchLog
from app.core.deps import get_current_user
from app.schemas.article import ArticleListItem, PaginatedArticles

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=PaginatedArticles)
def search_articles(
    q: str = Query("", description="Search query"),
    category_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    author_id: Optional[int] = None,
    sort_by: str = Query("latest", enum=["latest", "popular", "rating"]),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Article).filter(Article.status == ArticleStatus.PUBLISHED)

    if q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Article.title.ilike(search_term),
                Article.content.ilike(search_term),
                Article.summary.ilike(search_term),
            )
        )
        log = SearchLog(user_id=current_user.id, query=q.strip())
        db.add(log)
        db.commit()

    if category_id:
        query = query.filter(Article.category_id == category_id)
    if tag_id:
        query = query.filter(Article.tags.any(Tag.id == tag_id))
    if author_id:
        query = query.filter(Article.author_id == author_id)

    if sort_by == "popular":
        query = query.order_by(Article.view_count.desc())
    elif sort_by == "rating":
        query = query.outerjoin(Rating).group_by(Article.id).order_by(func.avg(Rating.score).desc())
    else:
        query = query.order_by(Article.published_at.desc())

    total = query.count()
    articles = query.offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for a in articles:
        avg = db.query(func.avg(Rating.score)).filter(Rating.article_id == a.id).scalar()
        item = ArticleListItem.model_validate(a).model_dump()
        item["avg_rating"] = round(float(avg), 2) if avg else None
        item["comment_count"] = len(a.comments)
        items.append(item)

    if q.strip():
        for log_entry in db.query(SearchLog).filter(SearchLog.query == q.strip(), SearchLog.results_count == 0).all():
            log_entry.results_count = total
        db.commit()

    return PaginatedArticles(items=items, total=total, page=page, per_page=per_page, pages=max(1, -(-total // per_page)))


@router.get("/suggestions")
def search_suggestions(
    q: str = Query("", min_length=2),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not q.strip():
        return []
    results = (
        db.query(Article.title)
        .filter(Article.title.ilike(f"%{q}%"), Article.status == ArticleStatus.PUBLISHED)
        .limit(8)
        .all()
    )
    return [r[0] for r in results]



