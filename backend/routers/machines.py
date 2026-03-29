from fastapi import APIRouter, HTTPException
from models.schemas import Machine, MachineCreate, MachineUpdate
import utils.database as db

router = APIRouter(prefix="/machines", tags=["Machines"])

@router.get("", response_model=list[Machine])
def list_machines():
    return db.get_all("""
        SELECT m.machine_id AS id, m.station_id, s.station_name,
               m.machine_code AS code, m.status
        FROM Vending_Machines m JOIN Stations s ON s.station_id = m.station_id
        ORDER BY m.machine_id
    """)

@router.post("", response_model=Machine, status_code=201)
def create_machine(body: MachineCreate):
    if db.get_one("SELECT machine_id FROM Vending_Machines WHERE machine_code=%s", (body.code,)):
        raise HTTPException(400, "Machine code already exists")
    mid = db.execute_insert(
        "INSERT INTO Vending_Machines (station_id, machine_code, status, installed_at) VALUES (%s,%s,%s,CURDATE())",
        (body.station_id, body.code, body.status)
    )
    station = db.get_one("SELECT station_name FROM Stations WHERE station_id=%s", (body.station_id,))
    return {"id": mid, "station_id": body.station_id,
            "station_name": station["station_name"] if station else "",
            "code": body.code, "status": body.status}

@router.put("/{machine_id}")
def update_machine(machine_id: int, body: MachineUpdate):
    db.execute_write(
        "UPDATE Vending_Machines SET station_id=%s, machine_code=%s, status=%s WHERE machine_id=%s",
        (body.station_id, body.code, body.status, machine_id)
    )
    return {"id": machine_id, **body.dict()}

@router.delete("/{machine_id}")
def delete_machine(machine_id: int):
    if db.get_one("SELECT COUNT(*) AS c FROM Tickets WHERE machine_id=%s", (machine_id,))["c"] > 0:
        raise HTTPException(400, "Machine has ticket history — cannot delete")
    db.execute_write("DELETE FROM Vending_Machines WHERE machine_id=%s", (machine_id,))
    return {"deleted": machine_id}