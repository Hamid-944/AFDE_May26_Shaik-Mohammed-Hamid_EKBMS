from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from app.database import engine, Base
from app import models  # ensure all models are registered before create_all
from app.routes import auth, users, categories, tags, articles, approvals, files, search, collaboration, dashboard, analytics, etl

app = FastAPI(
    title="Enterprise Knowledge Base Management System",
    description="Centralized knowledge management platform for enterprises",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = Path("uploads")
upload_dir.mkdir(exist_ok=True)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(articles.router, prefix="/api")
app.include_router(approvals.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(collaboration.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(etl.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "EKBMS API"}
