/**
 * Laptop 1 — Admin Dashboard
 * npm install recharts  (only this laptop needs it)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import * as API from "./api.js";

const C = {
  bg:"#060A0F", surface:"#0C1219", card:"#0F1A24", card2:"#132030",
  border:"#1C2D3F", borderHi:"#2A4060",
  green:"#00FF87", greenGlow:"#00FF8722", greenDim:"#00CC6A",
  blue:"#38BDF8", amber:"#FBBF24", red:"#F87171",
  purple:"#C084FC", teal:"#2DD4BF",
  text:"#E2EAF0", muted:"#4A6278", dim:"#243040",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;background:${C.bg};font-family:'DM Sans',sans-serif;color:${C.text};overflow:hidden}
input,select,button{font-family:'DM Sans',sans-serif}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.live{animation:pulse 1.8s ease-in-out infinite}
.fadeUp{animation:fadeUp .25s ease both}
input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.5) sepia(1) saturate(2) hue-rotate(80deg);cursor:pointer}
`;

const today   = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const daysAgo = n => { const d=new Date(); d.setDate(d.getDate()-n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

function SBox({ children, style={} }) {
  return <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, ...style }}>{children}</div>;
}
function SHead({ title, accent=C.green, children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:3, height:22, background:accent, borderRadius:2 }}/>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
function Badge({ label, color=C.green }) {
  return <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", letterSpacing:.5,
    color, background:color+"1A", border:`1px solid ${color}33`,
    borderRadius:4, padding:"2px 7px", fontWeight:600 }}>{label}</span>;
}
function LiveDot() {
  return <div className="live" style={{ width:7, height:7, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}` }}/>;
}
function Spinner({ color=C.green, size=22 }) {
  return <div style={{ width:size, height:size, border:`2px solid ${color}33`,
    borderTop:`2px solid ${color}`, borderRadius:"50%",
    animation:"spin .7s linear infinite", display:"inline-block" }}/>;
}
function Inp({ label, value, onChange, type="text", placeholder="", style={} }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <div style={{ fontSize:11, color:C.muted, letterSpacing:1, marginBottom:5, fontFamily:"'JetBrains Mono',monospace" }}>{label}</div>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"9px 12px", fontSize:13, outline:"none", ...style }}/>
    </div>
  );
}
function Sel({ label, value, onChange, options=[] }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <div style={{ fontSize:11, color:C.muted, letterSpacing:1, marginBottom:5, fontFamily:"'JetBrains Mono',monospace" }}>{label}</div>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"9px 12px", fontSize:13, outline:"none" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Btn({ children, onClick, color=C.green, sm=false, ghost=false, danger=false, disabled=false, loading=false }) {
  const col = danger ? C.red : color;
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled||loading}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:ghost?(h?col+"22":"transparent"):h?col:col+"DD",
        color:ghost?col:"#000", border:`1px solid ${col}`, borderRadius:7,
        padding:sm?"5px 12px":"9px 18px", cursor:disabled||loading?"not-allowed":"pointer",
        fontSize:sm?12:13, fontWeight:600, transition:"all .15s", opacity:disabled||loading?.5:1,
        letterSpacing:.3, display:"inline-flex", alignItems:"center", gap:6 }}>
      {loading && <Spinner size={12} color={ghost?col:"#000"}/>}{children}
    </button>
  );
}
function Toast({ msg, ok, onClose }) {
  useEffect(() => { const t=setTimeout(onClose,3000); return()=>clearTimeout(t); }, [onClose]);
  return (
    <div className="fadeUp" style={{ position:"fixed", bottom:20, right:20, zIndex:9999,
      background:ok?C.green+"22":C.red+"22", border:`1px solid ${ok?C.green:C.red}`,
      borderRadius:10, padding:"12px 20px", color:ok?C.green:C.red, fontWeight:600, fontSize:13 }}>
      {ok?"✓ ":"✗ "}{msg}
    </div>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
      <div style={{ background:C.card, border:`1px solid ${C.borderHi}`, borderRadius:14,
        padding:28, width:"100%", maxWidth:460, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:17 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:22 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function DateRangeBar({ from, to, setFrom, setTo }) {
  const presets = [
    { label:"Today",    f:today(),    t:today() },
    { label:"7 Days",   f:daysAgo(6), t:today() },
    { label:"30 Days",  f:daysAgo(29),t:today() },
    { label:"All Time", f:"",         t:"" },
  ];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
      padding:"10px 14px", marginBottom:20 }}>
      <span style={{ fontSize:11, color:C.muted, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>DATE RANGE</span>
      {presets.map(p => {
        const active = from===p.f && to===p.t;
        return (
          <button key={p.label} onClick={() => { setFrom(p.f); setTo(p.t); }}
            style={{ background:active?C.green:"transparent", color:active?"#000":C.muted,
              border:`1px solid ${active?C.green:C.border}`, borderRadius:6,
              padding:"4px 12px", cursor:"pointer", fontSize:12, fontWeight:600, transition:"all .15s" }}>
            {p.label}
          </button>
        );
      })}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)}
          style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.text, borderRadius:6, padding:"4px 8px", fontSize:12, outline:"none" }}/>
        <span style={{ color:C.muted, fontSize:12 }}>→</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)}
          style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.text, borderRadius:6, padding:"4px 8px", fontSize:12, outline:"none" }}/>
      </div>
      {(from||to) && <button onClick={()=>{setFrom("");setTo("");}} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:12 }}>✕ Clear</button>}
    </div>
  );
}
function TableEmpty({ cols, msg="No data" }) {
  return <tr><td colSpan={cols} style={{ padding:"28px 0", textAlign:"center", color:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>{msg}</td></tr>;
}
function TableLoading({ cols }) {
  return <tr><td colSpan={cols} style={{ padding:"28px 0", textAlign:"center" }}><Spinner/></td></tr>;
}
function Th({ children }) {
  return <th style={{ padding:"8px 10px", textAlign:"left", color:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:1, fontWeight:400, whiteSpace:"nowrap" }}>{children}</th>;
}
function Td({ children, style={} }) {
  return <td style={{ padding:"7px 10px", fontSize:12, ...style }}>{children}</td>;
}

// ── Revenue Section ──────────────────────────────────────────────
function RevenueSection({ from, to, setFrom, setTo }) {
  const [summary, setSummary]    = useState(null);
  const [daily,   setDaily]      = useState([]);
  const [byStation,setByStation] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [error,   setError]      = useState(null);
  const pollRef = useRef(null);

  const load = useCallback(async (initial=false) => {
    if (initial) setLoading(true);
    try {
      const [s,d,st] = await Promise.all([
        API.analytics.revenueSummary(from||undefined, to||undefined),
        API.analytics.dailyRevenue(from||undefined, to||undefined),
        API.analytics.stationRevenue(from||undefined, to||undefined),
      ]);
      setSummary(s); setDaily(d);
      setByStation(st.sort((a,b)=>b.trip_count-a.trip_count).slice(0,8));
      setError(null);
    } catch(e) { if (initial) setError(e.message); }
    finally { if (initial) setLoading(false); }
  }, [from, to]);

  useEffect(() => {
    load(true);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(()=>load(false), 5000);
    return ()=>clearInterval(pollRef.current);
  }, [load]);

  const rangeLabel = (!from&&!to) ? "ALL TIME" : `${from||"…"} → ${to||"…"}`;
  const pieData = summary ? [
    { name:"Card Revenue",   value:+summary.card_revenue.toFixed(2),   color:C.green },
    { name:"Ticket Revenue", value:+summary.ticket_revenue.toFixed(2), color:C.blue  },
  ] : [];

  return (
    <div>
      <DateRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}/>
      {error && !loading && (
        <div style={{ background:C.red+"22", border:`1px solid ${C.red}44`, borderRadius:8,
          padding:"12px 16px", marginBottom:16, color:C.red, fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
          ⚠ {error} <button onClick={()=>load(true)} style={{ marginLeft:12, background:C.red, color:"#fff",
            border:"none", borderRadius:4, padding:"3px 10px", cursor:"pointer", fontSize:11 }}>RETRY</button>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {loading ? Array(4).fill(0).map((_,i)=>(
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"center" }}><Spinner/></div>
        )) : summary ? [
          { l:"TOTAL REVENUE",   v:`₹${summary.total_revenue.toFixed(2)}`,  c:C.green, s:`${summary.card_trips+summary.tickets_sold} tx` },
          { l:"CARD REVENUE",    v:`₹${summary.card_revenue.toFixed(2)}`,   c:C.blue,  s:`${summary.card_trips} trips (incl. active)` },
          { l:"TICKET REVENUE",  v:`₹${summary.ticket_revenue.toFixed(2)}`, c:C.amber, s:`${summary.tickets_sold} tickets` },
          { l:"RECHARGE INFLOW", v:`₹${summary.recharge_total.toFixed(2)}`, c:C.teal,  s:`${summary.recharge_count} recharges` },
        ].map(k=>(
          <div key={k.l} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:k.c }}/>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>{k.l}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color:k.c, lineHeight:1 }}>{k.v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>{k.s}</div>
          </div>
        )) : null}
      </div>
      <SBox style={{ marginBottom:16 }}>
        <SHead title="Daily Trend"><span style={{ fontSize:11, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>{rangeLabel}</span></SHead>
        {daily.length===0
          ? <div style={{ textAlign:"center", color:C.muted, padding:"28px 0", fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No data for range</div>
          : <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={daily} margin={{left:-10,right:10}}>
                <defs>
                  <linearGradient id="gCard"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={.25}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gTicket" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue}  stopOpacity={.25}/><stop offset="95%" stopColor={C.blue}  stopOpacity={0}/></linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}} formatter={v=>`₹${v}`}/>
                <Area type="monotone" dataKey="card"   stroke={C.green} fill="url(#gCard)"   strokeWidth={2} name="Card"/>
                <Area type="monotone" dataKey="ticket" stroke={C.blue}  fill="url(#gTicket)" strokeWidth={2} name="Ticket"/>
              </AreaChart>
            </ResponsiveContainer>}
      </SBox>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.5fr", gap:16 }}>
        <SBox>
          <SHead title="Split"/>
          {!summary||summary.total_revenue===0
            ? <div style={{ textAlign:"center", color:C.muted, padding:"28px 0", fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No revenue</div>
            : <><ResponsiveContainer width="100%" height={150}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={60} innerRadius={32} dataKey="value" paddingAngle={4}>
                  {pieData.map((e,i)=><Cell key={i} fill={e.color} stroke="none"/>)}
                </Pie><Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>`₹${v}`}/></PieChart>
              </ResponsiveContainer>
              {pieData.map(p=>(
                <div key={p.name} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderTop:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:9, height:9, borderRadius:"50%", background:p.color }}/>
                    <span style={{ fontSize:12, color:C.muted }}>{p.name}</span>
                  </div>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:p.color, fontSize:13 }}>₹{p.value}</span>
                </div>
              ))}</>}
        </SBox>
        <SBox>
          <SHead title="By Station (Trip Count)"/>
          {byStation.length===0
            ? <div style={{ textAlign:"center", color:C.muted, padding:"28px 0", fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>No data</div>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byStation} margin={{left:-16,right:8}}>
                  <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>`₹${v}`}/>
                  <Bar dataKey="trip_count" radius={[4,4,0,0]}>
                    {byStation.map((_,i)=><Cell key={i} fill={[C.green,C.blue,C.amber,C.teal,C.purple,C.red][i%6]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>}
        </SBox>
      </div>
    </div>
  );
}

// ── Trips Section ────────────────────────────────────────────────
function TripsSection({ from, to, setFrom, setTo }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const load = useCallback(async (initial=false) => {
    if (initial) setLoading(true);
    try { setRows(await API.trips.list({ date_from:from||undefined, date_to:to||undefined })); }
    catch(_) {}
    finally { if (initial) setLoading(false); }
  }, [from, to]);

  useEffect(() => {
    load(true);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(()=>load(false), 5000);
    return ()=>clearInterval(pollRef.current);
  }, [load]);

  const activeCount = rows.filter(t=>t.status==="IN_PROGRESS").length;
  return (
    <div>
      <DateRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}/>
      <SBox>
        <SHead title={`Card Trips (${rows.length})`}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <LiveDot/><Badge label={`${activeCount} ACTIVE`} color={C.green}/>
            <Btn sm ghost onClick={()=>load(true)}>↻ Refresh</Btn>
          </div>
        </SHead>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["#","Card","User","Entry Station","Exit Station","Fare","Entry Time","Status"].map(h=><Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {loading ? <TableLoading cols={8}/> : rows.length===0 ? <TableEmpty cols={8} msg="No trips in range"/> : rows.map(t=>(
                <tr key={t.id} style={{ background:t.status==="IN_PROGRESS"?C.greenGlow:"transparent", borderBottom:`1px solid ${C.border}22` }}
                  onMouseEnter={e=>e.currentTarget.style.background=t.status==="IN_PROGRESS"?C.greenGlow:C.border+"18"}
                  onMouseLeave={e=>e.currentTarget.style.background=t.status==="IN_PROGRESS"?C.greenGlow:"transparent"}>
                  <Td style={{ color:C.dim, fontFamily:"'JetBrains Mono',monospace" }}>#{t.id}</Td>
                  <Td style={{ fontFamily:"'JetBrains Mono',monospace", color:C.blue, fontSize:11 }}>…{t.card_number?.slice(-4)||"?"}</Td>
                  <Td style={{ fontWeight:600 }}>{t.user_name||"?"}</Td>
                  <Td style={{ color:C.muted }}>{t.entry_station||"?"}</Td>
                  <Td style={{ color:C.muted }}>{t.exit_station||"—"}</Td>
                  <Td style={{ fontFamily:"'JetBrains Mono',monospace", color:t.fare_deducted?C.amber:C.muted }}>{t.fare_deducted?`₹${t.fare_deducted}`:"—"}</Td>
                  <Td style={{ color:C.muted, fontSize:11, whiteSpace:"nowrap" }}>{new Date(t.entry_time).toLocaleString("en-IN")}</Td>
                  <Td><Badge label={t.status} color={t.status==="COMPLETED"?C.green:t.status==="IN_PROGRESS"?C.amber:C.muted}/></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SBox>
    </div>
  );
}

// ── Tickets Section ──────────────────────────────────────────────
function TicketsSection({ from, to, setFrom, setTo }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const load = useCallback(async (initial=false) => {
    if (initial) setLoading(true);
    try { setRows(await API.tickets.list({ date_from:from||undefined, date_to:to||undefined })); }
    catch(_) {}
    finally { if (initial) setLoading(false); }
  }, [from, to]);

  useEffect(() => {
    load(true);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(()=>load(false), 5000);
    return ()=>clearInterval(pollRef.current);
  }, [load]);

  const total = rows.reduce((s,t)=>s+(t.fare_paid||0),0);
  return (
    <div>
      <DateRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
        {[
          { l:"TICKETS SOLD",   v:rows.length,                                             c:C.amber },
          { l:"TICKET REVENUE", v:`₹${total.toFixed(2)}`,                                 c:C.green },
          { l:"AVG FARE",       v:rows.length?`₹${(total/rows.length).toFixed(2)}`:"—",   c:C.blue  },
        ].map(k=>(
          <div key={k.l} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:k.c }}/>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>{k.l}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:k.c }}>{k.v}</div>
          </div>
        ))}
      </div>
      <SBox>
        <SHead title="Issued Tickets"><Btn sm ghost onClick={()=>load(true)}>↻ Refresh</Btn></SHead>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Code","From","To","Fare","Machine","Issued At","Status"].map(h=><Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {loading ? <TableLoading cols={7}/> : rows.length===0 ? <TableEmpty cols={7} msg="No tickets in range"/> : rows.map(t=>(
                <tr key={t.id||t.code} style={{ borderBottom:`1px solid ${C.border}22` }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.border+"18"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td style={{ fontFamily:"'JetBrains Mono',monospace", color:C.amber, letterSpacing:1, fontSize:10 }}>{t.code}</Td>
                  <Td>{t.from_name||"?"}</Td><Td>{t.to_name||"?"}</Td>
                  <Td style={{ fontFamily:"'JetBrains Mono',monospace", color:C.green, fontWeight:700 }}>₹{t.fare_paid}</Td>
                  <Td style={{ color:C.muted }}>M#{t.machine_id}</Td>
                  <Td style={{ color:C.muted, fontSize:11, whiteSpace:"nowrap" }}>{t.issued_at?new Date(t.issued_at).toLocaleString("en-IN"):"—"}</Td>
                  <Td><Badge label={t.status} color={C.green}/></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SBox>
    </div>
  );
}

// ── Manage Sub-sections ──────────────────────────────────────────
function ManageStations({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name:"", latitude:"", longitude:"" });
  const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { setRows(await API.stations.list()); } catch(_){} setLoading(false); };
  useEffect(()=>{ load(); },[]);
  async function save() {
    if (!form.name.trim()) { toast("Name required",false); return; }
    setSaving(true);
    try {
      if (modal==="add") { await API.stations.create({ name:form.name.trim(), latitude:+form.latitude||0, longitude:+form.longitude||0 }); toast("Station added"); }
      else { await API.stations.update(modal.id, { name:form.name.trim() }); toast("Station updated"); }
      setModal(null); load();
    } catch(e) { toast(e.message,false); }
    setSaving(false);
  }
  return (
    <SBox>
      <SHead title={`Stations (${rows.length})`}><Btn sm onClick={()=>{setForm({name:"",latitude:"",longitude:""});setModal("add");}}>+ Add</Btn></SHead>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>{["ID","Name","Actions"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>
          {loading ? <TableLoading cols={3}/> : rows.map(s=>(
            <tr key={s.id} style={{ borderBottom:`1px solid ${C.border}22` }}>
              <Td style={{ fontFamily:"'JetBrains Mono',monospace", color:C.muted }}>#{s.id}</Td>
              <Td style={{ fontWeight:600 }}>{s.name}</Td>
              <Td><div style={{ display:"flex", gap:6 }}>
                <Btn sm ghost onClick={()=>{setModal(s);setForm({name:s.name,latitude:"",longitude:""});}}>Edit</Btn>
                <Btn sm ghost danger onClick={async()=>{ try{await API.stations.delete(s.id);toast("Deleted");load();}catch(e){toast(e.message,false);} }}>Delete</Btn>
              </div></Td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal && <Modal title={modal==="add"?"Add Station":"Edit Station"} onClose={()=>setModal(null)}>
        <Inp label="STATION NAME" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Rajendra Nagar"/>
        {modal==="add" && <>
          <Inp label="LATITUDE"  value={form.latitude}  onChange={v=>setForm(f=>({...f,latitude:v}))}  type="number"/>
          <Inp label="LONGITUDE" value={form.longitude} onChange={v=>setForm(f=>({...f,longitude:v}))} type="number"/>
        </>}
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <Btn onClick={save} loading={saving}>{modal==="add"?"Add":"Save"}</Btn>
          <Btn ghost onClick={()=>setModal(null)}>Cancel</Btn>
        </div>
      </Modal>}
    </SBox>
  );
}

function ManageFares({ toast }) {
  const [rows, setRows] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ from_station_id:"", to_station_id:"", fare_amount:"" });
  const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { const [f,s]=await Promise.all([API.fares.list(),API.stations.list()]); setRows(f); setStations(s); } catch(_){} setLoading(false); };
  useEffect(()=>{ load(); },[]);
  async function save() {
    if (!form.from_station_id||!form.to_station_id||!form.fare_amount) { toast("All fields required",false); return; }
    if (form.from_station_id===form.to_station_id) { toast("From and To must differ",false); return; }
    setSaving(true);
    try { await API.fares.upsert({ from_station_id:+form.from_station_id, to_station_id:+form.to_station_id, fare_amount:+form.fare_amount }); toast("Fare saved"); setModal(false); load(); }
    catch(e) { toast(e.message,false); } setSaving(false);
  }
  const stOpts = [{value:"",label:"— select —"},...stations.map(s=>({value:s.id,label:s.name}))];
  return (
    <SBox>
      <SHead title={`Fare Matrix (${rows.length})`}><Btn sm onClick={()=>{setForm({from_station_id:"",to_station_id:"",fare_amount:""});setModal(true);}}>+ Set Fare</Btn></SHead>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>{["From","To","Fare",""].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {loading ? <TableLoading cols={4}/> : rows.length===0 ? <TableEmpty cols={4} msg="No fares defined"/> : rows.map(r=>(
              <tr key={`${r.from_station_id}-${r.to_station_id}`} style={{ borderBottom:`1px solid ${C.border}22` }}>
                <Td>{r.from_name}</Td><Td>{r.to_name}</Td>
                <Td style={{ fontFamily:"'JetBrains Mono',monospace", color:C.amber, fontWeight:700 }}>₹{r.fare_amount}</Td>
                <Td><Btn sm ghost danger onClick={async()=>{ try{await API.fares.delete(r.from_station_id,r.to_station_id);toast("Removed");load();}catch(e){toast(e.message,false);} }}>Remove</Btn></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <Modal title="Set Fare" onClose={()=>setModal(false)}>
        <Sel label="FROM" value={form.from_station_id} onChange={v=>setForm(f=>({...f,from_station_id:v}))} options={stOpts}/>
        <Sel label="TO"   value={form.to_station_id}   onChange={v=>setForm(f=>({...f,to_station_id:v}))}   options={stOpts}/>
        <Inp label="FARE (₹)" value={form.fare_amount} onChange={v=>setForm(f=>({...f,fare_amount:v}))} type="number" placeholder="20"/>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <Btn onClick={save} loading={saving}>Save</Btn><Btn ghost onClick={()=>setModal(false)}>Cancel</Btn>
        </div>
      </Modal>}
    </SBox>
  );
}

function ManageUsers({ toast }) {
  const [rows, setRows] = useState([]);
  const [cardCounts, setCardCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name:"", email:"", phone:"", pin:"" });
  const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { const [u,c]=await Promise.all([API.users.list(),API.cards.list()]); setRows(u); const m={}; c.forEach(cd=>{ m[cd.user_id]=(m[cd.user_id]||0)+1; }); setCardCounts(m); } catch(_){} setLoading(false); };
  useEffect(()=>{ load(); },[]);
  async function save() {
    if (!form.name||!form.email||!form.phone||!form.pin) { toast("All fields required",false); return; }
    if (form.pin.length!==4||isNaN(form.pin)) { toast("PIN must be 4 digits",false); return; }
    setSaving(true);
    try {
      if (modal==="add") { await API.users.create(form); toast("User added"); }
      else { await API.users.update(modal.id, form); toast("User updated"); }
      setModal(null); load();
    } catch(e) { toast(e.message,false); } setSaving(false);
  }
  return (
    <SBox>
      <SHead title={`Users (${rows.length})`}><Btn sm onClick={()=>{setForm({name:"",email:"",phone:"",pin:""});setModal("add");}}>+ Add User</Btn></SHead>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>{["#","Name","Email","Phone","PIN","Cards","Actions"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>
          {loading ? <TableLoading cols={7}/> : rows.map(u=>(
            <tr key={u.id} style={{ borderBottom:`1px solid ${C.border}22` }}>
              <Td style={{ fontFamily:"'JetBrains Mono',monospace", color:C.muted }}>#{u.id}</Td>
              <Td style={{ fontWeight:700 }}>{u.name}</Td>
              <Td style={{ color:C.muted, fontSize:12 }}>{u.email}</Td>
              <Td style={{ fontFamily:"'JetBrains Mono',monospace", color:C.muted, fontSize:12 }}>{u.phone}</Td>
              <Td style={{ fontFamily:"'JetBrains Mono',monospace", color:C.amber }}>{u.pin}</Td>
              <Td><Badge label={cardCounts[u.id]||0} color={C.blue}/></Td>
              <Td><div style={{ display:"flex", gap:6 }}>
                <Btn sm ghost onClick={()=>{setModal(u);setForm({name:u.name,email:u.email,phone:u.phone,pin:u.pin});}}>Edit</Btn>
                <Btn sm ghost danger onClick={async()=>{ try{await API.users.delete(u.id);toast("Deleted");load();}catch(e){toast(e.message,false);} }}>Delete</Btn>
              </div></Td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal && <Modal title={modal==="add"?"Add User":"Edit User"} onClose={()=>setModal(null)}>
        <Inp label="FULL NAME"   value={form.name}  onChange={v=>setForm(f=>({...f,name:v}))}  placeholder="Rahul Kumar"/>
        <Inp label="EMAIL"       value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/>
        <Inp label="PHONE"       value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} placeholder="9876543210"/>
        <Inp label="4-DIGIT PIN" value={form.pin}   onChange={v=>setForm(f=>({...f,pin:v}))}   placeholder="1234"/>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <Btn onClick={save} loading={saving}>{modal==="add"?"Add":"Save"}</Btn><Btn ghost onClick={()=>setModal(null)}>Cancel</Btn>
        </div>
      </Modal>}
    </SBox>
  );
}

function ManageCards({ toast, from, to, setFrom, setTo }) {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ user_id:"", number:"", balance:"", status:"ACTIVE" });
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { const [c,u,t]=await Promise.all([API.cards.list(),API.users.list(),API.trips.list({ date_from:from||undefined, date_to:to||undefined })]); setRows(c); setUsers(u); setTrips(t); }
    catch(_){} setLoading(false);
  }, [from, to]);
  useEffect(()=>{ load(); },[load]);
  async function save() {
    setSaving(true);
    try {
      if (modal==="add") { await API.cards.create({ user_id:+form.user_id, number:form.number, balance:+form.balance, status:form.status }); toast("Card issued"); }
      else { await API.cards.update(modal.id, { balance:+form.balance, status:form.status }); toast("Card updated"); }
      setModal(null); load();
    } catch(e) { toast(e.message,false); } setSaving(false);
  }
  async function adjust(id, delta) {
    const card=rows.find(c=>c.id===id); if(!card)return;
    try { await API.cards.update(id,{ balance:Math.max(0,+(card.balance+delta).toFixed(2)), status:card.status }); toast(`Balance ${delta>0?"+":""} ₹${Math.abs(delta)}`); load(); }
    catch(e) { toast(e.message,false); }
  }
  const userOpts = [{value:"",label:"— select user —"},...users.map(u=>({value:u.id,label:u.name}))];
  return (
    <div>
      <DateRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}/>
      <SBox>
        <SHead title={`Metro Cards (${rows.length})`}><Btn sm onClick={()=>{setForm({user_id:"",number:"",balance:"",status:"ACTIVE"});setModal("add");}}>+ Issue Card</Btn></SHead>
        {loading ? <div style={{ display:"flex", justifyContent:"center", padding:24 }}><Spinner/></div> : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
            {rows.map(card=>{
              const ct=trips.filter(t=>t.card_id===card.id);
              const spent=ct.filter(t=>t.status==="COMPLETED").reduce((s,t)=>s+(t.fare_deducted||0),0);
              const active=ct.find(t=>t.status==="IN_PROGRESS");
              return (
                <div key={card.id} style={{ background:C.card2, border:`1px solid ${active?C.green:C.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{card.user_name}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.muted, marginTop:2 }}>…{card.number.slice(-4)}</div>
                      {active && <div style={{ fontSize:10, color:C.green, marginTop:3 }}>● ACTIVE TRIP</div>}
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:card.balance>50?C.green:card.balance>20?C.amber:C.red }}>₹{Number(card.balance).toFixed(2)}</div>
                      <Badge label={card.status} color={card.status==="ACTIVE"?C.green:C.red}/>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, borderTop:`1px solid ${C.border}`, paddingTop:10, marginBottom:10 }}>
                    <div style={{ textAlign:"center" }}><div style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:C.amber, fontSize:16 }}>{ct.length}</div><div style={{ fontSize:10, color:C.muted }}>trips</div></div>
                    <div style={{ textAlign:"center" }}><div style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:C.red, fontSize:16 }}>₹{spent.toFixed(0)}</div><div style={{ fontSize:10, color:C.muted }}>spent</div></div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <Btn sm ghost color={C.green} onClick={()=>adjust(card.id,100)}>+₹100</Btn>
                    <Btn sm ghost color={C.green} onClick={()=>adjust(card.id,500)}>+₹500</Btn>
                    <Btn sm ghost color={C.amber} onClick={()=>adjust(card.id,-100)}>-₹100</Btn>
                    <Btn sm ghost color={C.blue}  onClick={()=>{setModal(card);setForm({user_id:card.user_id,number:card.number,balance:card.balance,status:card.status});}}>Edit</Btn>
                    <Btn sm ghost danger onClick={async()=>{ try{await API.cards.delete(card.id);toast("Removed");load();}catch(e){toast(e.message,false);} }}>Del</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SBox>
      {modal && <Modal title={modal==="add"?"Issue Card":"Edit Card"} onClose={()=>setModal(null)}>
        {modal==="add" && <>
          <Sel label="CARD HOLDER" value={form.user_id} onChange={v=>setForm(f=>({...f,user_id:v}))} options={userOpts}/>
          <Inp label="16-DIGIT NUMBER" value={form.number}  onChange={v=>setForm(f=>({...f,number:v}))} placeholder="1234567890123456"/>
          <Inp label="INITIAL BALANCE" value={form.balance} onChange={v=>setForm(f=>({...f,balance:v}))} type="number"/>
        </>}
        {modal!=="add" && <Inp label="BALANCE (₹)" value={form.balance} onChange={v=>setForm(f=>({...f,balance:v}))} type="number"/>}
        <Sel label="STATUS" value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={[{value:"ACTIVE",label:"ACTIVE"},{value:"BLOCKED",label:"BLOCKED"},{value:"EXPIRED",label:"EXPIRED"}]}/>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <Btn onClick={save} loading={saving}>{modal==="add"?"Issue":"Save"}</Btn><Btn ghost onClick={()=>setModal(null)}>Cancel</Btn>
        </div>
      </Modal>}
    </div>
  );
}

function ManageMachines({ toast }) {
  const [rows, setRows] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ station_id:"", code:"", status:"ONLINE" });
  const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { const [m,s]=await Promise.all([API.machines.list(),API.stations.list()]); setRows(m); setStations(s); } catch(_){} setLoading(false); };
  useEffect(()=>{ load(); },[]);
  async function save() {
    if (!form.station_id||!form.code) { toast("All fields required",false); return; }
    setSaving(true);
    try {
      if (modal==="add") { await API.machines.create({ station_id:+form.station_id, code:form.code, status:form.status }); toast("Machine added"); }
      else { await API.machines.update(modal.id,{ station_id:+form.station_id, code:form.code, status:form.status }); toast("Updated"); }
      setModal(null); load();
    } catch(e) { toast(e.message,false); } setSaving(false);
  }
  const stOpts = [{value:"",label:"— select station —"},...stations.map(s=>({value:s.id,label:s.name}))];
  return (
    <SBox>
      <SHead title={`Machines (${rows.length})`}><Btn sm onClick={()=>{setForm({station_id:"",code:"",status:"ONLINE"});setModal("add");}}>+ Add Machine</Btn></SHead>
      {loading ? <div style={{ display:"flex", justifyContent:"center", padding:24 }}><Spinner/></div> : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
          {rows.map(m=>{
            const online=m.status==="ONLINE";
            return (
              <div key={m.id} style={{ background:C.card2, border:`1px solid ${online?C.border:C.red+"44"}`, borderRadius:12, padding:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:14 }}>{m.code}</span>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:online?C.green:C.red, boxShadow:`0 0 8px ${online?C.green:C.red}` }} className={online?"live":""}/>
                </div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>{m.station_name}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <Btn sm ghost color={online?C.amber:C.green} onClick={async()=>{ try{await API.machines.update(m.id,{station_id:m.station_id,code:m.code,status:online?"OFFLINE":"ONLINE"});toast("Toggled");load();}catch(e){toast(e.message,false);} }}>{online?"Go Offline":"Go Online"}</Btn>
                  <Btn sm ghost color={C.blue} onClick={()=>{setModal(m);setForm({station_id:m.station_id,code:m.code,status:m.status});}}>Edit</Btn>
                  <Btn sm ghost danger onClick={async()=>{ try{await API.machines.delete(m.id);toast("Removed");load();}catch(e){toast(e.message,false);} }}>Del</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {modal && <Modal title={modal==="add"?"Add Machine":"Edit Machine"} onClose={()=>setModal(null)}>
        <Sel label="STATION" value={form.station_id} onChange={v=>setForm(f=>({...f,station_id:v}))} options={stOpts}/>
        <Inp label="MACHINE CODE" value={form.code} onChange={v=>setForm(f=>({...f,code:v}))} placeholder="VM-XX-01"/>
        <Sel label="STATUS" value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={[{value:"ONLINE",label:"ONLINE"},{value:"OFFLINE",label:"OFFLINE"},{value:"MAINTENANCE",label:"MAINTENANCE"}]}/>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <Btn onClick={save} loading={saving}>{modal==="add"?"Add":"Save"}</Btn><Btn ghost onClick={()=>setModal(null)}>Cancel</Btn>
        </div>
      </Modal>}
    </SBox>
  );
}

function ManageSection({ from, to, setFrom, setTo }) {
  const [sub, setSub] = useState("stations");
  const [toasts, setToasts] = useState([]);
  function toast(msg, ok=true) { const id=Date.now(); setToasts(t=>[...t,{id,msg,ok}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3200); }
  const subs = [{id:"stations",label:"🗺 Stations"},{id:"fares",label:"💰 Fares"},{id:"users",label:"👤 Users"},{id:"cards",label:"💳 Cards"},{id:"machines",label:"🏧 Machines"}];
  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        {subs.map(s=>(
          <button key={s.id} onClick={()=>setSub(s.id)}
            style={{ background:sub===s.id?C.green+"22":"transparent", color:sub===s.id?C.green:C.muted,
              border:`1px solid ${sub===s.id?C.green:C.border}`, borderRadius:8, padding:"7px 16px",
              cursor:"pointer", fontWeight:600, fontSize:13, transition:"all .15s" }}>
            {s.label}
          </button>
        ))}
      </div>
      {sub==="stations" && <ManageStations toast={toast}/>}
      {sub==="fares"    && <ManageFares    toast={toast}/>}
      {sub==="users"    && <ManageUsers    toast={toast}/>}
      {sub==="cards"    && <ManageCards    toast={toast} from={from} to={to} setFrom={setFrom} setTo={setTo}/>}
      {sub==="machines" && <ManageMachines toast={toast}/>}
      {toasts.map(t=><Toast key={t.id} msg={t.msg} ok={t.ok} onClose={()=>setToasts(ts=>ts.filter(x=>x.id!==t.id))}/>)}
    </div>
  );
}

// ── Audit Section ────────────────────────────────────────────────
function AuditSection({ from, to, setFrom, setTo }) {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [toast, setToast]       = useState(null);
  const pollRef = useRef(null);
  function showToast(msg, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); }
  const load = useCallback(async (initial=false) => {
    if (initial) setLoading(true);
    try { setRows(await API.audit.list({ date_from:from||undefined, date_to:to||undefined })); }
    catch(_) {}
    finally { if (initial) setLoading(false); }
  }, [from, to]);
  useEffect(()=>{ load(true); clearInterval(pollRef.current); pollRef.current=setInterval(()=>load(false),5000); return()=>clearInterval(pollRef.current); },[load]);
  async function deleteAll() {
    setDeleting(true);
    try { await API.audit.deleteAll(); showToast("All audit logs deleted"); setConfirmAll(false); load(false); }
    catch(e) { showToast(e.message,false); } setDeleting(false);
  }
  async function deleteOne(id) {
    try { await API.audit.deleteOne(id); setRows(r=>r.filter(x=>x.log_id!==id)); showToast(`Log #${id} deleted`); }
    catch(e) { showToast(e.message,false); }
  }
  return (
    <div>
      <DateRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}/>
      <SBox>
        <SHead title={`Audit Log (${rows.length} events)`}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <LiveDot/>
            {!confirmAll
              ? <Btn sm ghost danger onClick={()=>setConfirmAll(true)}>🗑 Delete All</Btn>
              : <><span style={{ fontSize:12, color:C.red, fontFamily:"'JetBrains Mono',monospace" }}>Sure?</span>
                  <Btn sm danger onClick={deleteAll} loading={deleting}>Yes, Delete All</Btn>
                  <Btn sm ghost onClick={()=>setConfirmAll(false)}>Cancel</Btn></>}
          </div>
        </SHead>
        <div style={{ overflowX:"auto", maxHeight:520, overflowY:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead style={{ position:"sticky", top:0, background:C.card }}>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["#","Type","Event","Δ Amount","Detail","Time",""].map(h=><Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <TableLoading cols={7}/> : rows.length===0 ? <TableEmpty cols={7} msg="No events in range"/> : rows.map(l=>(
                <tr key={l.log_id} style={{ borderBottom:`1px solid ${C.border}22` }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.border+"18"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td style={{ color:C.dim, fontFamily:"'JetBrains Mono',monospace" }}>{l.log_id}</Td>
                  <Td><Badge label={l.entity_type||l.event_type} color={l.event_type?.includes("TAP")?C.blue:l.event_type?.includes("TICKET")?C.amber:C.green}/></Td>
                  <Td style={{ color:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>{l.event_type}</Td>
                  <Td style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:l.amount_delta>0?C.green:l.amount_delta<0?C.red:C.muted }}>
                    {l.amount_delta!=null?(l.amount_delta>0?"+":"")+`₹${Math.abs(l.amount_delta)}`:"—"}
                  </Td>
                  <Td style={{ color:C.muted, fontSize:11, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.description||"—"}</Td>
                  <Td style={{ color:C.dim, fontFamily:"'JetBrains Mono',monospace", fontSize:10, whiteSpace:"nowrap" }}>{new Date(l.created_at).toLocaleString("en-IN")}</Td>
                  <Td><Btn sm ghost danger onClick={()=>deleteOne(l.log_id)}>✕</Btn></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SBox>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={()=>setToast(null)}/>}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────
const NAV = [
  {id:"revenue",label:"Revenue",  icon:"₹"},
  {id:"trips",  label:"Trips",    icon:"🚇"},
  {id:"tickets",label:"Tickets",  icon:"🎫"},
  {id:"manage", label:"Manage DB",icon:"⚙"},
  {id:"audit",  label:"Audit Log",icon:"📋"},
];

export default function AdminApp() {
  const [view, setView]   = useState("revenue");
  const [authed, setAuthed] = useState(false);
  const [pass, setPass]   = useState("");
  const [passErr, setPassErr] = useState("");
  const [time, setTime]   = useState(new Date());
  const [from, setFrom]   = useState("");
  const [to,   setTo]     = useState("");
  const [ticker, setTicker] = useState(null);

  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(t); },[]);

  useEffect(()=>{
    if (!authed) return;
    let fails=0;
    async function poll() {
      try { setTicker(await API.analytics.revenueSummary()); fails=0; }
      catch(_) { fails++; if(fails>=3) setTicker("error"); }
    }
    poll();
    const t=setInterval(poll,5000);
    return()=>clearInterval(t);
  },[authed]);

  function tryLogin() {
    if (pass==="admin123") { setAuthed(true); setPassErr(""); }
    else { setPassErr("Incorrect password"); setTimeout(()=>setPassErr(""),2000); }
  }

  const tickerParts = (ticker&&ticker!=="error") ? [
    `TOTAL: ₹${ticker.alltime_total.toFixed(2)}`,
    `CARDS: ₹${ticker.alltime_card_revenue.toFixed(2)}`,
    `TICKETS: ₹${ticker.alltime_ticket_revenue.toFixed(2)}`,
    `ACTIVE TRIPS: ${ticker.active_trips}`,
    `TICKETS SOLD: ${ticker.tickets_sold}`,
    `RECHARGES: ${ticker.recharge_count}`,
  ] : [ticker==="error" ? "⚠ BACKEND ERROR — CHECK FASTAPI IS RUNNING" : "◌ CONNECTING TO SERVER…"];

  if (!authed) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{CSS}</style>
      <div style={{ width:380 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:38, letterSpacing:1,
            background:`linear-gradient(135deg,${C.green},${C.blue})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>ADMIN ACCESS</div>
          <div style={{ color:C.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace", marginTop:6, letterSpacing:2 }}>PATNA METRO CONTROL CENTER</div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.borderHi}`, borderRadius:14, padding:28 }}>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>PASSWORD</div>
          <input type="password" value={pass}
            onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&tryLogin()}
            placeholder="Enter admin password"
            style={{ width:"100%", background:C.surface, border:`1px solid ${passErr?C.red:C.border}`,
              color:C.text, borderRadius:8, padding:"12px 14px", fontSize:14, outline:"none",
              marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}/>
          {passErr && <div style={{ color:C.red, fontSize:12, marginBottom:10, fontFamily:"'JetBrains Mono',monospace" }}>{passErr}</div>}
          <div style={{ fontSize:11, color:C.dim, marginBottom:16, fontFamily:"'JetBrains Mono',monospace" }}>hint: admin123</div>
          <button onClick={tryLogin}
            style={{ width:"100%", background:C.green, color:"#000", border:"none", borderRadius:8,
              padding:"13px 0", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, letterSpacing:1 }}>
            ENTER
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height:"100vh", background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{CSS}</style>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"0 20px",
        height:52, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:C.greenGlow,
            border:`1px solid ${C.green}33`, borderRadius:20, padding:"3px 10px" }}>
            <LiveDot/>
            <span style={{ fontSize:10, color:C.green, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>LIVE</span>
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, letterSpacing:.5 }}>PATNA METRO — ADMIN</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:C.muted }}>{time.toLocaleString("en-IN",{hour12:false})}</span>
          <button onClick={()=>setAuthed(false)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, padding:"4px 12px", borderRadius:6, cursor:"pointer", fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>LOGOUT</button>
        </div>
      </div>
      <div style={{ background:"#08101A", borderBottom:`1px solid ${C.border}`, padding:"5px 0", overflow:"hidden", flexShrink:0 }}>
        <div style={{ display:"flex", gap:0, animation:"ticker 25s linear infinite", whiteSpace:"nowrap" }}>
          {[...tickerParts,...tickerParts].map((p,i)=>(
            <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.green, letterSpacing:1, marginRight:40 }}>◆ {p}</span>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <div style={{ width:190, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"12px 0", flexShrink:0 }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setView(n.id)}
              style={{ background:view===n.id?"#162030":"transparent", color:view===n.id?C.green:C.muted,
                border:"none", borderLeft:view===n.id?`3px solid ${C.green}`:"3px solid transparent",
                padding:"11px 18px", cursor:"pointer", textAlign:"left",
                fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:10, transition:"all .15s" }}>
              <span style={{ fontSize:15 }}>{n.icon}</span>{n.label}
            </button>
          ))}
          {ticker && ticker!=="error" && (
            <div style={{ marginTop:"auto", padding:"14px 14px 4px", borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:9, color:C.muted, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>LIVE TOTALS</div>
              {[
                { l:"Revenue",  v:`₹${ticker.alltime_total.toFixed(0)}`,  c:C.green },
                { l:"Active",   v:`${ticker.active_trips} trips`,          c:C.amber },
                { l:"Tickets",  v:`${ticker.tickets_sold} sold`,            c:C.blue  },
                { l:"Recharges",v:`${ticker.recharge_count} total`,         c:C.teal  },
              ].map(s=>(
                <div key={s.l} style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:5 }}>
                  <span style={{ color:C.muted }}>{s.l}</span>
                  <span style={{ color:s.c, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>{s.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:20 }} className="fadeUp" key={view}>
          {view==="revenue" && <RevenueSection from={from} to={to} setFrom={setFrom} setTo={setTo}/>}
          {view==="trips"   && <TripsSection   from={from} to={to} setFrom={setFrom} setTo={setTo}/>}
          {view==="tickets" && <TicketsSection  from={from} to={to} setFrom={setFrom} setTo={setTo}/>}
          {view==="manage"  && <ManageSection   from={from} to={to} setFrom={setFrom} setTo={setTo}/>}
          {view==="audit"   && <AuditSection    from={from} to={to} setFrom={setFrom} setTo={setTo}/>}
        </div>
      </div>
    </div>
  );
}