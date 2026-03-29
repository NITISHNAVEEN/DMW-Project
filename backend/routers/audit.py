from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import date
import utils.database as db

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("")
def list_audit(
    date_from:  Optional[date] = None,
    date_to:    Optional[date] = None,
    event_type: Optional[str]  = None,
):
    sql = "SELECT * FROM Audit_Log WHERE 1=1"
    params = []
    if date_from:  sql += " AND DATE(created_at) >= %s"; params.append(str(date_from))
    if date_to:    sql += " AND DATE(created_at) <= %s"; params.append(str(date_to))
    if event_type: sql += " AND event_type = %s";        params.append(event_type)
    sql += " ORDER BY log_id DESC LIMIT 1000"
    return db.get_all(sql, params or None)

@router.delete("")
def delete_all_audit():
    db.execute_write("DELETE FROM Audit_Log", None)
    return {"deleted": "all"}

@router.delete("/{log_id}")
def delete_audit_entry(log_id: int):
    if not db.get_one("SELECT log_id FROM Audit_Log WHERE log_id=%s", (log_id,)):
        raise HTTPException(404, "Audit log entry not found")
    db.execute_write("DELETE FROM Audit_Log WHERE log_id=%s", (log_id,))
    return {"deleted": log_id}