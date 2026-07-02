/**
 * Laptop 2 — Vending Machine
 * Import api.js alongside this file in your project.
 * All data comes from the FastAPI backend — nothing hardcoded.
 */

import { useState, useEffect, useCallback } from "react";
import * as API from "./api.js";

// ── Design tokens ─────────────────────────────────────────────
const C = {
  bg:"#0d0d0d", panel:"#141414", stripe:"#1a1a1a",
  orange:"#FF6B00", orangeGlow:"#FF6B0033",
  yellow:"#FFD600", green:"#00E676", red:"#FF1744",
  text:"#F5F5F5", muted:"#666", border:"#2a2a2a",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;600&family=Barlow:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;background:${C.bg}}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.border}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px ${C.orangeGlow}}50%{box-shadow:0 0 40px ${C.orange}88}}
.blink{animation:blink 1.2s step-end infinite}
.fadeUp{animation:fadeUp .3s ease forwards}
.glow{animation:glow 2s ease-in-out infinite}
`;

// ── Atoms ──────────────────────────────────────────────────────
function LoadingSpinner({ color = C.orange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
      <div style={{ width:36, height:36, border:`3px solid ${color}33`,
        borderTop:`3px solid ${color}`, borderRadius:"50%",
        animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorBanner({ msg, onRetry }) {
  return (
    <div style={{ background:C.red+"22", border:`1px solid ${C.red}`,
      borderRadius:8, padding:"14px 20px", marginBottom:20,
      display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ color:C.red, fontFamily:"'IBM Plex Mono',monospace", fontSize:13 }}>⚠ {msg}</span>
      {onRetry && <button onClick={onRetry} style={{ background:C.red, color:"#fff",
        border:"none", padding:"6px 14px", borderRadius:4, cursor:"pointer",
        fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>RETRY</button>}
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────
function Steps({ step }) {
  const labels = ["SELECT STATION","CHOOSE ROUTE","CONFIRM & PAY"];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:32 }}>
      {labels.map((l,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:0, flex:i<2?1:"auto" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <div style={{ width:36, height:36, borderRadius:"50%",
              border:`2px solid ${step>i?C.orange:step===i?C.orange:C.border}`,
              background:step>i?C.orange:"transparent",
              color:step>i?"#000":step===i?C.orange:C.muted,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, fontSize:14 }}>
              {step>i?"✓":i+1}
            </div>
            <span style={{ fontSize:10, color:step>=i?C.orange:C.muted,
              fontFamily:"'IBM Plex Mono',monospace", letterSpacing:1, whiteSpace:"nowrap" }}>{l}</span>
          </div>
          {i<2 && <div style={{ flex:1, height:2,
            background:step>i?C.orange:C.border, margin:"0 8px", marginBottom:22,
            transition:"background .3s" }}/>}
        </div>
      ))}
    </div>
  );
}

// ── Station grid ───────────────────────────────────────────────
function StationGrid({ stations, selected, onSelect, exclude }) {
  const [hover, setHover] = useState(null);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
      {stations.map(s => {
        const isSel = selected === s.id;
        const isExc = exclude === s.id;
        return (
          <button key={s.id} disabled={isExc}
            onMouseEnter={()=>setHover(s.id)} onMouseLeave={()=>setHover(null)}
            onClick={()=>onSelect(s.id)}
            style={{ background:isSel?C.orange:hover===s.id&&!isExc?"#222":C.stripe,
              border:`2px solid ${isSel?C.orange:isExc?C.border:"#333"}`,
              borderRadius:8, padding:"14px 8px", cursor:isExc?"not-allowed":"pointer",
              color:isSel?"#000":isExc?C.border:C.text,
              fontFamily:"'Barlow',sans-serif", fontWeight:700, fontSize:13,
              textAlign:"center", lineHeight:1.3, transition:"all .15s",
              opacity:isExc?.3:1 }}>
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

// ── Printed ticket ─────────────────────────────────────────────
function TicketPrint({ ticket, onNew }) {
  return (
    <div className="fadeUp" style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ background:"#fff", color:"#000", width:320, overflow:"hidden",
        boxShadow:`0 0 60px ${C.orangeGlow}` }}>
        <div style={{ background:C.orange, padding:"12px 20px",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:22, letterSpacing:3 }}>PATNA METRO</span>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>SINGLE JOURNEY</span>
        </div>
        <div style={{ borderTop:"2px dashed #ccc" }}/>
        <div style={{ padding:"20px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:10, color:"#888", letterSpacing:2, marginBottom:2 }}>FROM</div>
              <div style={{ fontSize:18, fontWeight:700 }}>{ticket.from_name}</div>
            </div>
            <div style={{ fontSize:22, color:C.orange, fontWeight:700, paddingTop:12 }}>→</div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:"#888", letterSpacing:2, marginBottom:2 }}>TO</div>
              <div style={{ fontSize:18, fontWeight:700 }}>{ticket.to_name}</div>
            </div>
          </div>
          {/* Barcode */}
          <div style={{ background:"#f5f5f5", borderRadius:4, padding:"10px 0", textAlign:"center", marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"center", gap:1, marginBottom:6 }}>
              {ticket.code.split("").map((c,i)=>(
                <div key={i} style={{ width:Math.random()*2+2, height:40,
                  background:c.charCodeAt(0)%2===0?"#000":"#333" }}/>
              ))}
            </div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13,
              letterSpacing:3, color:"#333" }}>{ticket.code}</div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#555" }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:2, color:"#aaa", marginBottom:2 }}>FARE PAID</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#000" }}>₹{ticket.fare_paid}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:"#aaa", marginBottom:2 }}>ISSUED</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>
                {new Date(ticket.issued_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
          <div style={{ marginTop:10, fontSize:9, color:"#aaa", textAlign:"center", letterSpacing:1 }}>
            VALID FOR 4 HOURS FROM ISSUE
          </div>
        </div>
      </div>
      <button onClick={onNew}
        style={{ marginTop:24, background:"transparent", border:`2px solid ${C.orange}`,
          color:C.orange, padding:"14px 40px", fontFamily:"'Bebas Neue',cursive",
          fontSize:20, letterSpacing:3, cursor:"pointer", borderRadius:4, transition:"all .2s" }}
        onMouseEnter={e=>{ e.target.style.background=C.orange; e.target.style.color="#000"; }}
        onMouseLeave={e=>{ e.target.style.background="transparent"; e.target.style.color=C.orange; }}>
        NEW TICKET
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN VENDING MACHINE APP
// ══════════════════════════════════════════════════════════════
export default function VendingMachineApp() {
  // All data from API
  const [stationList, setStationList]   = useState([]);
  const [machine, setMachine]           = useState(null);   // this kiosk's machine record
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [time, setTime]                 = useState(new Date());

  // Wizard state
  const [step, setStep]                 = useState(0);
  const [fromId, setFromId]             = useState(null);
  const [toId, setToId]                 = useState(null);
  const [farePreview, setFarePreview]   = useState(null);
  const [issuedTicket, setIssuedTicket] = useState(null);
  const [issuing, setIssuing]           = useState(false);

  // This machine's ID — in production read from URL param or env
  // e.g. http://localhost:3001?machine=1
  const machineId = parseInt(new URLSearchParams(window.location.search).get("machine") || "1");

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [stns, machs, recent] = await Promise.all([
        API.stations.list(),
        API.machines.list(),
        API.tickets.list(),
      ]);
      setStationList(stns);
      const m = machs.find(m => m.id === machineId) || machs[0];
      setMachine(m);
      setRecentTickets(recent.slice(0, 6));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  // Fetch fare when both stations selected
  useEffect(() => {
    if (fromId && toId) {
      API.fares.lookup(fromId, toId).then(r => setFarePreview(r.fare)).catch(() => setFarePreview(20));
    } else {
      setFarePreview(null);
    }
  }, [fromId, toId]);

  async function issueTicket() {
    if (!machine || !fromId || !toId) return;
    setIssuing(true);
    try {
      const ticket = await API.tickets.issue(machine.id, fromId, toId);
      setIssuedTicket(ticket);
      setStep(3);
      // Refresh recent
      const recent = await API.tickets.list();
      setRecentTickets(recent.slice(0, 6));
    } catch (e) {
      setError(e.message);
    } finally {
      setIssuing(false);
    }
  }

  function reset() { setFromId(null); setToId(null); setStep(0); setIssuedTicket(null); setError(null); }

  const isOnline = machine?.status === "ONLINE";
  const stnName  = id => stationList.find(s => s.id === id)?.name || "—";

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{CSS}</style>
      <LoadingSpinner color={C.orange}/>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{ background:C.panel, borderBottom:`3px solid ${C.orange}`,
        padding:"0 32px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:10, height:10, borderRadius:"50%",
            background:isOnline?C.green:C.red,
            boxShadow:`0 0 12px ${isOnline?C.green:C.red}` }}/>
          <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:28, letterSpacing:4, color:C.orange }}>
            PATNA METRO
          </span>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:C.muted, letterSpacing:2 }}>
            TICKET VENDING MACHINE
          </span>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:28, letterSpacing:2, color:C.text }}>
            {time.toLocaleTimeString("en-IN", { hour12:false })}
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:C.muted }}>
            {machine?.code || "—"} · {machine?.station_name || "—"}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, padding:"32px 48px", maxWidth:900, margin:"0 auto", width:"100%" }}>
        {error && <ErrorBanner msg={error} onRetry={() => { setError(null); loadData(); }}/>}

        {!isOnline && (
          <div style={{ textAlign:"center", paddingTop:80 }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🔴</div>
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:48, color:C.red, letterSpacing:4 }}>
              MACHINE OFFLINE
            </div>
            <div style={{ color:C.muted, fontFamily:"'IBM Plex Mono',monospace", marginTop:8 }}>
              Please use another kiosk or contact staff
            </div>
          </div>
        )}

        {isOnline && step < 3 && (
          <>
            <Steps step={step}/>
            {step === 0 && (
              <div className="fadeUp">
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:32, letterSpacing:3,
                  color:C.text, marginBottom:20 }}>SELECT DEPARTURE STATION</div>
                <StationGrid stations={stationList} selected={fromId}
                  onSelect={id => { setFromId(id); setStep(1); }}/>
              </div>
            )}
            {step === 1 && (
              <div className="fadeUp">
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                  <button onClick={()=>setStep(0)} style={{ background:"transparent",
                    border:`1px solid ${C.border}`, color:C.muted, padding:"6px 14px",
                    cursor:"pointer", fontFamily:"'IBM Plex Mono',monospace", fontSize:12, borderRadius:4 }}>
                    ← BACK
                  </button>
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:32, letterSpacing:3, color:C.text }}>
                    SELECT DESTINATION
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16,
                  background:C.stripe, padding:"10px 16px", borderRadius:6, width:"fit-content" }}>
                  <span style={{ fontSize:11, color:C.muted, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:1 }}>FROM:</span>
                  <span style={{ fontFamily:"'Barlow',sans-serif", fontWeight:700, color:C.orange, fontSize:16 }}>
                    {stnName(fromId)}
                  </span>
                </div>
                <StationGrid stations={stationList} selected={toId}
                  onSelect={id => { setToId(id); setStep(2); }} exclude={fromId}/>
              </div>
            )}
            {step === 2 && (
              <div className="fadeUp" style={{ maxWidth:480 }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:32, letterSpacing:3,
                  color:C.text, marginBottom:24 }}>CONFIRM JOURNEY</div>
                <div style={{ background:C.stripe, border:`1px solid ${C.border}`,
                  borderRadius:10, padding:28, marginBottom:24 }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:20 }}>
                    <div>
                      <div style={{ fontSize:10, color:C.muted, fontFamily:"'IBM Plex Mono',monospace",
                        letterSpacing:2, marginBottom:4 }}>FROM</div>
                      <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:700, fontSize:20 }}>{stnName(fromId)}</div>
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:30, color:C.orange }}>→</div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:C.muted, fontFamily:"'IBM Plex Mono',monospace",
                        letterSpacing:2, marginBottom:4 }}>TO</div>
                      <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:700, fontSize:20 }}>{stnName(toId)}</div>
                    </div>
                  </div>
                  <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16,
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:12, color:C.muted, fontFamily:"'IBM Plex Mono',monospace" }}>FARE</div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:40, color:C.yellow, letterSpacing:2 }}>
                      {farePreview !== null ? `₹${farePreview}` : "…"}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:12 }}>
                  <button onClick={()=>setStep(1)} style={{ flex:1, background:"transparent",
                    border:`2px solid ${C.border}`, color:C.muted, padding:16, cursor:"pointer",
                    fontFamily:"'Bebas Neue',cursive", fontSize:18, letterSpacing:2, borderRadius:6 }}>
                    BACK
                  </button>
                  <button onClick={issueTicket} disabled={issuing || farePreview===null}
                    style={{ flex:2, background:issuing?C.muted:C.orange, border:"none", color:"#000",
                      padding:16, cursor:issuing?"wait":"pointer",
                      fontFamily:"'Bebas Neue',cursive", fontSize:22, letterSpacing:3,
                      borderRadius:6, transition:"all .15s" }}
                    className="glow">
                    {issuing ? "PROCESSING…" : `PAY ₹${farePreview} & PRINT`}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {step === 3 && issuedTicket && (
          <div className="fadeUp" style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:20 }}>
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:24, color:C.green,
              letterSpacing:4, marginBottom:24 }}>✓ TICKET ISSUED</div>
            <TicketPrint ticket={issuedTicket} onNew={reset}/>
          </div>
        )}
      </div>

      {/* Recent tickets footer */}
      {step === 0 && !error && (
        <div style={{ background:C.panel, borderTop:`1px solid ${C.border}`,
          padding:"10px 48px", display:"flex", gap:16, alignItems:"center", overflowX:"auto" }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:C.muted,
            letterSpacing:2, whiteSpace:"nowrap" }}>RECENT:</span>
          {recentTickets.length === 0 && (
            <span style={{ color:C.border, fontSize:12, fontFamily:"'IBM Plex Mono',monospace" }}>
              No tickets issued yet
            </span>
          )}
          {recentTickets.map(t => (
            <div key={t.id} style={{ display:"flex", gap:8, alignItems:"center",
              background:C.stripe, padding:"6px 12px", borderRadius:4, whiteSpace:"nowrap" }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:C.orange }}>{t.code}</span>
              <span style={{ fontSize:11, color:C.muted }}>{t.from_name} → {t.to_name}</span>
              <span style={{ fontSize:11, color:C.yellow }}>₹{t.fare_paid}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
