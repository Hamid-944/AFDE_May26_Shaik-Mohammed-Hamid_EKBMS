from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.article import Article, ArticleStatus
from app.models.approval import ApprovalWorkflow, ApprovalStatus
from app.core.deps import get_current_user
from app.schemas.approval import ApprovalAction, ApprovalOut

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.get("/pending", response_model=List[ApprovalOut])
def get_pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.name not in ("Admin", "Reviewer"):
        raise HTTPException(status_code=403, detail="Access denied")
    return (
        db.query(ApprovalWorkflow)
        .filter(ApprovalWorkflow.status == ApprovalStatus.PENDING)
        .order_by(ApprovalWorkflow.submitted_at.desc())
        .all()
    )


@router.get("/article/{article_id}", response_model=List[ApprovalOut])
def get_article_approvals(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if current_user.role.name not in ("Admin", "Reviewer") and article.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(ApprovalWorkflow).filter(ApprovalWorkflow.article_id == article_id).all()


@router.post("/{approval_id}/action", response_model=ApprovalOut)
def process_approval(
    approval_id: int,
    payload: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.name not in ("Admin", "Reviewer"):
        raise HTTPException(status_code=403, detail="Only Reviewers and Admins can process approvals")
    wf = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.id == approval_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Approval record not found")
    if wf.status != ApprovalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Approval already processed")

    wf.status = payload.status
    wf.reviewer_id = current_user.id
    wf.reviewer_comments = payload.reviewer_comments
    wf.reviewed_at = datetime.now(timezone.utc)

    article = db.query(Article).filter(Article.id == wf.article_id).first()
    if payload.status == ApprovalStatus.APPROVED:
        article.status = ArticleStatus.APPROVED
    elif payload.status == ApprovalStatus.REJECTED:
        article.status = ArticleStatus.REJECTED

    db.commit()
    db.refresh(wf)
    return wf
