from pydantic import BaseModel, field_validator


class RatingCreate(BaseModel):
    score: int

    @field_validator("score")
    @classmethod
    def validate_score(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class RatingOut(BaseModel):
    id: int
    score: int
    article_id: int
    user_id: int

    model_config = {"from_attributes": True}
