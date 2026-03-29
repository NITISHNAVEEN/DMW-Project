from fastapi import APIRouter
from models.schemas import Fare, FareCreate
import utils.database as db

router = APIRouter(prefix="/fares", tags=["Fares"])

@router.get("", response_model=list[Fare])
def list_fares():
    return db.get_all("""
        SELECT f.from_station_id, f.to_station_id, f.fare_amount,
               a.station_name AS from_name, b.station_name AS to_name
        FROM Fare_Matrix f
        JOIN Stations a ON a.station_id = f.from_station_id
        JOIN Stations b ON b.station_id = f.to_station_id
        ORDER BY f.from_station_id, f.to_station_id
    """)

@router.get("/lookup")
def lookup_fare(from_station_id: int, to_station_id: int):
    lo, hi = min(from_station_id, to_station_id), max(from_station_id, to_station_id)
    row = db.get_one(
        "SELECT fare_amount FROM Fare_Matrix WHERE from_station_id=%s AND to_station_id=%s",
        (lo, hi)
    )
    return {"fare": row["fare_amount"] if row else 20}

@router.post("", response_model=Fare, status_code=201)
def upsert_fare(body: FareCreate):
    lo, hi = min(body.from_station_id, body.to_station_id), max(body.from_station_id, body.to_station_id)
    db.execute_write(
        """INSERT INTO Fare_Matrix (from_station_id, to_station_id, fare_amount)
           VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE fare_amount=%s""",
        (lo, hi, body.fare_amount, body.fare_amount)
    )
    row = db.get_one("""
        SELECT f.from_station_id, f.to_station_id, f.fare_amount,
               a.station_name AS from_name, b.station_name AS to_name
        FROM Fare_Matrix f
        JOIN Stations a ON a.station_id = f.from_station_id
        JOIN Stations b ON b.station_id = f.to_station_id
        WHERE f.from_station_id=%s AND f.to_station_id=%s
    """, (lo, hi))
    return row

@router.delete("/{from_id}/{to_id}")
def delete_fare(from_id: int, to_id: int):
    lo, hi = min(from_id, to_id), max(from_id, to_id)
    db.execute_write("DELETE FROM Fare_Matrix WHERE from_station_id=%s AND to_station_id=%s", (lo, hi))
    return {"deleted": f"{lo}-{hi}"}