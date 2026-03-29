from fastapi import APIRouter, HTTPException
from models.schemas import User, UserCreate, UserLogin
import utils.database as db

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=list[User])
def list_users():
    return db.get_all(
        "SELECT user_id AS id, full_name AS name, email, phone, pin FROM Users ORDER BY user_id"
    )

@router.post("", response_model=User, status_code=201)
def create_user(body: UserCreate):
    if db.get_one("SELECT user_id FROM Users WHERE email=%s", (body.email,)):
        raise HTTPException(400, "Email already registered")
    uid = db.execute_insert(
        "INSERT INTO Users (full_name, email, phone, password_hash, pin) VALUES (%s,%s,%s,%s,%s)",
        (body.name, body.email, body.phone, "hashed_placeholder", body.pin)
    )
    return {"id": uid, "name": body.name, "email": body.email, "phone": body.phone, "pin": body.pin}

@router.put("/{user_id}", response_model=User)
def update_user(user_id: int, body: UserCreate):
    db.execute_write(
        "UPDATE Users SET full_name=%s, email=%s, phone=%s, pin=%s WHERE user_id=%s",
        (body.name, body.email, body.phone, body.pin, user_id)
    )
    return {"id": user_id, **body.dict()}

@router.delete("/{user_id}")
def delete_user(user_id: int):
    if db.get_one("SELECT COUNT(*) AS c FROM Metro_Cards WHERE user_id=%s", (user_id,))["c"] > 0:
        raise HTTPException(400, "User has cards — remove cards first")
    db.execute_write("DELETE FROM Users WHERE user_id=%s", (user_id,))
    return {"deleted": user_id}

@router.post("/login")
def user_login(body: UserLogin):
    row = db.get_one(
        "SELECT user_id AS id, full_name AS name FROM Users WHERE email=%s AND pin=%s",
        (body.email, body.pin)
    )
    if not row:
        raise HTTPException(401, "Invalid credentials")
    return row