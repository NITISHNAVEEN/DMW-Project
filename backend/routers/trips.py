from fastapi import APIRouter, HTTPException
from models.schemas import Trip, TapInRequest, TapOutRequest
from typing import Optional
from datetime import date
import utils.database as db

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post("/tap-in")
def tap_in(body: TapInRequest):
    result = db.call_proc("sp_card_tap_in", [body.card_id, body.station_id])
    if result["result_code"] != 0:
        raise HTTPException(400, result["result_msg"])
    return {"trip_id": result["trip_id"], "message": result["result_msg"]}

@router.post("/tap-out")
def tap_out(body: TapOutRequest):
    result = db.call_proc("sp_card_tap_out", [body.trip_id, body.exit_station_id])
    if result["result_code"] != 0:
        raise HTTPException(400, result["result_msg"])
    return {"fare": result["fare"], "message": result["result_msg"]}

@router.get("", response_model=list[Trip])
def list_trips(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    card_id:   Optional[int]  = None,
    status:    Optional[str]  = None,
):
    sql = """
        SELECT t.trip_id AS id, t.card_id, mc.card_number,
               u.full_name AS user_name,
               t.entry_station_id, es.station_name AS entry_station,
               t.exit_station_id,  xs.station_name AS exit_station,
               t.entry_time, t.exit_time, t.fare_deducted, t.status
        FROM Card_Trips t
        JOIN Metro_Cards mc ON mc.card_id = t.card_id
        JOIN Users u         ON u.user_id  = mc.user_id
        JOIN Stations es     ON es.station_id = t.entry_station_id
        LEFT JOIN Stations xs ON xs.station_id = t.exit_station_id
        WHERE 1=1
    """
    params = []
    if date_from: sql += " AND DATE(t.entry_time) >= %s"; params.append(str(date_from))
    if date_to:   sql += " AND DATE(t.entry_time) <= %s"; params.append(str(date_to))
    if card_id:   sql += " AND t.card_id = %s";           params.append(card_id)
    if status:    sql += " AND t.status = %s";             params.append(status)
    sql += " ORDER BY t.trip_id DESC LIMIT 500"
    return db.get_all(sql, params or None)

@router.get("/active-for-card/{card_id}")
def active_trip_for_card(card_id: int):
    row = db.get_one("""
        SELECT t.trip_id AS id, t.card_id, t.entry_station_id,
               s.station_name AS entry_station, t.entry_time, t.status
        FROM Card_Trips t
        JOIN Stations s ON s.station_id = t.entry_station_id
        WHERE t.card_id=%s AND t.status='IN_PROGRESS'
    """, (card_id,))
    return row or {}