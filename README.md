# Patna Metro — Full Stack Setup Guide
## FastAPI + MySQL + React

---

## PROJECT STRUCTURE

```
patna_metro/
├── backend/
│   ├── main.py            ← All API routes (FastAPI)
│   ├── database.py        ← MySQL connection pool + query helpers
│   ├── schemas.py         ← Pydantic request/response models
│   ├── requirements.txt   ← Python dependencies
│   └── .env.example       ← Copy to .env and fill credentials
│
└── frontend/
    ├── api.js             ← ★ SINGLE shared API client (all 3 apps import this)
    ├── AdminApp.jsx        ← Laptop 1
    ├── VendingMachineApp.jsx ← Laptop 2 (×2)
    └── TravelCardApp.jsx  ← Laptop 4
```

---

## STEP 1 — MySQL Workbench

1. Open MySQL Workbench and run `patna_metro_schema.sql` (your existing schema)
2. Confirm tables exist: `Stations`, `Users`, `Metro_Cards`, `Card_Trips`,
   `Tickets`, `Vending_Machines`, `Fare_Matrix`, `Card_Recharge_Log`, `Audit_Log`
3. The stored procedures `sp_card_tap_in`, `sp_card_tap_out`,
   `sp_recharge_card`, `sp_issue_ticket` must also be present in the schema

---

## STEP 2 — Backend Setup

