from pydantic import BaseModel
from datetime import datetime


class TagCreate(BaseModel):
    name: str


class TagOut(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
