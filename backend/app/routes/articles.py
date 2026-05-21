from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.article import Article, ArticleStatus, ArticleTag
from app.models.tag import Tag
from app.models.rating import Rating
from app.models.bookmark import Bookmark
from app.models.approval import ApprovalWorkflow, ApprovalStatus
from app.core.deps import get_current_user
from app.schemas.article import ArticleCreate, ArticleUpdate, ArticleOut, ArticleListItem, PaginatedArticles

router = APIRouter(prefix="/articles", tags=["Articles"])

ALLOWED_AUTHOR_TRANSITIONS = {
    ArticleStatus.DRAFT: [ArticleStatus.PENDING_APPROVAL, ArticleStatus.ARCHIVED],
    ArticleStatus.REJECTED: [ArticleStatus.DRAFT, ArticleStatus.PENDING_APPROVAL],
    ArticleStatus.APPROVED: [ArticleStatus.PUBLISHED, ArticleStatus.ARCHIVED],
}

ALLOWED_ADMIN_TRANSITIONS = {s: list(ArticleStatus) for s in ArticleStatus}


def enrich_article(article: Article, current_user: User, db: Session) -> dict:
    avg = db.query(func.avg(Rating.score)).filter(Rating.article_id == article.id).scalar()
    count = db.query(func.count(Rating.id)).filter(Rating.article_id == article.id).scalar()
    is_bm = db.query(Bookmark).filter(
        Bookmark.article_id == article.id, Bookmark.user_id == current_user.id
    ).first() is not None
    data = ArticleOut.model_validate(article).model_dump()
    data["avg_rating"] = round(float(avg), 2) if avg else None
    data["comment_count"] = len(article.comments)
    data["is_bookmarked"] = is_bm
    return data


@router.get("", response_model=PaginatedArticles)
def list_articles(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status: Optional[ArticleStatus] = None,
    category_id: Optional[int] = None,
    author_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Article)
    if current_user.role.name == "Employee":
        q = q.filter(Article.status == ArticleStatus.PUBLISHED)
    elif status:
        q = q.filter(Article.status == status)
    if category_id:
        q = q.filter(Article.category_id == category_id)
    if author_id:
        q = q.filter(Article.author_id == author_id)
    total = q.count()
    articles = q.order_by(Article.updated_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    items = []
    for a in articles:
        avg = db.query(func.avg(Rating.score)).filter(Rating.article_id == a.id).scalar()
        item = ArticleListItem.model_validate(a).model_dump()
        item["avg_rating"] = round(float(avg), 2) if avg else None
        item["comment_count"] = len(a.comments)
        items.append(item)
    return PaginatedArticles(items=items, total=total, page=page, per_page=per_page, pages=max(1, -(-total // per_page)))


@router.get("/my", response_model=PaginatedArticles)
def my_articles(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Article).filter(Article.author_id == current_user.id)
    total = q.count()
    articles = q.order_by(Article.updated_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    items = []
    for a in articles:
        avg = db.query(func.avg(Rating.score)).filter(Rating.article_id == a.id).scalar()
        item = ArticleListItem.model_validate(a).model_dump()
        item["avg_rating"] = round(float(avg), 2) if avg else None
        item["comment_count"] = len(a.comments)
        items.append(item)
    return PaginatedArticles(items=items, total=total, page=page, per_page=per_page, pages=max(1, -(-total // per_page)))


@router.get("/{article_id}", response_model=ArticleOut)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if current_user.role.name == "Employee" and article.status != ArticleStatus.PUBLISHED:
        raise HTTPException(status_code=403, detail="Article not available")
    article.view_count += 1
    db.commit()
    return enrich_article(article, current_user, db)


@router.post("", response_model=ArticleOut, status_code=status.HTTP_201_CREATED)
def create_article(
    payload: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.name == "Employee":
        raise HTTPException(status_code=403, detail="Employees cannot create articles")
    tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all() if payload.tag_ids else []
    article = Article(
        title=payload.title,
        content=payload.content,
        summary=payload.summary,
        category_id=payload.category_id,
        author_id=current_user.id,
        status=payload.status,
        tags=tags,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return enrich_article(article, current_user, db)


@router.put("/{article_id}", response_model=ArticleOut)
def update_article(
    article_id: int,
    payload: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if current_user.role.name not in ("Admin",) and article.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if article.status in (ArticleStatus.PENDING_APPROVAL, ArticleStatus.APPROVED, ArticleStatus.PUBLISHED):
        if current_user.role.name != "Admin":
            raise HTTPException(status_code=400, detail="Cannot edit article in current status")

    update_data = payload.model_dump(exclude_none=True)
    tag_ids = update_data.pop("tag_ids", None)
    if tag_ids is not None:
        article.tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()

    if "status" in update_data:
        new_status = update_data["status"]
        if current_user.role.name == "Admin":
            allowed = list(ArticleStatus)
        else:
            allowed = ALLOWED_AUTHOR_TRANSITIONS.get(article.status, [])
        if new_status not in allowed:
            raise HTTPException(status_code=400, detail=f"Invalid status transition from {article.status}")
        if new_status == ArticleStatus.PUBLISHED:
            article.published_at = datetime.now(timezone.utc)
        if new_status == ArticleStatus.PENDING_APPROVAL:
            wf = ApprovalWorkflow(article_id=article.id, status=ApprovalStatus.PENDING)
            db.add(wf)

    for field, value in update_data.items():
        setattr(article, field, value)

    db.commit()
    db.refresh(article)
    return enrich_article(article, current_user, db)


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if current_user.role.name != "Admin" and article.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(article)
    db.commit()