```bash
cd patna_metro/backend

# Copy and fill in your credentials
cp .env.example .env
# Edit .env: set DB_PASSWORD to your MySQL root password

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Test it: open http://localhost:8000/docs — you should see all API routes.

---

## STEP 3 — Frontend Setup (React)

Each JSX file is a standalone React app. Use Vite or Create React App.

### Quick setup with Vite (do this once per laptop):

```bash
npm create vite@latest laptop1 -- --template react
cd laptop1
npm install
npm install recharts
```

Then copy the files:
```
api.js        → laptop1/src/api.js
AdminApp.jsx  → laptop1/src/App.jsx
```

Set the API URL in `api.js`:
```js
export const BASE_URL = "http://<IP_OF_LAPTOP_RUNNING_BACKEND>:8000";
```

Run:
```bash
npm start
```

**Repeat for Laptop 2 (VendingMachineApp.jsx) and Laptop 4 (TravelCardApp.jsx).**

---

## STEP 4 — Multi-Laptop Setup (all on same WiFi)

1. Run the FastAPI backend on **one laptop** (e.g. the Admin laptop)
2. Note its local IP (e.g. `192.168.1.10`)
3. On **all other laptops**, edit `api.js`:
   ```js
   export const BASE_URL = "http://192.168.1.10:8000";
   ```
4. All apps now share the same MySQL database in real time

---

## VENDING MACHINE — Machine Selection

The VendingMachineApp reads which machine it is from the URL:
```
http://localhost:5174?machine=1   ← Machine ID 1
http://localhost:5174?machine=2   ← Machine ID 2
```

Set this on each kiosk laptop so they report correctly to the DB.

---

## API ENDPOINTS SUMMARY

| Method | Endpoint | What it does |
|--------|----------|-------------|
| GET | `/stations` | List all stations |
| POST | `/stations` | Add a station |
| PUT | `/stations/{id}` | Edit a station |
| DELETE | `/stations/{id}` | Delete a station |
| GET | `/fares` | List fare matrix |
| POST | `/fares` | Add/update a fare |
| DELETE | `/fares/{from}/{to}` | Remove a fare |
| GET | `/fares/lookup?from_station_id=&to_station_id=` | Get fare for a route |
| GET | `/users` | List users |
| POST | `/users` | Create user |
| PUT | `/users/{id}` | Edit user |
| DELETE | `/users/{id}` | Delete user |
| GET | `/cards` | List all cards |
| GET | `/cards/user/{user_id}` | Cards for a user |
| POST | `/cards` | Issue new card |
| PUT | `/cards/{id}` | Update card balance/status |
| DELETE | `/cards/{id}` | Remove card |
| POST | `/cards/{id}/recharge` | Recharge card balance |
| POST | `/trips/tap-in` | Card tap-in (calls stored proc) |
| POST | `/trips/tap-out` | Card tap-out (calls stored proc) |
| GET | `/trips?date_from=&date_to=&card_id=&status=` | List trips with filters |
| GET | `/trips/active-for-card/{card_id}` | Get open trip for a card |
| GET | `/machines` | List vending machines |
| POST | `/machines` | Add a machine |
| PUT | `/machines/{id}` | Edit machine |
| DELETE | `/machines/{id}` | Remove machine |
| POST | `/tickets` | Issue a ticket (calls stored proc) |
| GET | `/tickets?date_from=&date_to=&machine_id=` | List tickets with filters |
| GET | `/recharges?date_from=&date_to=&card_id=` | Recharge history |
| GET | `/audit?date_from=&date_to=` | Audit log |
| GET | `/analytics/revenue-summary?date_from=&date_to=` | Revenue KPIs |
| GET | `/analytics/daily-revenue?date_from=&date_to=` | Day-by-day revenue |
| GET | `/analytics/station-revenue?date_from=&date_to=` | Revenue by station |

---

## WHAT IS HARDCODED vs WHAT COMES FROM DB

| Item | Source |
|------|--------|
| Station names | ✅ MySQL → `Stations` table |
| Fare amounts | ✅ MySQL → `Fare_Matrix` table |
| User names & PINs | ✅ MySQL → `Users` table |
| Card balances | ✅ MySQL → `Metro_Cards` table |
| Machine list | ✅ MySQL → `Vending_Machines` table |
| Trip history | ✅ MySQL → `Card_Trips` table |
| Ticket history | ✅ MySQL → `Tickets` table |
| Admin password | ⚠ Hardcoded as `admin123` — change in AdminApp.jsx |
| BASE_URL | ⚠ Set once in `api.js` per deployment |

---

## TROUBLESHOOTING

**"Cannot connect to DB" on startup**
→ Check `.env` DB_PASSWORD is correct. Run `mysql -u root -p` to verify.

**CORS error in browser**
→ Make sure FastAPI is running with `--host 0.0.0.0` and `api.js BASE_URL` matches the server IP.

**Stored procedure errors**
→ The `sp_card_tap_in` etc. must exist in the DB. Check your schema SQL includes the `DELIMITER` blocks.

**Vending machine shows wrong machine**
→ Add `?machine=<id>` to the URL. Machine IDs come from `Vending_Machines` table.
















# Patna Metro — Technical Brief for Presentation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | MySQL 8.0 — InnoDB, stored procedures, views |
| Backend | FastAPI (Python) — REST API, connection pooling |
| Frontend | React (3 separate apps) — polling-based live sync |
| Communication | JSON over HTTP, shared api.js client |

---

## ACID Properties

| Property | Mechanism |
|----------|-----------|
| Atomicity | All 4 stored procedures wrap every write in START TRANSACTION / COMMIT / ROLLBACK — 3 writes in tap-out either all happen or none do |
| Consistency | CHECK constraints (balance >= 0, PIN = 4 digits), FK RESTRICT (cannot delete user with cards), business logic in procedures (card ACTIVE, balance >= Rs.10, no double tap-in) |
| Isolation | SELECT ... FOR UPDATE row-level locks prevent two simultaneous tap-ins passing the same check. Fixed lock order (Card_Trips then Metro_Cards always) prevents deadlocks |
| Durability | InnoDB Write-Ahead Log — COMMIT flushes to disk before acknowledging. Survives power cuts |

---

## Database Design

13 tables, all BCNF — every non-key attribute depends on the whole key and nothing but the key.

```
Liness ──< Liness_Stations >── Stations ──< Fare_Matrix
                                    │
                         Interchange_Stations

Users ──< Metro_Cards ──< Card_Trips
              │
              └──< Card_Recharge_Log

