import sys
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.analytics import ETLRunLog
from app.core.deps import get_admin
from app.schemas.analytics import ETLRunOut

router = APIRouter(prefix="/etl", tags=["ETL"])

# Ensure the etl package is importable from the project root
_ETL_ROOT = Path(__file__).parent.parent.parent.parent
if str(_ETL_ROOT) not in sys.path:
    sys.path.insert(0, str(_ETL_ROOT))


def _run_etl_task(run_id: int):
    from etl.pipeline import run_pipeline
    run_pipeline(run_id=run_id)


@router.post("/run", response_model=ETLRunOut)
def trigger_etl(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin),
):
    # Reset any orphaned "running" records before starting a new run
    db.query(ETLRunLog).filter(ETLRunLog.status == "running").update(
        {"status": "failed", "errors": "Orphaned run reset on new trigger"}
    )
    db.commit()

    log = ETLRunLog(status="running", records_extracted=0, records_transformed=0, records_loaded=0, records_skipped=0)
    db.add(log)
    db.commit()
    db.refresh(log)

    background_tasks.add_task(_run_etl_task, log.id)
    return log


@router.get("/history", response_model=List[ETLRunOut])
def get_etl_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin),
):
    return (
        db.query(ETLRunLog)
        .order_by(ETLRunLog.run_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/status/{run_id}", response_model=ETLRunOut)
def get_etl_run(
    run_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin),
):
    log = db.query(ETLRunLog).filter(ETLRunLog.id == run_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="ETL run not found")
    return log
