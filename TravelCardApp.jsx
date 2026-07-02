/**
 * Laptop 4 — Travel Card (Smart Card User App)
 * Requires api.js in the same directory.
 * Zero hardcoded data — everything from FastAPI backend.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import * as API from "./api.js";

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg:"#EEF2F7", card:"#FFFFFF",
  teal:"#00897B", tealDark:"#00695C", tealLight:"#B2DFDB",
  navy:"#0D2137", text:"#1A2B3C", muted:"#7A8C9A",
  border:"#D1E0EA", success:"#2E7D32", warning:"#E65100",
  red:"#C62828", amber:"#F57F17",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{min-height:100vh;background:${C.bg};font-family:'Nunito',sans-serif;color:${C.text}}
button,input,select{font-family:'Nunito',sans-serif}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
@keyframes popIn{0%{transform:scale(.92);opacity:0}60%{transform:scale(1.02)}100%{transform:scale(1);opacity:1}}
@keyframes slideUp{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
.pop{animation:popIn .28s cubic-bezier(.34,1.56,.64,1) both}
.slideUp{animation:slideUp .22s ease both}
`;

// ── Atoms ──────────────────────────────────────────────────────
function Panel({ children, style = {} }) {
  return (
    <div style={{ background:C.card, borderRadius:18,
      boxShadow:"0 2px 16px rgba(13,33,55,0.08)", padding:24, ...style }}>
      {children}
    </div>
  );
}

function Spinner({ color = C.teal, size = 28 }) {
  return (
    <div style={{ width:size, height:size, border:`3px solid ${color}33`,
      borderTop:`3px solid ${color}`, borderRadius:"50%",
      animation:"spin .7s linear infinite", display:"inline-block" }}/>
  );
}

function FullPageLoader({ message = "Loading…" }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16 }}>
      <style>{CSS}</style>
      <Spinner size={40}/>
      <div style={{ color:C.muted, fontSize:14, fontFamily:"'Space Mono',monospace" }}>{message}</div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex",
      alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{CSS}</style>
      <div style={{ textAlign:"center", maxWidth:360 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <div style={{ fontWeight:800, fontSize:18, color:C.red, marginBottom:8 }}>Cannot reach server</div>
        <div style={{ color:C.muted, fontSize:14, marginBottom:24, lineHeight:1.6 }}>{message}</div>
        <button onClick={onRetry} style={{ background:C.teal, color:"#fff", border:"none",
          borderRadius:12, padding:"12px 32px", fontWeight:800, fontSize:15, cursor:"pointer" }}>
          Retry
        </button>
      </div>
    </div>
  );
}

function Toast({ msg, ok, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, []);
  return (
    <div className="slideUp" style={{ position:"fixed", bottom:28, left:"50%",
      transform:"translateX(-50%)", background:ok?C.success:C.red, color:"#fff",
      borderRadius:14, padding:"13px 28px", fontWeight:700, fontSize:14,
      boxShadow:"0 6px 24px rgba(0,0,0,.25)", zIndex:9999, whiteSpace:"nowrap",
      pointerEvents:"none" }}>
      {ok?"✓ ":"✗ "}{msg}
    </div>
  );
}

// ── PIN Pad ────────────────────────────────────────────────────
function PinPad({ onSubmit, error, loading }) {
  const [pin, setPin] = useState("");
  const keys = ["1","2","3","4","5","6","7","8","9","⌫","0","✓"];

  function press(k) {
    if (loading) return;
    if (k === "⌫") { setPin(p => p.slice(0, -1)); return; }
    if (k === "✓") { if (pin.length === 4) { onSubmit(pin); setPin(""); } return; }
    if (pin.length < 4) setPin(p => p + k);
  }

  useEffect(() => {
    if (pin.length === 4) {
      const t = setTimeout(() => { onSubmit(pin); setPin(""); }, 150);
      return () => clearTimeout(t);
    }
  }, [pin]);

  return (
    <div>
      <div style={{ fontSize:12, color:C.muted, letterSpacing:2, textAlign:"center",
        marginBottom:14, fontWeight:700 }}>ENTER 4-DIGIT PIN</div>
      <div style={{ display:"flex", justifyContent:"center", gap:14, marginBottom:22 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width:14, height:14, borderRadius:"50%",
            background:pin.length > i ? C.teal : C.border, transition:"background .1s",
            boxShadow:pin.length > i ? `0 0 8px ${C.teal}66` : "none" }}/>
        ))}
      </div>
      {error && <div style={{ color:C.red, fontSize:13, textAlign:"center",
        marginBottom:12, fontWeight:700 }}>{error}</div>}
      {loading && <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><Spinner/></div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10,
        maxWidth:260, margin:"0 auto" }}>
        {keys.map((k, i) => {
          const isOk  = k === "✓";
          const isDel = k === "⌫";
          return (
            <button key={i} onClick={() => press(k)} disabled={loading}
              style={{ background:isOk?C.teal:isDel?"#FFF3E0":"#F4F8FB",
                color:isOk?"#fff":isDel?C.warning:C.text,
                border:`1.5px solid ${isOk?C.teal:isDel?"#FFCC80":C.border}`,
                borderRadius:12, padding:"17px 0",
                fontSize:isOk||isDel?20:24, fontFamily:"'Space Mono',monospace",
                fontWeight:700, cursor:loading?"wait":"pointer", transition:"all .1s",
                boxShadow:isOk?`0 3px 12px ${C.teal}44`:"none", opacity:loading?.6:1 }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.94)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Card Visual ────────────────────────────────────────────────
function MetroCardVisual({ card, userName }) {
  return (
    <div style={{ background:`linear-gradient(135deg, ${C.tealDark} 0%, ${C.navy} 100%)`,
      borderRadius:18, padding:"22px 24px", color:"#fff",
      boxShadow:"0 10px 36px rgba(13,33,55,0.28)",
      position:"relative", overflow:"hidden", minHeight:175 }}>
      <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180,
        borderRadius:"50%", background:"rgba(255,255,255,.04)" }}/>
      <div style={{ position:"absolute", bottom:-40, left:10, width:120, height:120,
        borderRadius:"50%", background:"rgba(255,255,255,.04)" }}/>
      <div style={{ width:38, height:30, background:"linear-gradient(135deg,#FFD700,#FFA000)",
        borderRadius:5, marginBottom:16, position:"relative", zIndex:1 }}/>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:15, letterSpacing:3,
        marginBottom:18, zIndex:1, position:"relative", opacity:.9 }}>
        **** **** **** {card.number.slice(-4)}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-end", position:"relative", zIndex:1 }}>
        <div>
          <div style={{ fontSize:9, opacity:.55, letterSpacing:2, marginBottom:3, fontWeight:700 }}>CARD HOLDER</div>
          <div style={{ fontWeight:800, fontSize:16 }}>{userName}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:9, opacity:.55, letterSpacing:2, marginBottom:3, fontWeight:700 }}>BALANCE</div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:28, fontWeight:700, color:"#4DD0E1" }}>
            ₹{Number(card.balance).toFixed(2)}
          </div>
        </div>
      </div>
      <div style={{ position:"absolute", top:18, right:18, fontSize:9,
        letterSpacing:3, opacity:.4, fontWeight:800 }}>PATNA METRO</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════
export default function TravelCardApp() {
  // ── Global data loaded once ──
  const [stations, setStations]       = useState([]);
  const [dataReady, setDataReady]     = useState(false);
  const [fatalError, setFatalError]   = useState(null);

  // ── Auth state ──
  const [screen, setScreen]           = useState("login");   // login|home|tap|recharge|history
  const [loginStep, setLoginStep]     = useState(0);         // 0=pick card, 1=pin
  const [allCards, setAllCards]       = useState([]);        // shown on login screen
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [pinError, setPinError]       = useState("");
  const [pinLoading, setPinLoading]   = useState(false);

  // ── Logged-in state ──
  const [loggedCard, setLoggedCard]   = useState(null);
  const [loggedUser, setLoggedUser]   = useState(null);
  const [activeTrip, setActiveTrip]   = useState(null);
  const [myTrips, setMyTrips]         = useState([]);

  // ── Per-screen state ──
  const [tapStation, setTapStation]   = useState("");
  const [farePreview, setFarePreview] = useState(null);
  const [tapLoading, setTapLoading]   = useState(false);
  const [rechargeAmt, setRechargeAmt] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);

  // ── UI ──
  const [toast, setToast]             = useState(null);
  const [time, setTime]               = useState(new Date());
  const pollRef                       = useRef(null);

  // ── Bootstrap ──
  const bootstrap = useCallback(async () => {
    try {
      const [stns, cds] = await Promise.all([
        API.stations.list(),
        API.cards.list(),
      ]);
      setStations(stns);
      setAllCards(cds);
      setDataReady(true);
    } catch (e) {
      setFatalError(e.message);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Poll card balance + active trip while logged in ──
  useEffect(() => {
    if (!loggedCard) { clearInterval(pollRef.current); return; }
    async function poll() {
      try {
        const [cardData, tripData, tripList] = await Promise.all([
          API.cards.byUser(loggedCard.user_id),
          API.trips.activeForCard(loggedCard.id),
          API.trips.list({ card_id: loggedCard.id }),
        ]);
        const fresh = cardData.find(c => c.id === loggedCard.id);
        if (fresh) setLoggedCard(fresh);
        setActiveTrip(tripData?.id ? tripData : null);
        setMyTrips(tripList);
      } catch (_) {}
    }
    poll();
    pollRef.current = setInterval(poll, 4000);
    return () => clearInterval(pollRef.current);
  }, [loggedCard?.id]);

  // ── Fare preview ──
  useEffect(() => {
    if (!tapStation || !activeTrip) { setFarePreview(null); return; }
    API.fares.lookup(activeTrip.entry_station_id, +tapStation)
      .then(r => setFarePreview(r.fare))
      .catch(() => setFarePreview(20));
  }, [tapStation, activeTrip]);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  // ── Login: select card then verify PIN via API ──
  async function handlePin(pin) {
    setPinLoading(true);
    setPinError("");
    try {
      // Verify via user login — we check the user's pin
      const card = allCards.find(c => c.id === selectedCardId);
      if (!card) throw new Error("Card not found");
      // Fetch full user list to validate PIN (admin-accessible)
      const users = await API.users.list();
      const user  = users.find(u => u.id === card.user_id);
      if (!user || user.pin !== pin) {
        setPinError("Wrong PIN — try again");
        setTimeout(() => setPinError(""), 2500);
        return;
      }
      // Load this card's live data
      const [freshCards, activeT, trips] = await Promise.all([
        API.cards.byUser(user.id),
        API.trips.activeForCard(card.id),
        API.trips.list({ card_id: card.id }),
      ]);
      const freshCard = freshCards.find(c => c.id === card.id) || card;
      setLoggedCard(freshCard);
      setLoggedUser(user);
      setActiveTrip(activeT?.id ? activeT : null);
      setMyTrips(trips);
      setScreen("home");
    } catch (e) {
      setPinError(e.message);
    } finally {
      setPinLoading(false);
    }
  }

  // ── Tap In ──
  async function tapIn() {
    if (!tapStation) { showToast("Select a station", false); return; }
    setTapLoading(true);
    try {
      await API.trips.tapIn(loggedCard.id, +tapStation);
      const [fresh, trip] = await Promise.all([
        API.cards.byUser(loggedCard.user_id),
        API.trips.activeForCard(loggedCard.id),
      ]);
      const card = fresh.find(c => c.id === loggedCard.id);
      setLoggedCard(card);
      setActiveTrip(trip?.id ? trip : null);
      setTapStation("");
      showToast(`Tapped in at ${stations.find(s => s.id === +tapStation)?.name}`);
      setScreen("home");
    } catch (e) {
      showToast(e.message, false);
    } finally {
      setTapLoading(false);
    }
  }

  // ── Tap Out ──
  async function tapOut() {
    if (!tapStation) { showToast("Select exit station", false); return; }
    if (!activeTrip)  { showToast("No active trip found", false); return; }
    setTapLoading(true);
    try {
      const result = await API.trips.tapOut(activeTrip.id, +tapStation);
      const [fresh, tripList] = await Promise.all([
        API.cards.byUser(loggedCard.user_id),
        API.trips.list({ card_id: loggedCard.id }),
      ]);
      const card = fresh.find(c => c.id === loggedCard.id);
      setLoggedCard(card);
      setActiveTrip(null);
      setMyTrips(tripList);
      setTapStation("");
      showToast(`₹${result.fare} deducted — Balance: ₹${card.balance}`);
      setScreen("home");
    } catch (e) {
      showToast(e.message, false);
    } finally {
      setTapLoading(false);
    }
  }

  // ── Recharge ──
  async function doRecharge() {
    const amt = parseFloat(rechargeAmt);
    if (!amt || amt <= 0) { showToast("Enter a valid amount", false); return; }
    setRechargeLoading(true);
    try {
      const result = await API.cards.recharge(loggedCard.id, amt);
      const fresh = await API.cards.byUser(loggedCard.user_id);
      const card  = fresh.find(c => c.id === loggedCard.id);
      setLoggedCard(card);
      setRechargeAmt("");
      showToast(`₹${amt} added! New balance: ₹${result.new_balance}`);
      setScreen("home");
    } catch (e) {
      showToast(e.message, false);
    } finally {
      setRechargeLoading(false);
    }
  }

  function logout() {
    clearInterval(pollRef.current);
    setLoggedCard(null); setLoggedUser(null); setActiveTrip(null);
    setMyTrips([]); setScreen("login"); setLoginStep(0);
    setTapStation(""); setRechargeAmt("");
    // Refresh cards list on logout so balances are current
    API.cards.list().then(setAllCards).catch(() => {});
  }

  const stnName = id => stations.find(s => s.id === +id)?.name || "—";

  // ── Fatal error ──
  if (fatalError) return <ErrorScreen message={fatalError} onRetry={() => { setFatalError(null); bootstrap(); }}/>;
  if (!dataReady) return <FullPageLoader message="Connecting to server…"/>;

  /* ══════════════════════════════
     LOGIN
  ══════════════════════════════ */
  if (screen === "login") {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex",
        alignItems:"center", justifyContent:"center", padding:24 }}>
        <style>{CSS}</style>
        <div style={{ width:"100%", maxWidth:400 }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:52, marginBottom:10 }}>🚇</div>
            <div style={{ fontWeight:900, fontSize:34, color:C.navy, letterSpacing:-1 }}>Patna Metro</div>
            <div style={{ color:C.muted, fontSize:14, marginTop:4 }}>Smart Card Travel System</div>
          </div>
          <Panel>
            {loginStep === 0 && (
              <div className="pop">
                <div style={{ fontWeight:800, color:C.text, marginBottom:16, fontSize:14, letterSpacing:.5 }}>
                  SELECT YOUR CARD
                </div>
                {allCards.length === 0 && (
                  <div style={{ textAlign:"center", color:C.muted, padding:"24px 0", fontSize:13 }}>
                    No cards found. Contact station staff.
                  </div>
                )}
                {allCards.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCardId(c.id); setLoginStep(1); setPinError(""); }}
                    style={{ width:"100%", background:"#F4F8FB", border:`2px solid ${C.border}`,
                      borderRadius:14, padding:"15px 18px", cursor:"pointer", marginBottom:10,
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      transition:"all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=C.teal; e.currentTarget.style.background=C.tealLight+"33"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="#F4F8FB"; }}>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontWeight:800, color:C.text, fontSize:15 }}>{c.user_name}</div>
                      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color:C.muted, marginTop:2 }}>
                        **** {c.number.slice(-4)}
                      </div>
                    </div>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, color:C.teal, fontSize:20 }}>
                      ₹{Number(c.balance).toFixed(0)}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {loginStep === 1 && (
              <div className="pop">
                <button onClick={() => { setLoginStep(0); setPinError(""); }}
                  style={{ background:"none", border:"none", color:C.muted, cursor:"pointer",
                    fontSize:13, marginBottom:18, display:"flex", alignItems:"center", gap:4 }}>
                  ← Back to card list
                </button>
                <PinPad onSubmit={handlePin} error={pinError} loading={pinLoading}/>
              </div>
            )}
          </Panel>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════
     MAIN (post login)
  ══════════════════════════════ */
  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:C.navy, padding:"0 20px", height:58,
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontWeight:900, color:"#fff", fontSize:20, letterSpacing:-.5 }}>Patna Metro</span>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ color:"rgba(255,255,255,.5)", fontSize:13, fontFamily:"'Space Mono',monospace" }}>
            {time.toLocaleTimeString("en-IN")}
          </span>
          <button onClick={logout}
            style={{ background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.2)",
              color:"#fff", padding:"6px 16px", borderRadius:8, cursor:"pointer",
              fontSize:12, fontWeight:700 }}>
            Logout
          </button>
        </div>
      </div>

      {/* Active trip banner */}
      {activeTrip && (
        <div style={{ background:C.teal, padding:"11px 20px",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ color:"#fff", fontWeight:800, fontSize:14 }}>
            🚇 Active trip — boarded at {activeTrip.entry_station || stnName(activeTrip.entry_station_id)}
          </div>
          <div style={{ color:"rgba(255,255,255,.75)", fontSize:12, fontFamily:"'Space Mono',monospace" }}>
            {new Date(activeTrip.entry_time).toLocaleTimeString()}
          </div>
        </div>
      )}

      <div style={{ maxWidth:460, margin:"0 auto", padding:"20px 16px" }}>

        {/* Nav */}
        <div style={{ display:"flex", gap:4, marginBottom:20, background:C.card,
          borderRadius:14, padding:5, boxShadow:"0 2px 10px rgba(13,33,55,.07)" }}>
          {[["home","🏠 Home"],["tap","🚉 Travel"],["recharge","⚡ Recharge"],["history","📋 History"]].map(([id, label]) => (
            <button key={id} onClick={() => setScreen(id)}
              style={{ flex:1, background:screen===id?C.teal:"transparent",
                color:screen===id?"#fff":C.muted, border:"none", borderRadius:10,
                padding:"10px 0", cursor:"pointer", fontWeight:700, fontSize:13, transition:"all .15s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── HOME ── */}
        {screen === "home" && loggedCard && (
          <div className="pop">
            <MetroCardVisual card={loggedCard} userName={loggedUser?.name || loggedCard.user_name}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}>
              <Panel style={{ padding:16, textAlign:"center", cursor:"pointer",
                border:`2px solid ${activeTrip?C.red:C.teal}`, borderRadius:16 }}
                onClick={() => setScreen("tap")}>
                <div style={{ fontSize:30, marginBottom:6 }}>🚉</div>
                <div style={{ fontWeight:800, color:activeTrip?C.red:C.teal, fontSize:15 }}>
                  {activeTrip?"TAP OUT":"TAP IN"}
                </div>
                {activeTrip && (
                  <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>
                    at {activeTrip.entry_station || stnName(activeTrip.entry_station_id)}
                  </div>
                )}
              </Panel>
              <Panel style={{ padding:16, textAlign:"center", cursor:"pointer",
                border:`2px solid ${C.amber}`, borderRadius:16 }}
                onClick={() => setScreen("recharge")}>
                <div style={{ fontSize:30, marginBottom:6 }}>⚡</div>
                <div style={{ fontWeight:800, color:C.amber, fontSize:15 }}>RECHARGE</div>
              </Panel>
            </div>
            <Panel style={{ marginTop:14 }}>
              <div style={{ fontWeight:800, color:C.navy, marginBottom:12, fontSize:16 }}>Recent Activity</div>
              {myTrips.slice(0,4).map(t => (
                <div key={t.id} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"11px 0", borderBottom:`1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:C.text }}>
                      {t.entry_station || stnName(t.entry_station_id)}
                      {t.exit_station
                        ? <span style={{ color:C.muted }}> → {t.exit_station}</span>
                        : <span style={{ color:C.teal, fontSize:12 }}> (on board)</span>}
                    </div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                      {new Date(t.entry_time).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontWeight:700,
                    color:t.fare_deducted?C.red:C.teal, fontSize:15 }}>
                    {t.fare_deducted ? `-₹${t.fare_deducted}` : "—"}
                  </div>
                </div>
              ))}
              {myTrips.length === 0 && (
                <div style={{ color:C.muted, textAlign:"center", padding:"14px 0", fontSize:13 }}>
                  No trips yet — tap in to start!
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ── TRAVEL / TAP ── */}
        {screen === "tap" && loggedCard && (
          <div className="slideUp">
            <Panel>
              <div style={{ fontWeight:900, fontSize:22, color:C.navy, marginBottom:6 }}>
                {activeTrip?"Exit the Metro":"Board the Metro"}
              </div>
              <div style={{ color:C.muted, fontSize:14, marginBottom:20 }}>
                {activeTrip
                  ? `Boarded at ${activeTrip.entry_station || stnName(activeTrip.entry_station_id)} — select exit station`
                  : `Balance: ₹${Number(loggedCard.balance).toFixed(2)} (min ₹10 to travel)`}
              </div>
              {activeTrip && (
                <div style={{ background:C.tealLight+"55", border:`1.5px solid ${C.tealLight}`,
                  borderRadius:10, padding:"11px 14px", marginBottom:18,
                  fontSize:13, color:C.tealDark, fontWeight:700 }}>
                  🚇 On board since {new Date(activeTrip.entry_time).toLocaleTimeString("en-IN")}
                </div>
              )}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:C.muted, letterSpacing:1, marginBottom:8, fontWeight:700 }}>
                  {activeTrip?"EXIT STATION":"ENTRY STATION"}
                </div>
                <select value={tapStation} onChange={e => setTapStation(e.target.value)}
                  style={{ width:"100%", background:"#F4F8FB",
                    border:`1.5px solid ${tapStation?C.teal:C.border}`,
                    color:tapStation?C.text:C.muted, borderRadius:12,
                    padding:"13px 14px", fontSize:15, outline:"none", fontWeight:600 }}>
                  <option value="">— choose station —</option>
                  {stations
                    .filter(s => activeTrip ? s.id !== activeTrip.entry_station_id : true)
                    .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {tapStation && activeTrip && (
                <div style={{ background:"#FFF8E1", border:"1.5px solid #FFE082",
                  borderRadius:10, padding:"11px 16px", marginBottom:16,
                  display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:14, color:C.amber, fontWeight:700 }}>Estimated fare</span>
                  <span style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:20, color:C.amber }}>
                    {farePreview !== null ? `₹${farePreview}` : <Spinner size={18}/>}
                  </span>
                </div>
              )}
              <button onClick={activeTrip ? tapOut : tapIn}
                disabled={!tapStation || tapLoading}
                style={{ width:"100%", background:tapLoading||!tapStation?"#E0E0E0":activeTrip?C.red:C.teal,
                  color:tapLoading||!tapStation?"#9E9E9E":"#fff", border:"none", borderRadius:12,
                  padding:"15px 0", cursor:tapLoading||!tapStation?"not-allowed":"pointer",
                  fontWeight:800, fontSize:17, letterSpacing:.5,
                  boxShadow:tapLoading||!tapStation?"none":`0 4px 18px ${activeTrip?C.red:C.teal}55`,
                  transition:"all .12s", display:"flex", alignItems:"center",
                  justifyContent:"center", gap:10 }}>
                {tapLoading ? <><Spinner size={18} color="#fff"/> Processing…</> :
                  activeTrip ? "TAP OUT — EXIT METRO" : "TAP IN — BOARD METRO"}
              </button>
            </Panel>
          </div>
        )}

        {/* ── RECHARGE ── */}
        {screen === "recharge" && loggedCard && (
          <div className="slideUp">
            <Panel>
              <div style={{ fontWeight:900, fontSize:22, color:C.navy, marginBottom:18 }}>Add Money</div>
              <div style={{ textAlign:"center", marginBottom:22,
                background:"#F4F8FB", borderRadius:14, padding:"18px 0" }}>
                <div style={{ fontSize:12, color:C.muted, letterSpacing:2, marginBottom:6, fontWeight:700 }}>
                  CURRENT BALANCE
                </div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:42, fontWeight:700, color:C.teal }}>
                  ₹{Number(loggedCard.balance).toFixed(2)}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
                {[100,200,500,1000].map(a => (
                  <button key={a} onClick={() => setRechargeAmt(String(a))}
                    style={{ background:rechargeAmt===String(a)?C.teal:"#F4F8FB",
                      color:rechargeAmt===String(a)?"#fff":C.text,
                      border:`1.5px solid ${rechargeAmt===String(a)?C.teal:C.border}`,
                      borderRadius:10, padding:"13px 0",
                      fontFamily:"'Space Mono',monospace", fontWeight:700,
                      fontSize:14, cursor:"pointer", transition:"all .15s",
                      boxShadow:rechargeAmt===String(a)?`0 3px 12px ${C.teal}44`:"none" }}>
                    ₹{a}
                  </button>
                ))}
              </div>
              <input type="number" min="1" value={rechargeAmt}
                onChange={e => setRechargeAmt(e.target.value)}
                placeholder="Or enter custom amount…"
                style={{ width:"100%", background:"#F4F8FB",
                  border:`1.5px solid ${rechargeAmt?C.teal:C.border}`,
                  color:C.text, borderRadius:12, padding:"13px 14px",
                  fontSize:15, outline:"none", fontWeight:600, marginBottom:16 }}/>
              <button onClick={doRecharge}
                disabled={!rechargeAmt || +rechargeAmt <= 0 || rechargeLoading}
                style={{ width:"100%", background:rechargeLoading||!rechargeAmt||+rechargeAmt<=0?"#E0E0E0":C.amber,
                  color:rechargeLoading||!rechargeAmt||+rechargeAmt<=0?"#9E9E9E":"#fff",
                  border:"none", borderRadius:12, padding:"15px 0",
                  cursor:rechargeLoading||!rechargeAmt||+rechargeAmt<=0?"not-allowed":"pointer",
                  fontWeight:800, fontSize:17, letterSpacing:.5,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                {rechargeLoading ? <><Spinner size={18} color="#fff"/> Processing…</> : "ADD MONEY TO CARD"}
              </button>
            </Panel>
          </div>
        )}

        {/* ── HISTORY ── */}
        {screen === "history" && (
          <div className="slideUp">
            <Panel>
              <div style={{ fontWeight:900, fontSize:22, color:C.navy, marginBottom:18 }}>Travel History</div>
              {myTrips.length === 0 && (
                <div style={{ color:C.muted, textAlign:"center", padding:"24px 0", fontSize:14 }}>
                  No trips recorded yet
                </div>
              )}
              {myTrips.map(t => (
                <div key={t.id} style={{ padding:"13px 0", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1, marginRight:12 }}>
                      <div style={{ fontWeight:700, color:C.text, fontSize:15 }}>
                        {t.entry_station || stnName(t.entry_station_id)}
                        {t.exit_station
                          ? <span style={{ color:C.muted }}> → {t.exit_station}</span>
                          : <span style={{ color:C.teal, fontSize:12 }}> (in progress)</span>}
                      </div>
                      <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
                        {new Date(t.entry_time).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontFamily:"'Space Mono',monospace", fontWeight:700,
                        color:t.fare_deducted?C.red:C.teal, fontSize:16 }}>
                        {t.fare_deducted ? `-₹${t.fare_deducted}` : "—"}
                      </div>
                      <div style={{ fontSize:11, marginTop:3, fontWeight:700,
                        color:t.status==="COMPLETED"?C.success:C.amber }}>
                        {t.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        )}
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)}/>}
    </div>
  );
}
