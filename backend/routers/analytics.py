from fastapi import APIRouter
from typing import Optional
from datetime import date
import utils.database as db

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/revenue-summary")
def revenue_summary(date_from: Optional[date] = None, date_to: Optional[date] = None):
    p_card, p_ticket, p_rech = [], [], []
    w_card   = "WHERE t.status='COMPLETED'"
    w_ticket = "WHERE 1=1"
    w_rech   = "WHERE 1=1"

    if date_from:
        w_card   += " AND DATE(t.exit_time) >= %s";     p_card.append(str(date_from))
        w_ticket += " AND DATE(t.issued_at) >= %s";     p_ticket.append(str(date_from))
        w_rech   += " AND DATE(r.recharged_at) >= %s";  p_rech.append(str(date_from))
    if date_to:
        w_card   += " AND DATE(t.exit_time) <= %s";     p_card.append(str(date_to))
        w_ticket += " AND DATE(t.issued_at) <= %s";     p_ticket.append(str(date_to))
        w_rech   += " AND DATE(r.recharged_at) <= %s";  p_rech.append(str(date_to))

    # Count all trips (completed + in-progress) for the range using entry_time
    p_trips = []
    w_trips = "WHERE 1=1"
    if date_from:
        w_trips += " AND DATE(t.entry_time) >= %s"; p_trips.append(str(date_from))
    if date_to:
        w_trips += " AND DATE(t.entry_time) <= %s"; p_trips.append(str(date_to))

    card_row   = db.get_one(f"SELECT COALESCE(SUM(fare_deducted),0) AS total, COUNT(*) AS cnt FROM Card_Trips t {w_card}", p_card or None)
    ticket_row = db.get_one(f"SELECT COALESCE(SUM(fare_paid),0) AS total, COUNT(*) AS cnt FROM Tickets t {w_ticket}", p_ticket or None)
    rech_row   = db.get_one(f"SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS cnt FROM Card_Recharge_Log r {w_rech}", p_rech or None)
    trips_row  = db.get_one(f"SELECT COUNT(*) AS cnt FROM Card_Trips t {w_trips}", p_trips or None)
    active_row = db.get_one("SELECT COUNT(*) AS cnt FROM Card_Trips WHERE status='IN_PROGRESS'", None)
    at_card    = db.get_one("SELECT COALESCE(SUM(fare_deducted),0) AS total FROM Card_Trips WHERE status='COMPLETED'", None)
    at_ticket  = db.get_one("SELECT COALESCE(SUM(fare_paid),0) AS total FROM Tickets", None)

    return {
        "card_revenue":           float(card_row["total"]),
        "card_trips":             int(trips_row["cnt"]),      # all trips in range, not just completed
        "ticket_revenue":         float(ticket_row["total"]),
        "tickets_sold":           int(ticket_row["cnt"]),
        "recharge_total":         float(rech_row["total"]),
        "recharge_count":         int(rech_row["cnt"]),
        "active_trips":           int(active_row["cnt"]),
        "total_revenue":          float(card_row["total"]) + float(ticket_row["total"]),
        "alltime_card_revenue":   float(at_card["total"]),
        "alltime_ticket_revenue": float(at_ticket["total"]),
        "alltime_total":          float(at_card["total"]) + float(at_ticket["total"]),
    }

@router.get("/daily-revenue")
def daily_revenue(date_from: Optional[date] = None, date_to: Optional[date] = None):
    p1, p2 = [], []
    # Use entry_time so in-progress trips also appear on the chart
    w1 = "WHERE 1=1"
    w2 = "WHERE 1=1"
    if date_from:
        w1 += " AND DATE(t.entry_time) >= %s"; p1.append(str(date_from))
        w2 += " AND DATE(issued_at) >= %s";    p2.append(str(date_from))
    if date_to:
        w1 += " AND DATE(t.entry_time) <= %s"; p1.append(str(date_to))
        w2 += " AND DATE(issued_at) <= %s";    p2.append(str(date_to))

    card_days = db.get_all(
        f"SELECT DATE(t.entry_time) AS date, COALESCE(SUM(t.fare_deducted),0) AS card FROM Card_Trips t {w1} GROUP BY DATE(t.entry_time)",
        p1 or None
    )
    ticket_days = db.get_all(
        f"SELECT DATE(issued_at) AS date, COALESCE(SUM(fare_paid),0) AS ticket FROM Tickets {w2} GROUP BY DATE(issued_at)",
        p2 or None
    )

    merged = {}
    for r in card_days:
        d = str(r["date"])
        merged[d] = {"date": d, "card": float(r["card"] or 0), "ticket": 0}
    for r in ticket_days:
        d = str(r["date"])
        if d not in merged:
            merged[d] = {"date": d, "card": 0, "ticket": 0}
        merged[d]["ticket"] = float(r["ticket"] or 0)

    result = sorted(merged.values(), key=lambda x: x["date"])
    for r in result:
        r["total"] = round(r["card"] + r["ticket"], 2)
    return result

@router.get("/station-revenue")
def station_revenue(date_from: Optional[date] = None, date_to: Optional[date] = None):
    params = []
    # Use entry_time so all trips (including in-progress) count for station traffic
    trip_where = "1=1"
    if date_from:
        trip_where += " AND DATE(t.entry_time) >= %s"; params.append(str(date_from))
    if date_to:
        trip_where += " AND DATE(t.entry_time) <= %s"; params.append(str(date_to))

    sql = f"""
        SELECT s.station_name AS name,
               COALESCE(SUM(t.fare_deducted), 0) AS revenue,
               COUNT(t.trip_id) AS trip_count
        FROM Stations s
        LEFT JOIN Card_Trips t
               ON t.entry_station_id = s.station_id
              AND {trip_where}
        GROUP BY s.station_id, s.station_name
        ORDER BY trip_count DESC, revenue DESC
    """
    return db.get_all(sql, params or None)