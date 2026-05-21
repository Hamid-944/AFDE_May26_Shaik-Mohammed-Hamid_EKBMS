"""
ETL Load Stage
--------------
Loads transformed data into MySQL:
  1. Upserts categories and tags referenced in the CSV
  2. Imports article records not already present (matched by title + author email)
  3. Refreshes all four analytics tables:
       analytics_most_viewed
       analytics_category_trends
       analytics_author_stats
       analytics_search_trends
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from app.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.category import Category
from app.models.tag import Tag
from app.models.article import Article, ArticleStatus
from app.models.rating import Rating
from app.models.search_log import SearchLog
from app.models.analytics import (
    AnalyticsMostViewed,
    AnalyticsCategoryTrend,
    AnalyticsAuthorStats,
    AnalyticsSearchTrend,
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_or_create_category(db: Session, name: str) -> Category:
    cat = db.query(Category).filter(func.lower(Category.name) == name.lower()).first()
    if not cat:
        cat = Category(name=name)
        db.add(cat)
        db.flush()
    return cat


def _get_or_create_tag(db: Session, name: str) -> Tag:
    tag = db.query(Tag).filter(func.lower(Tag.name) == name.lower()).first()
    if not tag:
        tag = Tag(name=name)
        db.add(tag)
        db.flush()
    return tag


def _get_or_create_author(db: Session, name: str, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Use Author role by default for imported users
        role = db.query(Role).filter(Role.name == "Author").first()
        if not role:
            role = db.query(Role).first()
        from app.core.security import hash_password
        user = User(
            name=name,
            email=email,
            password_hash=hash_password("Import@123"),
            role_id=role.id,
            is_active=True,
        )
        db.add(user)
        db.flush()
    return user


# ── Article import ────────────────────────────────────────────────────────────

def load_articles(df: pd.DataFrame, db: Session) -> tuple[int, int]:
    loaded = 0
    skipped = 0

    for _, row in df.iterrows():
        # Check for existing article by title
        existing = db.query(Article).filter(Article.title == row["title"]).first()
        if existing:
            skipped += 1
            continue

        category = _get_or_create_category(db, row["category"])
        author = _get_or_create_author(db, row["author_name"], row["author_email"])
        tags = [_get_or_create_tag(db, t) for t in row["tags_list"]]

        status_map = {
            "published": ArticleStatus.PUBLISHED,
            "draft": ArticleStatus.DRAFT,
            "pending_approval": ArticleStatus.PENDING_APPROVAL,
            "approved": ArticleStatus.APPROVED,
            "rejected": ArticleStatus.REJECTED,
            "archived": ArticleStatus.ARCHIVED,
        }
        status = status_map.get(row["status"], ArticleStatus.PUBLISHED)

        article = Article(
            title=row["title"],
            content=f"<p>{row['summary']}</p>",
            summary=row["summary"],
            category_id=category.id,
            author_id=author.id,
            status=status,
            view_count=int(row["views"]),
            tags=tags,
        )
        db.add(article)
        loaded += 1

    db.commit()
    print(f"[Load] Articles — loaded: {loaded}, skipped (already exist): {skipped}")
    return loaded, skipped


# ── Analytics refresh ─────────────────────────────────────────────────────────

def refresh_analytics(db: Session) -> None:
    # Clear existing analytics snapshots
    for model in [AnalyticsMostViewed, AnalyticsCategoryTrend, AnalyticsAuthorStats, AnalyticsSearchTrend]:
        db.query(model).delete()
    db.flush()

    # ── Most Viewed ──────────────────────────────────────────────────────────
    rows = (
        db.query(
            Article.title,
            Category.name.label("category"),
            User.name.label("author_name"),
            Article.view_count,
            func.avg(Rating.score).label("avg_rating"),
        )
        .join(User, Article.author_id == User.id)
        .outerjoin(Category, Article.category_id == Category.id)
        .outerjoin(Rating, Rating.article_id == Article.id)
        .filter(Article.status == ArticleStatus.PUBLISHED)
        .group_by(Article.id, Article.title, Category.name, User.name, Article.view_count)
        .order_by(Article.view_count.desc())
        .limit(20)
        .all()
    )
    for r in rows:
        db.add(AnalyticsMostViewed(
            article_title=r.title,
            category=r.category,
            author_name=r.author_name,
            view_count=r.view_count,
            avg_rating=round(float(r.avg_rating), 2) if r.avg_rating else None,
            source="db",
        ))

    # ── Category Trends ──────────────────────────────────────────────────────
    cat_rows = (
        db.query(
            Category.name,
            func.count(Article.id).label("article_count"),
            func.sum(Article.view_count).label("total_views"),
            func.avg(Rating.score).label("avg_rating"),
        )
        .outerjoin(Article, Article.category_id == Category.id)
        .outerjoin(Rating, Rating.article_id == Article.id)
        .group_by(Category.name)
        .order_by(func.count(Article.id).desc())
        .all()
    )
    for r in cat_rows:
        db.add(AnalyticsCategoryTrend(
            category_name=r.name,
            article_count=r.article_count or 0,
            total_views=int(r.total_views or 0),
            avg_rating=round(float(r.avg_rating), 2) if r.avg_rating else None,
        ))

    # ── Author Stats ─────────────────────────────────────────────────────────
    author_rows = (
        db.query(
            User.name,
            User.email,
            func.count(Article.id).label("article_count"),
            func.sum(Article.view_count).label("total_views"),
            func.avg(Rating.score).label("avg_rating"),
        )
        .outerjoin(Article, Article.author_id == User.id)
        .outerjoin(Rating, Rating.article_id == Article.id)
        .group_by(User.id, User.name, User.email)
        .having(func.count(Article.id) > 0)
        .order_by(func.count(Article.id).desc())
        .all()
    )
    for r in author_rows:
        db.add(AnalyticsAuthorStats(
            author_name=r.name,
            author_email=r.email,
            article_count=r.article_count or 0,
            total_views=int(r.total_views or 0),
            avg_rating=round(float(r.avg_rating), 2) if r.avg_rating else None,
        ))

    # ── Search Trends ────────────────────────────────────────────────────────
    search_rows = (
        db.query(SearchLog.query, func.count(SearchLog.id).label("cnt"))
        .group_by(SearchLog.query)
        .order_by(func.count(SearchLog.id).desc())
        .limit(20)
        .all()
    )
    for r in search_rows:
        db.add(AnalyticsSearchTrend(keyword=r.query, search_count=r.cnt))

    db.commit()
    print("[Load] Analytics tables refreshed.")


# ── Public entry point ────────────────────────────────────────────────────────

def load(df: pd.DataFrame) -> dict:
    db: Session = SessionLocal()
    try:
        loaded, skipped = load_articles(df, db)
        refresh_analytics(db)
        return {"articles_loaded": loaded, "articles_skipped": skipped}
    finally:
        db.close()
