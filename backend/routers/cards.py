from fastapi import APIRouter, HTTPException
from models.schemas import Card, CardCreate, CardUpdate, RechargeRequest
import utils.database as db

router = APIRouter(prefix="/cards", tags=["Cards"])

_CARD_SQL = """
    SELECT c.card_id AS id, c.user_id, c.card_number AS number,
           c.balance, c.status, u.full_name AS user_name
    FROM Metro_Cards c JOIN Users u ON u.user_id = c.user_id
"""

@router.get("", response_model=list[Card])
def list_cards():
    return db.get_all(_CARD_SQL + " ORDER BY c.card_id")

@router.get("/user/{user_id}", response_model=list[Card])
def cards_by_user(user_id: int):
    return db.get_all(_CARD_SQL + " WHERE c.user_id=%s ORDER BY c.card_id", (user_id,))

@router.post("", response_model=Card, status_code=201)
def create_card(body: CardCreate):
    if db.get_one("SELECT card_id FROM Metro_Cards WHERE card_number=%s", (body.number,)):
        raise HTTPException(400, "Card number already exists")
    cid = db.execute_insert(
        "INSERT INTO Metro_Cards (user_id, card_number, balance, status) VALUES (%s,%s,%s,%s)",
        (body.user_id, body.number, body.balance, body.status)
    )
    user = db.get_one("SELECT full_name AS user_name FROM Users WHERE user_id=%s", (body.user_id,))
    return {"id": cid, "user_id": body.user_id, "number": body.number,
            "balance": body.balance, "status": body.status,
            "user_name": user["user_name"] if user else ""}

@router.put("/{card_id}")
def update_card(card_id: int, body: CardUpdate):
    db.execute_write(
        "UPDATE Metro_Cards SET balance=%s, status=%s WHERE card_id=%s",
        (body.balance, body.status, card_id)
    )
    return {"id": card_id, "balance": body.balance, "status": body.status}

@router.delete("/{card_id}")
def delete_card(card_id: int):
    active = db.get_one(
        "SELECT COUNT(*) AS c FROM Card_Trips WHERE card_id=%s AND status='IN_PROGRESS'",
        (card_id,)
    )
    if active and active["c"] > 0:
        raise HTTPException(400, "Card has an active trip — cannot delete")
    db.execute_write("DELETE FROM Metro_Cards WHERE card_id=%s", (card_id,))
    return {"deleted": card_id}

@router.post("/{card_id}/recharge")
def recharge_card(card_id: int, body: RechargeRequest):
    if body.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    if not db.get_one("SELECT card_id FROM Metro_Cards WHERE card_id=%s", (card_id,)):
        raise HTTPException(404, "Card not found")
    result = db.call_proc("sp_recharge_card", [card_id, body.amount, body.remarks or "USER_RECHARGE"])
    if result["result_code"] != 0:
        raise HTTPException(400, result["result_msg"])
    updated = db.get_one("SELECT balance FROM Metro_Cards WHERE card_id=%s", (card_id,))
    return {"card_id": card_id, "amount_added": body.amount, "new_balance": updated["balance"]}