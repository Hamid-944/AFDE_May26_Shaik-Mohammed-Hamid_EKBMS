from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.models.article import Article
from app.core.deps import get_current_user, get_admin
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut, CategoryTree

router = APIRouter(prefix="/categories", tags=["Categories"])


def build_tree(categories: List[Category], parent_id=None) -> List[dict]:
    result = []
    for cat in categories:
        if cat.parent_id == parent_id:
            count = len([a for a in cat.articles])
            node = CategoryOut(
                id=cat.id,
                name=cat.name,
                description=cat.description,
                parent_id=cat.parent_id,
                icon=cat.icon,
                color=cat.color,
                article_count=count,
                created_at=cat.created_at,
            ).model_dump()
            node["children"] = build_tree(categories, cat.id)
            result.append(node)
    return result


@router.get("", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [
        CategoryOut(
            id=c.id, name=c.name, description=c.description, parent_id=c.parent_id,
            icon=c.icon, color=c.color, article_count=len(c.articles), created_at=c.created_at
        )
        for c in cats
    ]


@router.get("/tree")
def get_category_tree(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return build_tree(cats, parent_id=None)


@router.get("/{category_id}", response_model=CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryOut(
        id=cat.id, name=cat.name, description=cat.description, parent_id=cat.parent_id,
        icon=cat.icon, color=cat.color, article_count=len(cat.articles), created_at=cat.created_at
    )


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin),
):
    if payload.parent_id:
        parent = db.query(Category).filter(Category.id == payload.parent_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent category not found")
    cat = Category(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return CategoryOut(id=cat.id, name=cat.name, description=cat.description, parent_id=cat.parent_id,
                       icon=cat.icon, color=cat.color, article_count=0, created_at=cat.created_at)


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return CategoryOut(id=cat.id, name=cat.name, description=cat.description, parent_id=cat.parent_id,
                       icon=cat.icon, color=cat.color, article_count=len(cat.articles), created_at=cat.created_at)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if cat.articles:
        raise HTTPException(status_code=400, detail="Cannot delete category with existing articles")
    if cat.children:
        raise HTTPException(status_code=400, detail="Cannot delete category with subcategories")
    db.delete(cat)
    db.commit()



