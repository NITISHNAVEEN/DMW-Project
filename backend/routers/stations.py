from fastapi import APIRouter, HTTPException
from models.schemas import Station, StationCreate
import utils.database as db

router = APIRouter(prefix="/stations", tags=["Stations"])

@router.get("", response_model=list[Station])
def list_stations():
    return db.get_all("SELECT station_id AS id, station_name AS name FROM Stations ORDER BY station_id")

@router.post("", response_model=Station, status_code=201)
def create_station(body: StationCreate):
    sid = db.execute_insert(
        "INSERT INTO Stations (station_name, latitude, longitude) VALUES (%s, %s, %s)",
        (body.name, body.latitude or 0, body.longitude or 0)
    )
    return {"id": sid, "name": body.name}

@router.put("/{station_id}", response_model=Station)
def update_station(station_id: int, body: StationCreate):
    db.execute_write("UPDATE Stations SET station_name=%s WHERE station_id=%s", (body.name, station_id))
    return {"id": station_id, "name": body.name}

@router.delete("/{station_id}")
def delete_station(station_id: int):
    used = db.get_one(
        "SELECT COUNT(*) AS c FROM Card_Trips WHERE entry_station_id=%s OR exit_station_id=%s",
        (station_id, station_id)
    )
    if used and used["c"] > 0:
        raise HTTPException(400, "Station has trip history — cannot delete")
    db.execute_write("DELETE FROM Stations WHERE station_id=%s", (station_id,))
    return {"deleted": station_id}