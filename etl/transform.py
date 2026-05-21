"""
ETL Transform Stage
-------------------
Cleans and normalises the raw DataFrame:
  - Drops duplicates and rows with missing title/category
  - Strips whitespace from all string columns
  - Normalises category names to Title Case
  - Parses comma-separated tags into a Python list
  - Casts numeric columns (views, avg_rating, word_count) to correct types
  - Fills missing optional fields with sensible defaults
  - Adds a derived `reading_time_min` column
"""
import pandas as pd
import re


def _clean_text(value: str) -> str:
    if not isinstance(value, str):
        return ""
    return re.sub(r"\s+", " ", value.strip())


def transform(df: pd.DataFrame) -> pd.DataFrame:
    original_count = len(df)

    # Strip all string columns
    str_cols = df.select_dtypes(include="object").columns
    for col in str_cols:
        df[col] = df[col].apply(_clean_text)

    # Drop rows without a title or category
    df = df[df["title"].str.len() > 0]
    df = df[df["category"].str.len() > 0]

    # Normalise category to Title Case
    df["category"] = df["category"].str.title()

    # Parse tags: "python,api,rest" → ["python", "api", "rest"]
    df["tags_list"] = df["tags"].apply(
        lambda t: [tag.strip().lower() for tag in t.split(",") if tag.strip()]
        if isinstance(t, str) else []
    )

    # Numeric casts with fallback defaults
    df["views"] = pd.to_numeric(df["views"], errors="coerce").fillna(0).astype(int)
    df["avg_rating"] = pd.to_numeric(df["avg_rating"], errors="coerce")
    df["word_count"] = pd.to_numeric(df["word_count"], errors="coerce").fillna(500).astype(int)

    # Derived column: estimated reading time (200 words/min average)
    df["reading_time_min"] = (df["word_count"] / 200).apply(lambda x: max(1, round(x)))

    # Normalise status
    valid_statuses = {"draft", "pending_approval", "approved", "published", "rejected", "archived"}
    df["status"] = df["status"].str.lower().str.strip()
    df.loc[~df["status"].isin(valid_statuses), "status"] = "published"

    # Fill optional fields
    df["summary"] = df["summary"].fillna("")
    df["author_email"] = df["author_email"].fillna("")

    # Drop duplicates by title + author_email
    df = df.drop_duplicates(subset=["title", "author_email"], keep="first")

    skipped = original_count - len(df)
    print(f"[Transform] {len(df)} clean records ({skipped} dropped/deduplicated)")
    return df.reset_index(drop=True)
