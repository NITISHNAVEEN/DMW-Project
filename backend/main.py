"""
Patna Metro — FastAPI Backend
Run:  uvicorn main:app --reload --host 0.0.0.0 --port 8000
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()   # reads .env before any import touches os.getenv

import utils.database as db
from routers import stations, lines, fares, users, cards, trips, machines, tickets, recharges, audit, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield

app = FastAPI(title="Patna Metro API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}

app.include_router(stations.router)
app.include_router(lines.router)
app.include_router(fares.router)
app.include_router(users.router)
app.include_router(cards.router)
app.include_router(trips.router)
app.include_router(machines.router)
app.include_router(tickets.router)
app.include_router(recharges.router)
app.include_router(audit.router)
app.include_router(analytics.router)