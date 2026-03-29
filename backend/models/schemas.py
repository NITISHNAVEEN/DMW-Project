"""
models/schemas.py — Pydantic v1 request/response models
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StationCreate(BaseModel):
    name: str
    latitude:  Optional[float] = 0.0
    longitude: Optional[float] = 0.0

class Station(BaseModel):
    id:   int
    name: str
    class Config:
        orm_mode = True

class LinessCreate(BaseModel):
    name:   str
    color:  str  = "#1E88E5"
    active: bool = True

class Liness(BaseModel):
    id:     int
    name:   str
    color:  str
    active: bool
    class Config:
        orm_mode = True

class FareCreate(BaseModel):
    from_station_id: int
    to_station_id:   int
    fare_amount:     float

class Fare(BaseModel):
    from_station_id: int
    to_station_id:   int
    fare_amount:     float
    from_name:       str
    to_name:         str
    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    name:  str
    email: str
    phone: str
    pin:   str

class UserLogin(BaseModel):
    email: str
    pin:   str

class User(BaseModel):
    id:    int
    name:  str
    email: str
    phone: str
    pin:   str
    class Config:
        orm_mode = True

class CardCreate(BaseModel):
    user_id: int
    number:  str
    balance: float = 0.0
    status:  str   = "ACTIVE"

class CardUpdate(BaseModel):
    balance: float
    status:  str

class Card(BaseModel):
    id:        int
    user_id:   int
    number:    str
    balance:   float
    status:    str
    user_name: Optional[str] = None
    class Config:
        orm_mode = True

class RechargeRequest(BaseModel):
    amount:  float
    remarks: Optional[str] = None

class TapInRequest(BaseModel):
    card_id:    int
    station_id: int

class TapOutRequest(BaseModel):
    trip_id:         int
    exit_station_id: int

class Trip(BaseModel):
    id:               int
    card_id:          int
    card_number:      Optional[str]      = None
    user_name:        Optional[str]      = None
    entry_station_id: int
    entry_station:    Optional[str]      = None
    exit_station_id:  Optional[int]      = None
    exit_station:     Optional[str]      = None
    entry_time:       datetime
    exit_time:        Optional[datetime] = None
    fare_deducted:    Optional[float]    = None
    status:           str
    class Config:
        orm_mode = True

class MachineCreate(BaseModel):
    station_id: int
    code:       str
    status:     str = "ONLINE"

class MachineUpdate(BaseModel):
    station_id: int
    code:       str
    status:     str

class Machine(BaseModel):
    id:           int
    station_id:   int
    station_name: Optional[str] = None
    code:         str
    status:       str
    class Config:
        orm_mode = True

class TicketRequest(BaseModel):
    machine_id:      int
    from_station_id: int
    to_station_id:   int

class Ticket(BaseModel):
    id:              Optional[int]      = None
    code:            str
    fare_paid:       float
    issued_at:       Optional[datetime] = None
    valid_until:     Optional[datetime] = None
    status:          str
    from_station_id: int
    to_station_id:   int
    from_name:       Optional[str]      = None
    to_name:         Optional[str]      = None
    machine_id:      int
    class Config:
        orm_mode = True