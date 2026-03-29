/**
 * api.js — Patna Metro shared API client
 * Place this file in src/ of each laptop's React app.
 * Change BASE_URL to the backend laptop's IP when running across multiple machines.
 */

export const BASE_URL = "http://localhost:8000"; // change to backend IP for multi-laptop

async function req(method, path, body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const e = await res.json(); detail = e.detail || JSON.stringify(e); } catch (_) {}
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

const get  = (path)       => req("GET",    path);
const post = (path, body) => req("POST",   path, body);
const put  = (path, body) => req("PUT",    path, body);
const del  = (path)       => req("DELETE", path);

function qs(params = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== null && v !== undefined && v !== "") p.append(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const stations  = {
  list:   ()         => get("/stations"),
  create: (b)        => post("/stations", b),
  update: (id, b)    => put(`/stations/${id}`, b),
  delete: (id)       => del(`/stations/${id}`),
};

export const lines = {
  list:   ()         => get("/liness"),
  create: (b)        => post("/liness", b),
  update: (id, b)    => put(`/liness/${id}`, b),
  delete: (id)       => del(`/liness/${id}`),
};

export const fares = {
  list:   ()                 => get("/fares"),
  upsert: (b)               => post("/fares", b),
  delete: (fId, tId)        => del(`/fares/${fId}/${tId}`),
  lookup: (fId, tId)        => get(`/fares/lookup?from_station_id=${fId}&to_station_id=${tId}`),
};

export const users = {
  list:   ()              => get("/users"),
  create: (b)             => post("/users", b),
  update: (id, b)         => put(`/users/${id}`, b),
  delete: (id)            => del(`/users/${id}`),
  login:  (email, pin)    => post("/users/login", { email, pin }),
};

export const cards = {
  list:     ()             => get("/cards"),
  byUser:   (uid)          => get(`/cards/user/${uid}`),
  create:   (b)            => post("/cards", b),
  update:   (id, b)        => put(`/cards/${id}`, b),
  delete:   (id)           => del(`/cards/${id}`),
  recharge: (id, amount, remarks = "") => post(`/cards/${id}/recharge`, { amount, remarks }),
};

export const trips = {
  tapIn:        (cardId, stationId)    => post("/trips/tap-in",  { card_id: cardId, station_id: stationId }),
  tapOut:       (tripId, exitStation)  => post("/trips/tap-out", { trip_id: tripId, exit_station_id: exitStation }),
  list:         (f = {})               => get(`/trips${qs(f)}`),
  activeForCard:(cardId)               => get(`/trips/active-for-card/${cardId}`),
};

export const machines = {
  list:   ()      => get("/machines"),
  create: (b)     => post("/machines", b),
  update: (id, b) => put(`/machines/${id}`, b),
  delete: (id)    => del(`/machines/${id}`),
};

export const tickets = {
  issue: (machineId, fromId, toId) => post("/tickets", { machine_id: machineId, from_station_id: fromId, to_station_id: toId }),
  list:  (f = {})                  => get(`/tickets${qs(f)}`),
};

export const recharges = {
  list: (f = {}) => get(`/recharges${qs(f)}`),
};

export const audit = {
  list:      (f = {}) => get(`/audit${qs(f)}`),
  deleteAll: ()       => del("/audit"),
  deleteOne: (id)     => del(`/audit/${id}`),
};

export const analytics = {
  revenueSummary: (df, dt) => get(`/analytics/revenue-summary${qs({ date_from: df, date_to: dt })}`),
  dailyRevenue:   (df, dt) => get(`/analytics/daily-revenue${qs({ date_from: df, date_to: dt })}`),
  stationRevenue: (df, dt) => get(`/analytics/station-revenue${qs({ date_from: df, date_to: dt })}`),
};