Vending_Machines ──< Tickets

Admins        Audit_Log (all financial events)
```

### Key Schema Decisions

- Fare_Matrix — composite key (from < to) always, fare depends on a pair not one station
- Card_Recharge_Log — has CHECK (balance_after = balance_before + amount) — corrupt recharge cannot exist
- Audit_Log — append-only ledger, every tap/recharge/ticket writes here with signed amount_delta
- Users != Admins — different attributes, different auth, no nullable columns from merging

### 4 Stored Procedures
App never writes directly to balances or trips — only through these:

| Procedure | What it does |
|-----------|-------------|
| sp_card_tap_in | Lock card -> validate -> open trip -> audit |
| sp_card_tap_out | Lock trip -> lock card -> deduct fare -> close trip -> audit |
| sp_recharge_card | Lock card -> add balance -> log -> audit |
| sp_issue_ticket | UUID before transaction -> lock machine -> insert ticket -> audit |

### 3 Views
| View | Purpose |
|------|---------|
| vw_daily_revenue | Day-by-day card + ticket revenue for admin charts |
| vw_station_traffic | Entry count per station, active trips now |
| vw_card_balances | Card + owner + balance + active trip flag |

### Indexes
| Index | Why |
|-------|-----|
| (card_id, status) on Card_Trips | Every tap-in checks for open trip — without this, full table scan |
| created_at on Audit_Log | Admin date-range filters — without this, full scan of millions of rows |

---

## Data Flow — Database to Frontend

```
MySQL
  └─ Stored Procedure / SQL query
       └─ database.py (connection pool, 10 connections)
            └─ main.py (FastAPI route returns JSON)
                 └─ api.js (shared fetch client)
                      └─ React component (useState + useEffect)
                           └─ Rendered on screen
```

### Live Sync — Polling Intervals

| Interface | Polls every | What refreshes |
|-----------|-------------|----------------|
| Admin | 5s | Revenue, trips, tickets, audit log, ticker bar |
| Vending Machine | 3s | Machine status, recent tickets (silent — no loading flash) |
| Travel Card | 3s | Balance, active trip status |

All writes go through stored procedures -> MySQL enforces ACID -> JSON response -> React state update -> UI re-renders.

---

## Architecture

```
+--------------+  +-----------------+  +--------------+
|  AdminApp    |  | VendingMachine  |  |  TravelCard  |
|  laptop 1    |  |  laptop 2 (x2)  |  |   laptop 4   |
+------+-------+  +--------+--------+  +------+-------+
       |                   |                  |
       +-------------------+------------------+
                           | HTTP (same WiFi)
              +------------+------------+
              |   FastAPI Backend       |
              |   main.py :8000         |
              +------------+------------+
                           | mysql-connector (pool)
              +------------+------------+
              |   MySQL Database        |
              |   patna_metro DB        |
              +-------------------------+
```

---

## File Directory

```
patna_metro/
│
├── patna_metro_schema.sql    <- Entire DB: 13 tables, 4 stored procs, 3 views, seed data
│
├── backend/
│   ├── main.py               <- All 40+ API routes (GET/POST/PUT/DELETE for every entity)
│   ├── database.py           <- MySQL connection pool + helpers (get_all, get_one, call_proc)
│   ├── schemas.py            <- Pydantic models — shape of every request and response
│   ├── requirements.txt      <- Python dependencies (FastAPI, uvicorn, mysql-connector, pydantic)
│   └── .env                  <- DB credentials (host, port, user, password, db name)
│
└── frontend/
    ├── api.js                <- Single shared API client — all 3 apps import this, change BASE_URL once
    ├── AdminApp.jsx          <- Revenue charts, trip/ticket tables, full CRUD, audit log with delete
    ├── VendingMachineApp.jsx <- 3-step ticket wizard, fare lookup, prints ticket, polls machine status
    └── TravelCardApp.jsx     <- Login via PIN, tap-in/tap-out, recharge, trip history, live balance
```
