import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  Search, Check, ChevronRight, RefreshCw, CheckCircle,
  Globe, Clock, Plug, User, Video, Upload, AlertCircle,
  Users, ChevronDown, X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Settings persistence
// ─────────────────────────────────────────────────────────────────────────────
const SETTINGS_KEY = "nomaad_settings";
const DEFAULT_SETTINGS = {
  timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  timeFormat:   "24h",
  dateFormat:   "DD/MM/YYYY",
  weekStartsOn: 1,
  currency:     "GBP",
};
export const CURRENCIES = [
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
  { code: "SEK", symbol: "kr", label: "Swedish Krona" },
  { code: "NOK", symbol: "kr", label: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", label: "Danish Krone" },
  { code: "NZD", symbol: "NZ$", label: "New Zealand Dollar" },
  { code: "ZAR", symbol: "R",  label: "South African Rand" },
  { code: "INR", symbol: "₹",  label: "Indian Rupee" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", label: "Hong Kong Dollar" },
];
export const getSettings = () => {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; }
  catch { return { ...DEFAULT_SETTINGS }; }
};
export const getCurrency = () => {
  const s = getSettings();
  return CURRENCIES.find(c => c.code === s.currency) || CURRENCIES[0];
};
export const formatMoney = (n) => {
  const c = getCurrency();
  return `${c.symbol}${Math.round(Number(n) || 0).toLocaleString()}`;
};
const persist = (patch) => {
  const next = { ...getSettings(), ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
};

// ─── Date formats ─────────────────────────────────────────────────────────────
const DATE_FORMATS = [
  { id: "DD/MM/YYYY",   example: "16/04/2026" },
  { id: "MM/DD/YYYY",   example: "04/16/2026" },
  { id: "YYYY-MM-DD",   example: "2026-04-16" },
  { id: "D MMM YYYY",   example: "16 Apr 2026" },
  { id: "MMMM D, YYYY", example: "April 16, 2026" },
  { id: "DD.MM.YYYY",   example: "16.04.2026" },
];

// CRM field definitions
const CRM_FIELDS = [
  { id: "name",    label: "Name",    required: true },
  { id: "email",   label: "Email",   required: false },
  { id: "phone",   label: "Phone",   required: false },
  { id: "company", label: "Company", required: false },
  { id: "value",   label: "Value ($)", required: false },
];

// ─── Categories (Apple System Prefs style) ─────────────────────────────────
const CATS = [
  {
    id: "datetime", label: "Date & Time",
    iconBg: "linear-gradient(145deg,#1c6ef5,#0d5ce0)",
    iconShadow: "rgba(28,110,245,0.35)",
    icon: <Clock size={17} strokeWidth={2} color="#fff"/>,
    meta: { title:"Date & Time", sub:"Time zone, clock format, and date display across Nomaad." },
  },
  {
    id: "integrations", label: "Integrations",
    iconBg: "linear-gradient(145deg,#28a745,#1e8f3b)",
    iconShadow: "rgba(40,167,69,0.35)",
    icon: <Plug size={17} strokeWidth={2} color="#fff"/>,
    meta: { title:"Integrations", sub:"Connect external services like Google Calendar." },
  },
  {
    id: "crm", label: "CRM",
    iconBg: "linear-gradient(145deg,#ff6b35,#e85d2c)",
    iconShadow: "rgba(255,107,53,0.35)",
    icon: <Users size={17} strokeWidth={2} color="#fff"/>,
    meta: { title:"CRM", sub:"Manage client data, import contacts, and configure your pipeline." },
  },
  {
    id: "profile", label: "Profile",
    iconBg: "linear-gradient(145deg,#8e44ad,#7d3c98)",
    iconShadow: "rgba(142,68,173,0.35)",
    icon: <User size={17} strokeWidth={2} color="#fff"/>,
    meta: { title:"Profile", sub:"Your account name, email, and sign-in details." },
  },
];

// ─── Shared sub-components ────────────────────────────────────────────────────
function Seg({ options, value, onChange, t, ease }) {
  return (
    <div style={{ display:"flex", background:t.input, borderRadius:8, border:`1px solid ${t.inputBorder}`, padding:2, gap:2 }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          style={{ padding:"5px 14px", borderRadius:6, border:"none", fontSize:12, fontWeight:600, cursor:"pointer", transition:ease, fontFamily:"inherit",
            background: value===opt.value ? (dark => dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.08)")(t.shell==="rgba(18,18,22,0.7)") : "transparent",
            color: value===opt.value ? t.text : t.muted }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PrefRow({ label, sub, control, last, t }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:20,
      padding:"13px 16px", borderBottom: last ? "none" : `1px solid ${t.divider}` }}>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ fontSize:14, fontWeight:500, color:t.text, lineHeight:1.3 }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:t.sub, marginTop:2, lineHeight:1.4 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink:0 }}>{control}</div>
    </div>
  );
}

