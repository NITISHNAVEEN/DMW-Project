from fastapi import APIRouter, HTTPException
from models.schemas import Ticket, TicketRequest
from typing import Optional
from datetime import date
import utils.database as db

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.post("", status_code=201)
def issue_ticket(body: TicketRequest):
    result = db.call_proc("sp_issue_ticket", [body.machine_id, body.from_station_id, body.to_station_id])
    if result["result_code"] != 0:
        raise HTTPException(400, result["result_msg"])

    ticket_code = result.get("ticket_code")
    if not ticket_code:
        raise HTTPException(500, "Ticket issued but code not returned — check stored procedure")

    # Try to fetch full row with station names; fallback to proc data on timing miss
    ticket = db.get_one("""
        SELECT t.ticket_id AS id, t.ticket_code AS code, t.fare_paid,
               t.issued_at, t.valid_until, t.status,
               t.from_station_id, t.to_station_id,
               a.station_name AS from_name, b.station_name AS to_name,
               t.machine_id
        FROM Tickets t
        JOIN Stations a ON a.station_id = t.from_station_id
        JOIN Stations b ON b.station_id = t.to_station_id
        WHERE t.ticket_code = %s
    """, (ticket_code,))

    if not ticket:
        # Proc committed but pool SELECT missed it — build response from proc output
        # Fetch station names from Stations table using the IDs
        stn_a = db.get_one("SELECT station_name FROM Stations WHERE station_id=%s", (body.from_station_id,))
        stn_b = db.get_one("SELECT station_name FROM Stations WHERE station_id=%s", (body.to_station_id,))
        ticket = {
            "id":              None,
            "code":            ticket_code,
            "fare_paid":       result.get("fare", 0),
            "issued_at":       None,
            "valid_until":     None,
            "status":          "VALID",
            "from_station_id": body.from_station_id,
            "to_station_id":   body.to_station_id,
            "from_name":       stn_a["station_name"] if stn_a else None,
            "to_name":         stn_b["station_name"] if stn_b else None,
            "machine_id":      body.machine_id,
        }
    return ticket

@router.get("", response_model=list[Ticket])
def list_tickets(
    date_from:  Optional[date] = None,
    date_to:    Optional[date] = None,
    machine_id: Optional[int]  = None,
):
    sql = """
        SELECT t.ticket_id AS id, t.ticket_code AS code, t.fare_paid,
               t.issued_at, t.valid_until, t.status,
               t.from_station_id, t.to_station_id,
               a.station_name AS from_name, b.station_name AS to_name, t.machine_id
        FROM Tickets t
        JOIN Stations a ON a.station_id = t.from_station_id
        JOIN Stations b ON b.station_id = t.to_station_id
        WHERE 1=1
    """
    params = []
    if date_from:  sql += " AND DATE(t.issued_at) >= %s"; params.append(str(date_from))
    if date_to:    sql += " AND DATE(t.issued_at) <= %s"; params.append(str(date_to))
    if machine_id: sql += " AND t.machine_id = %s";       params.append(machine_id)
    sql += " ORDER BY t.ticket_id DESC LIMIT 500"
    return db.get_all(sql, params or None)