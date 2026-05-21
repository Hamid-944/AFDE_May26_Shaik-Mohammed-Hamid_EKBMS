"""
ETL Pipeline Orchestrator
--------------------------
Runs the full Extract → Transform → Load pipeline and records the result
in the etl_run_log table.

Usage:
    python etl/pipeline.py
"""
import sys
import time
import traceback
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from etl.extract import extract
from etl.transform import transform
from etl.load import load

from app.database import SessionLocal
from app.models.analytics import ETLRunLog


def run_pipeline(run_id: int = None) -> dict:
    db = SessionLocal()

    if run_id:
        log = db.query(ETLRunLog).filter(ETLRunLog.id == run_id).first()
    if not run_id or not log:
        log = ETLRunLog(status="running")
        db.add(log)
        db.commit()
        db.refresh(log)

    run_id = log.id

    start = time.time()
    result = {}

    try:
        # ── Extract ──────────────────────────────────────────────────────────
        raw_df = extract()
        log.records_extracted = len(raw_df)

        # ── Transform ────────────────────────────────────────────────────────
        clean_df = transform(raw_df)
        log.records_transformed = len(clean_df)
        log.records_skipped = log.records_extracted - len(clean_df)

        # ── Load ─────────────────────────────────────────────────────────────
        load_result = load(clean_df)
        log.records_loaded = load_result["articles_loaded"]

        log.status = "success"
        result = {
            "run_id": run_id,
            "status": "success",
            "records_extracted": log.records_extracted,
            "records_transformed": log.records_transformed,
            "records_loaded": log.records_loaded,
            "records_skipped": log.records_skipped,
        }

    except Exception as exc:
        log.status = "failed"
        log.errors = traceback.format_exc()
        result = {"run_id": run_id, "status": "failed", "error": str(exc)}
        print(f"[Pipeline] FAILED: {exc}")
        traceback.print_exc()

    finally:
        duration = round(time.time() - start, 2)
        log.duration_seconds = duration
        db.add(log)
        db.commit()
        status = log.status
        db.close()

    print(f"[Pipeline] Finished in {duration}s — {status}")
    return result


if __name__ == "__main__":
    result = run_pipeline()
    print(result)
