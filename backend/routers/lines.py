from fastapi import APIRouter
from models.schemas import Liness, LinessCreate
import utils.database as db

router = APIRouter(prefix="/liness", tags=["Lines"])

@router.get("", response_model=list[Liness])
def list_lines():
    return db.get_all("SELECT line_id AS id, line_name AS name, color_hex AS color, active FROM Liness ORDER BY line_id")

@router.post("", response_model=Liness, status_code=201)
def create_line(body: LinessCreate):
    lid = db.execute_insert(
        "INSERT INTO Liness (line_name, color_hex, active) VALUES (%s, %s, %s)",
        (body.name, body.color, body.active)
    )
    return {"id": lid, "name": body.name, "color": body.color, "active": body.active}

@router.put("/{line_id}", response_model=Liness)
def update_line(line_id: int, body: LinessCreate):
    db.execute_write(
        "UPDATE Liness SET line_name=%s, color_hex=%s, active=%s WHERE line_id=%s",
        (body.name, body.color, body.active, line_id)
    )
    return {"id": line_id, **body.dict()}

@router.delete("/{line_id}")
def delete_line(line_id: int):
    db.execute_write("DELETE FROM Liness WHERE line_id=%s", (line_id,))
    return {"deleted": line_id}