function PrefSection({ title, children, t }) {
  return (
    <div style={{ marginBottom:24 }}>
      {title && (
        <div style={{ fontSize:11, fontWeight:700, color:t.muted, letterSpacing:0.8,
          textTransform:"uppercase", marginBottom:8, paddingLeft:4 }}>{title}</div>
      )}
      <div style={{ background:t.card, border:`1px solid ${t.cardBorder}`, borderRadius:14, overflow:"hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsView({ t, dark, mobile, compact }) {
  const { user, profile, signOut } = useAuth();
  const ease = "all 0.16s cubic-bezier(.4,0,.2,1)";

  const [activeCat, setActiveCat] = useState("datetime");
  const [search,    setSearch]    = useState("");
  const [settings,  setSettings]  = useState(getSettings);

  // Google
  const [gConnecting, setGConnecting] = useState(false);
  const [gConnected,  setGConnected]  = useState(() => !!localStorage.getItem("gCalToken"));

  // Timezone picker
  const [tzOpen,   setTzOpen]   = useState(false);
  const [tzSearch, setTzSearch] = useState("");
  const tzRef = useRef();

  // CSV import
  const [csvFile,     setCsvFile]     = useState(null);
  const [csvData,     setCsvData]     = useState(null); // { headers, rows }
  const [colMap,      setColMap]      = useState({});   // crmField → csvHeader
  const [importing,   setImporting]   = useState(false);
  const [importDone,  setImportDone]  = useState(null); // number imported
  const [importErr,   setImportErr]   = useState(null);
  const fileRef = useRef();

  const update = (key, val) => {
    const next = persist({ [key]: val });
    setSettings(next);
  };

  const allTz = useMemo(() => {
    try { return Intl.supportedValuesOf("timeZone"); } catch { return ["UTC"]; }
  }, []);

  const filteredTz = useMemo(() => {
    if (!tzSearch) return allTz;
    const q = tzSearch.toLowerCase();
    return allTz.filter(z => z.toLowerCase().replace(/_/g," ").includes(q));
  }, [allTz, tzSearch]);

  useEffect(() => {
    if (!tzOpen) return;
    const h = e => { if (tzRef.current && !tzRef.current.contains(e.target)) setTzOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [tzOpen]);

  // ── Google OAuth ─────────────────────────────────────────────────────────────
  const loadGsi = () => new Promise(res => {
    if (window.google?.accounts?.oauth2) { res(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = res; document.head.appendChild(s);
  });
  const connectGoogle = async () => {
    const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!id) return;
    setGConnecting(true);
    await loadGsi();
    window.google.accounts.oauth2.initTokenClient({
      client_id: id,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: r => { setGConnecting(false); if (r.access_token) { localStorage.setItem("gCalToken",r.access_token); setGConnected(true); } },
      error_callback: () => setGConnecting(false),
    }).requestAccessToken();
  };
  const disconnectGoogle = () => { localStorage.removeItem("gCalToken"); setGConnected(false); };

  // ── CSV parsing ───────────────────────────────────────────────────────────────
  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return null;
    const parseRow = (line) => {
      const result = []; let cur = ""; let inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === "," && !inQ) { result.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      result.push(cur.trim());
      return result;
    };
    const headers = parseRow(lines[0]);
    const rows    = lines.slice(1).map(l => {
      const vals = parseRow(l);
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
    });
    return { headers, rows };
  };

  const onFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file); setImportDone(null); setImportErr(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const data = parseCSV(ev.target.result);
      setCsvData(data);
      if (data) {
        // Auto-map obvious headers
        const autoMap = {};
        CRM_FIELDS.forEach(f => {
          const match = data.headers.find(h =>
            h.toLowerCase().replace(/[\s_-]/g,"").includes(f.id.toLowerCase()) ||
            f.id.toLowerCase().includes(h.toLowerCase().replace(/[\s_-]/g,""))
          );
          if (match) autoMap[f.id] = match;
        });
        setColMap(autoMap);
      }
    };
    reader.readAsText(file);
  };

  const runImport = async () => {
    if (!csvData || !user) return;
    setImporting(true); setImportErr(null);
    try {
      const records = csvData.rows.map(row => {
        const rec = { user_id: user.id, status: "lead" };
        CRM_FIELDS.forEach(f => {
          const col = colMap[f.id];
          if (col && row[col]) {
            if (f.id === "value") rec[f.id] = parseFloat(row[col].replace(/[^0-9.]/g,"")) || 0;
            else rec[f.id] = row[col];
          }
        });
        return rec;
      }).filter(r => r.name);

      if (records.length === 0) { setImportErr("No valid records found. Make sure 'Name' column is mapped."); setImporting(false); return; }

      const { error } = await supabase.from("customers").insert(records);
      if (error) throw error;
      setImportDone(records.length);
      setCsvFile(null); setCsvData(null); setColMap({});
    } catch (err) {
      setImportErr(err.message || "Import failed");
    } finally { setImporting(false); }
  };

  // ── Timezone picker ─────────────────────────────────────────────────────────
  const TzPicker = () => (
    <div ref={tzRef} style={{ position:"relative" }}>
      <button onClick={() => setTzOpen(v=>!v)}
        style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 11px", borderRadius:9,
          border:`1px solid ${t.inputBorder}`, background:t.input, color:t.text,
          fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit", maxWidth:230, minWidth:160 }}>
        <Globe size={12} style={{ color:t.muted, flexShrink:0 }}/>
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"left" }}>
          {settings.timezone.replace(/_/g," ")}
        </span>
        <ChevronDown size={11} style={{ color:t.muted, flexShrink:0, transform:tzOpen?"rotate(180deg)":"none", transition:ease }}/>
      </button>
      {tzOpen && (
        <div style={{ position:"absolute", right:0, top:"calc(100% + 6px)", width:270, zIndex:400,
          background: dark?"rgba(22,22,26,0.98)":"rgba(252,251,249,0.98)",
          border:`1px solid ${t.cardBorder}`, borderRadius:14,
          boxShadow: dark?"0 16px 48px rgba(0,0,0,0.55)":"0 16px 48px rgba(0,0,0,0.13)",
          backdropFilter:"blur(32px)", overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 12px", borderBottom:`1px solid ${t.divider}` }}>
            <Search size={12} style={{ color:t.muted, flexShrink:0 }}/>
            <input autoFocus value={tzSearch} onChange={e=>setTzSearch(e.target.value)}
              placeholder="Search…" style={{ background:"transparent", border:"none", color:t.text, fontSize:13, outline:"none", fontFamily:"inherit", width:"100%" }}/>
          </div>
          <div style={{ maxHeight:220, overflowY:"auto" }}>
            {filteredTz.map(tz => (
              <div key={tz} onClick={() => { update("timezone",tz); setTzOpen(false); setTzSearch(""); }}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 13px", cursor:"pointer", fontSize:13, color:t.text }}
                onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tz.replace(/_/g," ")}</span>
                {settings.timezone===tz && <Check size={12} style={{ color:t.accent, flexShrink:0, marginLeft:8 }}/>}
              </div>
            ))}
            {filteredTz.length===0 && <div style={{ padding:16, fontSize:13, color:t.muted, textAlign:"center" }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Panels
  // ─────────────────────────────────────────────────────────────────────────────
  const renderDateTime = () => (
    <>
      <PrefSection title="Time Zone" t={t}>
        <PrefRow last t={t}
          label="Time Zone"
          sub="Used for calendar events and scheduling"
          control={<TzPicker/>}
        />
      </PrefSection>

      <PrefSection title="Clock" t={t}>
        <PrefRow t={t} label="Time Format" sub="How times appear across the app"
          control={
            <Seg t={t} ease={ease} value={settings.timeFormat} onChange={v=>update("timeFormat",v)}
              options={[{label:"24-hour",value:"24h"},{label:"12-hour",value:"12h"}]}/>
          }
        />
        <PrefRow last t={t} label="Week Starts On"
          control={
            <Seg t={t} ease={ease} value={settings.weekStartsOn} onChange={v=>update("weekStartsOn",v)}
              options={[{label:"Sunday",value:0},{label:"Monday",value:1}]}/>
          }
        />
      </PrefSection>

      <PrefSection title="Currency" t={t}>
        <PrefRow last t={t}
          label="Display Currency"
          sub="Used for invoices, financials, and dashboard totals"
          control={
            <select
              value={settings.currency}
              onChange={(e)=>update("currency", e.target.value)}
              style={{
                padding:"7px 10px", borderRadius:8,
                border:`1px solid ${t.inputBorder}`, background:t.input,
                color:t.text, fontSize:13, fontWeight:500, outline:"none",
                cursor:"pointer", fontFamily:"inherit", minWidth:180,
              }}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol}  {c.code} — {c.label}</option>
              ))}
            </select>
          }
        />
      </PrefSection>

      <PrefSection title="Date Format" t={t}>
        {DATE_FORMATS.map((fmt,i) => (
          <div key={fmt.id} onClick={()=>update("dateFormat",fmt.id)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px",
              borderBottom:i<DATE_FORMATS.length-1?`1px solid ${t.divider}`:"none", cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.02)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
              <span style={{ fontSize:14, fontWeight:settings.dateFormat===fmt.id?600:500, color:t.text }}>{fmt.id}</span>
              <span style={{ fontSize:12, color:t.sub }}>{fmt.example}</span>
            </div>
            {settings.dateFormat===fmt.id && <Check size={14} style={{ color:t.accent }}/>}
          </div>
        ))}
      </PrefSection>
    </>
  );

  const renderIntegrations = () => (
    <>
      <PrefSection title="Calendar" t={t}>
        <div style={{ padding:"16px 16px 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <div style={{ width:40,height:40,borderRadius:11,background:"#fff",border:"1px solid rgba(0,0,0,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,fontWeight:600,color:t.text }}>Google Calendar</div>
              <div style={{ fontSize:12,color:gConnected?"#34C759":t.sub,marginTop:1 }}>
                {gConnected?"Connected — syncing events":"Not connected"}
              </div>
            </div>
            {gConnected && <CheckCircle size={17} style={{ color:"#34C759",flexShrink:0 }}/>}
          </div>
          {gConnected ? (
            <div style={{ display:"flex",gap:8 }}>
              <button style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"8px",borderRadius:10,border:`1px solid ${t.inputBorder}`,background:t.input,color:t.sub,fontSize:12,fontWeight:600,cursor:"pointer" }}>
                <RefreshCw size={12}/> Sync Now
              </button>
              <button onClick={disconnectGoogle} style={{ padding:"8px 14px",borderRadius:10,border:"1px solid rgba(255,59,48,0.2)",background:"rgba(255,59,48,0.05)",color:"#FF453A",fontSize:12,fontWeight:600,cursor:"pointer" }}>
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={connectGoogle} disabled={gConnecting}
              style={{ width:"100%",padding:"9px",borderRadius:10,border:"none",background:gConnecting?t.input:"#4285F4",color:gConnecting?t.muted:"#fff",fontSize:13,fontWeight:600,cursor:gConnecting?"wait":"pointer",fontFamily:"inherit" }}>
              {gConnecting?"Connecting…":"Connect Google Calendar"}
            </button>
          )}
        </div>
        <div style={{ borderTop:`1px solid ${t.divider}`, padding:"14px 16px", display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:40,height:40,borderRadius:11,background:"#00897B",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <Video size={20} color="#fff" strokeWidth={2}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14,fontWeight:600,color:t.text }}>Google Meet</div>
            <div style={{ fontSize:12,color:gConnected?"#34C759":t.sub,marginTop:1 }}>
              {gConnected?"Active — join links shown on events":"Requires Google Calendar"}
            </div>
          </div>
          {gConnected && <CheckCircle size={17} style={{ color:"#34C759" }}/>}
        </div>
      </PrefSection>

      <PrefSection title="Coming Soon" t={t}>
        {[
          {name:"Stripe",   sub:"Invoice payments",      bg:"#635BFF"},
          {name:"Xero",     sub:"Accounting & expenses", bg:"#13B5EA"},
          {name:"Notion",   sub:"Tasks & docs",           bg:dark?"#fff":"#000"},
        ].map((item,i,arr)=>(
          <div key={item.name} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<arr.length-1?`1px solid ${t.divider}`:"none",opacity:0.45 }}>
            <div style={{ width:34,height:34,borderRadius:9,background:item.bg,flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,fontWeight:600,color:t.text }}>{item.name}</div>
              <div style={{ fontSize:12,color:t.sub }}>{item.sub}</div>
            </div>
            <span style={{ fontSize:10,fontWeight:700,color:t.muted,background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:5,padding:"2px 7px" }}>SOON</span>
          </div>
        ))}
      </PrefSection>
    </>
  );

  const renderCRM = () => (
    <>
      <PrefSection title="Import Clients" t={t}>
        <div style={{ padding:"18px 16px" }}>
          <p style={{ fontSize:13,color:t.sub,marginBottom:16,lineHeight:1.6 }}>
            Upload a CSV file to import clients into your CRM. Supported columns: Name, Email, Phone, Company, Value.
          </p>

          {/* Drop zone */}
          {!csvData && (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer.files?.[0]; if(f){fileRef.current.files=e.dataTransfer.files; onFileChange({target:{files:e.dataTransfer.files}});} }}
              style={{ border:`2px dashed ${t.inputBorder}`, borderRadius:14, padding:"32px 20px", textAlign:"center", cursor:"pointer", transition:ease }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=t.accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=t.inputBorder}
            >
              <Upload size={28} style={{ color:t.muted, marginBottom:10 }}/>
              <div style={{ fontSize:14,fontWeight:600,color:t.text,marginBottom:4 }}>Drop CSV file here</div>
              <div style={{ fontSize:12,color:t.sub }}>or click to browse</div>
              <input ref={fileRef} type="file" accept=".csv" onChange={onFileChange} style={{ display:"none" }}/>
            </div>
          )}

          {/* File loaded — column mapping */}
          {csvData && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:600,color:t.text }}>{csvFile?.name}</div>
                  <div style={{ fontSize:12,color:t.sub,marginTop:1 }}>{csvData.rows.length} rows · {csvData.headers.length} columns</div>
                </div>
                <button onClick={()=>{setCsvFile(null);setCsvData(null);setColMap({});setImportDone(null);setImportErr(null);}}
                  style={{ width:26,height:26,borderRadius:7,border:`1px solid ${t.inputBorder}`,background:t.input,color:t.sub,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                  <X size={11}/>
                </button>
              </div>

              {/* Column mapping */}
              <div style={{ background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:12,overflow:"hidden",marginBottom:14 }}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",padding:"8px 12px",borderBottom:`1px solid ${t.divider}` }}>
                  <span style={{ fontSize:11,fontWeight:700,color:t.muted,letterSpacing:0.6,textTransform:"uppercase" }}>Nomaad Field</span>
                  <span style={{ fontSize:11,fontWeight:700,color:t.muted,letterSpacing:0.6,textTransform:"uppercase" }}>CSV Column</span>
                </div>
                {CRM_FIELDS.map((field,i)=>(
                  <div key={field.id} style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:"9px 12px",borderBottom:i<CRM_FIELDS.length-1?`1px solid ${t.divider}`:"none",alignItems:"center" }}>
                    <div style={{ fontSize:13,fontWeight:field.required?600:500,color:t.text }}>
                      {field.label}{field.required&&<span style={{ color:"#FF453A",marginLeft:3 }}>*</span>}
                    </div>
                    <select value={colMap[field.id]||""} onChange={e=>setColMap(p=>({...p,[field.id]:e.target.value||undefined}))}
                      style={{ background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:7,padding:"4px 8px",color:colMap[field.id]?t.text:t.muted,fontSize:12,outline:"none",fontFamily:"inherit",cursor:"pointer",width:"100%" }}>
                      <option value="">— skip —</option>
                      {csvData.headers.map(h=><option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              {csvData.rows.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:t.muted,letterSpacing:0.6,textTransform:"uppercase",marginBottom:6 }}>Preview (first 3 rows)</div>
                  <div style={{ background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:10,overflow:"hidden",fontSize:12 }}>
                    {csvData.rows.slice(0,3).map((row,i)=>(
                      <div key={i} style={{ display:"flex",gap:16,padding:"7px 12px",borderBottom:i<2&&i<csvData.rows.length-1?`1px solid ${t.divider}`:"none",flexWrap:"wrap" }}>
                        {CRM_FIELDS.filter(f=>colMap[f.id]).map(f=>(
                          <span key={f.id} style={{ color:t.text }}>
                            <span style={{ color:t.muted }}>{f.label}: </span>
                            {row[colMap[f.id]]||"—"}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import button */}
              {importErr && (
                <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,background:"rgba(255,59,48,0.06)",border:"1px solid rgba(255,59,48,0.18)",marginBottom:12 }}>
                  <AlertCircle size={14} style={{ color:"#FF453A",flexShrink:0 }}/>
                  <span style={{ fontSize:13,color:"#FF453A" }}>{importErr}</span>
                </div>
              )}

              <button onClick={runImport} disabled={importing||!colMap.name}
                style={{ width:"100%",padding:"11px",borderRadius:12,border:"none",
                  background: (!colMap.name||importing)?t.input:"linear-gradient(135deg,#ccfd01,#b8e300)",
                  color:(!colMap.name||importing)?t.muted:"#0a0a0a",
                  fontSize:14,fontWeight:700,cursor:(!colMap.name||importing)?"not-allowed":"pointer",fontFamily:"inherit" }}>
                {importing ? "Importing…" : `Import ${csvData.rows.length} clients`}
              </button>
            </div>
          )}

          {/* Success */}
          {importDone!=null && (
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,background:"rgba(52,199,89,0.08)",border:"1px solid rgba(52,199,89,0.25)",marginTop:12 }}>
              <CheckCircle size={16} style={{ color:"#34C759",flexShrink:0 }}/>
              <span style={{ fontSize:13,fontWeight:600,color:"#34C759" }}>{importDone} clients imported successfully</span>
            </div>
          )}
        </div>
      </PrefSection>

      <PrefSection title="Export" t={t}>
        <PrefRow last t={t} label="Export Clients as CSV" sub="Download all your CRM contacts"
          control={
            <button
              onClick={async () => {
                if (!user) return;
                const { data } = await supabase.from("customers").select("*").eq("user_id", user.id);
                if (!data?.length) return;
                const keys = ["name","email","phone","company","status","value"];
                const csv  = [keys.join(","), ...data.map(r => keys.map(k => `"${(r[k]||"").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
                a.download = "nomaad-clients.csv"; a.click();
              }}
              style={{ padding:"6px 14px",borderRadius:9,border:`1px solid ${t.inputBorder}`,background:t.input,color:t.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
              Export CSV
            </button>
          }
        />
      </PrefSection>
    </>
  );

  const renderProfile = () => {
    const name    = profile?.full_name || user?.user_metadata?.full_name || "—";
    const email   = user?.email || "—";
    const initials = name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "?";
    return (
      <>
        <PrefSection title="Account" t={t}>
          <div style={{ padding:"20px 16px", display:"flex",alignItems:"center",gap:16,borderBottom:`1px solid ${t.divider}` }}>
            <div style={{ width:58,height:58,borderRadius:29,background:"linear-gradient(135deg,#ccfd01,#b8e300)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"#0a0a0a",flexShrink:0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize:18,fontWeight:700,color:t.text,letterSpacing:-0.3 }}>{name}</div>
              <div style={{ fontSize:13,color:t.sub,marginTop:2 }}>{email}</div>
            </div>
          </div>
          <PrefRow t={t} label="Full Name"  control={<span style={{ fontSize:13,color:t.sub }}>{name}</span>}/>
          <PrefRow last t={t} label="Email" control={<span style={{ fontSize:13,color:t.sub }}>{email}</span>}/>
        </PrefSection>
        <PrefSection t={t}>
          <div style={{ padding:"12px 16px" }}>
            <button onClick={signOut} style={{ width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(255,59,48,0.22)",background:"rgba(255,59,48,0.05)",color:"#FF453A",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
              Sign Out
            </button>
          </div>
        </PrefSection>
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN
  // ─────────────────────────────────────────────────────────────────────────────
  const activeMeta = CATS.find(c=>c.id===activeCat);
  const visibleCats = search ? CATS.filter(c=>c.label.toLowerCase().includes(search.toLowerCase())) : CATS;

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>

      {/* ── Left sidebar ── */}
      <div style={{ width:210, flexShrink:0, display:"flex", flexDirection:"column", paddingRight:14, overflowY:"auto" }}>
        {/* Search bar */}
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 10px", borderRadius:10,
          background:t.input, border:`1px solid ${t.inputBorder}`, marginBottom:16 }}>
          <Search size={12} style={{ color:t.muted, flexShrink:0 }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search settings…"
            style={{ background:"transparent", border:"none", color:t.text, fontSize:13, outline:"none", fontFamily:"inherit", width:"100%" }}/>
        </div>

        {/* Category list */}
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {visibleCats.map(cat => {
            const active = activeCat===cat.id;
            return (
              <button key={cat.id} onClick={()=>{ setActiveCat(cat.id); setSearch(""); }}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"7px 9px",
                  borderRadius:10, border:"none", cursor:"pointer", transition:ease, textAlign:"left",
                  background: active
                    ? (dark?"rgba(255,255,255,0.075)":"rgba(0,0,0,0.06)")
                    : "transparent" }}>
                <div style={{ width:32, height:32, borderRadius:8, background:cat.iconBg, flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:`0 2px 8px ${cat.iconShadow}` }}>
                  {cat.icon}
                </div>
                <span style={{ fontSize:13, fontWeight:active?600:500, color:active?t.text:t.sub }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex:1, overflowY:"auto", paddingLeft:28, minWidth:0 }}>
        {/* Header — just text, Apple style */}
        <div style={{ marginBottom:26, paddingBottom:18, borderBottom:`1px solid ${t.divider}` }}>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:-0.4, color:t.text, margin:0 }}>
            {activeMeta?.meta.title}
          </h1>
          <p style={{ fontSize:13, color:t.sub, marginTop:4, lineHeight:1.5 }}>
            {activeMeta?.meta.sub}
          </p>
        </div>

        {activeCat==="datetime"     && renderDateTime()}
        {activeCat==="integrations" && renderIntegrations()}
        {activeCat==="crm"          && renderCRM()}
        {activeCat==="profile"      && renderProfile()}
      </div>
    </div>
  );
}
