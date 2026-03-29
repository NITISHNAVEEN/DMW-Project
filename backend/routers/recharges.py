from fastapi import APIRouter
from typing import Optional
from datetime import date
import utils.database as db

router = APIRouter(prefix="/recharges", tags=["Recharges"])

@router.get("")
def list_recharges(
    date_from: Optional[date] = None,
    date_to:   Optional[date] = None,
    card_id:   Optional[int]  = None,
):
    sql = """
        SELECT r.recharge_id AS id, r.card_id, mc.card_number,
               u.full_name AS user_name, r.amount,
               r.balance_before, r.balance_after, r.recharged_at AS at
        FROM Card_Recharge_Log r
        JOIN Metro_Cards mc ON mc.card_id = r.card_id
        JOIN Users u         ON u.user_id  = mc.user_id
        WHERE 1=1
    """
    params = []
    if date_from: sql += " AND DATE(r.recharged_at) >= %s"; params.append(str(date_from))
    if date_to:   sql += " AND DATE(r.recharged_at) <= %s"; params.append(str(date_to))
    if card_id:   sql += " AND r.card_id = %s";             params.append(card_id)
    sql += " ORDER BY r.recharge_id DESC LIMIT 500"
    return db.get_all(sql, params or None)