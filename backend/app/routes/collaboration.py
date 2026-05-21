from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.article import Article, ArticleStatus
from app.models.comment import Comment
from app.models.rating import Rating
from app.models.bookmark import Bookmark
from app.core.deps import get_current_user
from app.schemas.comment import CommentCreate, CommentUpdate, CommentOut
from app.schemas.rating import RatingCreate, RatingOut

router = APIRouter(tags=["Collaboration"])


# ── Comments ──────────────────────────────────────────────────────────────────

@router.get("/articles/{article_id}/comments", response_model=List[CommentOut])
def get_comments(article_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Comment).filter(Comment.article_id == article_id, Comment.parent_id == None).all()


@router.post("/articles/{article_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    article_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    comment = Comment(article_id=article_id, user_id=current_user.id, **payload.model_dump())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.put("/comments/{comment_id}", response_model=CommentOut)
def update_comment(
    comment_id: int,
    payload: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Access denied")
    comment.content = payload.content
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(comment)
    db.commit()


# ── Ratings ───────────────────────────────────────────────────────────────────

@router.post("/articles/{article_id}/rate", response_model=RatingOut)
def rate_article(
    article_id: int,
    payload: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    existing = db.query(Rating).filter(Rating.article_id == article_id, Rating.user_id == current_user.id).first()
    if existing:
        existing.score = payload.score
        db.commit()
        db.refresh(existing)
        return existing
    rating = Rating(article_id=article_id, user_id=current_user.id, score=payload.score)
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


# ── Bookmarks ─────────────────────────────────────────────────────────────────

@router.get("/bookmarks", response_model=List[dict])
def get_bookmarks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == current_user.id).all()
    return [{"id": b.id, "article_id": b.article_id, "created_at": b.created_at} for b in bookmarks]


@router.post("/articles/{article_id}/bookmark")
def toggle_bookmark(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Bookmark).filter(
        Bookmark.article_id == article_id, Bookmark.user_id == current_user.id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False}
    bm = Bookmark(article_id=article_id, user_id=current_user.id)
    db.add(bm)
    db.commit()
    return {"bookmarked": True}
