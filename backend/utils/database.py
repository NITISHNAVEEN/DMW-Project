"""
utils/database.py — MySQL connection pool + helpers
"""

import os
import mysql.connector
from mysql.connector import pooling
from typing import Optional

DB_CONFIG = {
    "host":     os.getenv("DB_HOST",     "localhost"),
    "port":     int(os.getenv("DB_PORT", "3306")),
    "user":     os.getenv("DB_USER",     "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME",     "patna_metro"),
    "autocommit": True,
    "time_zone": "+05:30",
}

_pool: Optional[pooling.MySQLConnectionPool] = None

def get_pool() -> pooling.MySQLConnectionPool:
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="metro_pool",
            pool_size=10,
            **DB_CONFIG,
        )
    return _pool

def get_conn():
    return get_pool().get_connection()

def get_all(sql: str, params=None) -> list[dict]:
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or ())
        return cur.fetchall()
    finally:
        conn.close()

def get_one(sql: str, params=None) -> Optional[dict]:
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or ())
        return cur.fetchone()
    finally:
        conn.close()

def execute_write(sql: str, params=None) -> int:
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        conn.commit()
        return cur.rowcount
    finally:
        conn.close()

def execute_insert(sql: str, params=None) -> int:
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()

def call_proc(proc_name: str, args: list) -> dict:
    """
    Calls stored procedures using session variables on a dedicated
    autocommit=False connection — guarantees SET/CALL/SELECT share
    the same session so OUT params are always visible.
    """
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "patna_metro"),
        autocommit=False,
        time_zone="+05:30",
    )
    try:
        cur = conn.cursor()

        if proc_name == "sp_card_tap_in":
            cur.execute("SET @p_trip_id=0, @p_code=0, @p_msg=''")
            cur.execute("CALL sp_card_tap_in(%s, %s, @p_trip_id, @p_code, @p_msg)", args)
            cur.execute("SELECT @p_trip_id, @p_code, @p_msg")
            row = cur.fetchone()
            conn.commit()
            return {
                "trip_id":     row[0],
                "result_code": int(row[1]) if row[1] is not None else 1,
                "result_msg":  row[2] or "",
            }

        elif proc_name == "sp_card_tap_out":
            cur.execute("SET @p_fare=0.0, @p_code=0, @p_msg=''")
            cur.execute("CALL sp_card_tap_out(%s, %s, @p_fare, @p_code, @p_msg)", args)
            cur.execute("SELECT @p_fare, @p_code, @p_msg")
            row = cur.fetchone()
            conn.commit()
            return {
                "fare":        float(row[0]) if row[0] is not None else 0.0,
                "result_code": int(row[1])   if row[1] is not None else 1,
                "result_msg":  row[2] or "",
            }

        elif proc_name == "sp_recharge_card":
            cur.execute("SET @p_code=0, @p_msg=''")
            cur.execute("CALL sp_recharge_card(%s, %s, %s, @p_code, @p_msg)", args)
            cur.execute("SELECT @p_code, @p_msg")
            row = cur.fetchone()
            conn.commit()
            return {
                "result_code": int(row[0]) if row[0] is not None else 1,
                "result_msg":  row[1] or "",
            }

        elif proc_name == "sp_issue_ticket":
            cur.execute("SET @p_ticket_code='', @p_fare=0.0, @p_code=0, @p_msg=''")
            cur.execute(
                "CALL sp_issue_ticket(%s, %s, %s, @p_ticket_code, @p_fare, @p_code, @p_msg)",
                args
            )
            cur.execute("SELECT @p_ticket_code, @p_fare, @p_code, @p_msg")
            row = cur.fetchone()
            conn.commit()
            return {
                "ticket_code": row[0],
                "fare":        float(row[1]) if row[1] is not None else 0.0,
                "result_code": int(row[2])   if row[2] is not None else 1,
                "result_msg":  row[3]        if row[3] is not None else "",
            }

        else:
            raise ValueError(f"Unknown procedure: {proc_name}")

    except Exception:
        try: conn.rollback()
        except Exception: pass
        raise
    finally:
        conn.close()

def init_db():
    try:
        row = get_one("SELECT COUNT(*) AS c FROM Stations")
        print(f"[DB] Connected — {row['c']} stations loaded")
    except Exception as e:
        print(f"[DB] WARNING: Could not connect — {e}")