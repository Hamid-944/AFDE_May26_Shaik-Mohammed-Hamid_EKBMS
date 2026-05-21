from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class ETLRunLog(Base):
    __tablename__ = "etl_run_log"

    id = Column(Integer, primary_key=True, index=True)
    run_at = Column(DateTime, server_default=func.now())
    status = Column(String(20), nullable=False)  # running, success, failed
    records_extracted = Column(Integer, default=0)
    records_transformed = Column(Integer, default=0)
    records_loaded = Column(Integer, default=0)
    records_skipped = Column(Integer, default=0)
    errors = Column(Text, nullable=True)
    duration_seconds = Column(Float, nullable=True)


class AnalyticsMostViewed(Base):
    __tablename__ = "analytics_most_viewed"

    id = Column(Integer, primary_key=True, index=True)
    article_title = Column(String(500), nullable=False)
    category = Column(String(200), nullable=True)
    author_name = Column(String(200), nullable=True)
    view_count = Column(Integer, default=0)
    avg_rating = Column(Float, nullable=True)
    source = Column(String(20), default="db")  # db or csv
    computed_at = Column(DateTime, server_default=func.now())


class AnalyticsCategoryTrend(Base):
    __tablename__ = "analytics_category_trends"

    id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(200), nullable=False)
    article_count = Column(Integer, default=0)
    total_views = Column(Integer, default=0)
    avg_rating = Column(Float, nullable=True)
    computed_at = Column(DateTime, server_default=func.now())


class AnalyticsAuthorStats(Base):
    __tablename__ = "analytics_author_stats"

    id = Column(Integer, primary_key=True, index=True)
    author_name = Column(String(200), nullable=False)
    author_email = Column(String(200), nullable=True)
    article_count = Column(Integer, default=0)
    total_views = Column(Integer, default=0)
    avg_rating = Column(Float, nullable=True)
    computed_at = Column(DateTime, server_default=func.now())


class AnalyticsSearchTrend(Base):
    __tablename__ = "analytics_search_trends"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(300), nullable=False)
    search_count = Column(Integer, default=0)
    computed_at = Column(DateTime, server_default=func.now())
