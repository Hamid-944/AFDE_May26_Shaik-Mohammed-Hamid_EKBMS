"""
ETL Extract Stage
-----------------
Reads article records from datasets/articles.csv and returns a raw DataFrame.
"""
import pandas as pd
from pathlib import Path

DATASET_PATH = Path(__file__).parent.parent / "datasets" / "articles.csv"

REQUIRED_COLUMNS = {
    "id", "title", "category", "tags", "author_name", "author_email",
    "views", "avg_rating", "word_count", "status", "created_date", "summary",
}


def extract(path: Path = DATASET_PATH) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")

    df = pd.read_csv(path, dtype=str)

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")

    print(f"[Extract] Read {len(df)} records from {path.name}")
    return df
