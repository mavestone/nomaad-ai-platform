import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Search, Check, ChevronRight, RefreshCw, CheckCircle, Globe, Clock, Plug, User, Video } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Settings persistence — exported so other views can read them
// ─────────────────────────────────────────────────────────────────────────────
const SETTINGS_KEY = "nomaad_settings";
export const getSettings = () => {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; }
  catch { return { ...DEFAULT_SETTINGS }; }
};
const DEFAULT_SETTINGS = {
  timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  timeFormat:   "24h",
  dateFormat:   "DD/MM/YYYY",
  weekStartsOn: 1,
};
const persist = (patch) => {
  const next = { ...getSettings(), ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
};

// ─── Date format options ──────────────────────────────────────────────────────
const DATE_FORMATS = [
  { id: "DD/MM/YYYY",    example: "16/04/2026" },
  { id: "MM/DD/YYYY",    example: "04/16/2026" },
  { id: "YYYY-MM-DD",    example: "2026-04-16" },
  { id: "D MMM YYYY",    example: "16 Apr 2026" },
  { id: "MMMM D, YYYY",  example: "April 16, 2026" },
  { id: "DD.MM.YYYY",    example: "16.04.2026" },
];

// ─── Setting categories ────────────────────────────────────────────────────
const CATS = [
  { id: "datetime",     label: "Date & Time",   bg: "#4285F4", icon: <Clock size={16} strokeWidth={2} color="#fff"/> },
  { id: "integrations", label: "Integrations",  bg: "#34C759", icon: <Plug  size={16} strokeWidth={2} color="#fff"/> },
  { id: "profile",      label: "Profile",        bg: "#FF9500", icon: <User  size={16} strokeWidth={2} color="#fff"/> },
];
const CAT_META = {
  datetime:     { title: "Date & Time",  sub: "Manage time zone, clock format, and how dates appear across Nomaad." },
  integrations: { title: "Integrations", sub: "Connect external services and manage account links." },
  profile:      { title: "Profile",      sub: "Your account name, email, and avatar." },
};

// ─── Segmented control ─────────────────────────────────────────────────────
function Seg({ options, value, onChange, t, ease }) {
  return (
    <div style={{ display:"flex", background:t.input, borderRadius:9, border:`1px solid ${t.inputBorder}`, padding:2 }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          style={{ padding:"4px 13px", borderRadius:7, border:"none", fontSize:12, fontWeight:600, cursor:"pointer", transition:ease, fontFamily:"inherit",
            background: value===opt.value ? (t.input==="rgba(255,255,255,0.04)"?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.07)") : "transparent",
            color: value===opt.value ? t.text : t.muted }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────
function Row({ label, sub, control, last, t }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16,
      padding:"13px 16px", borderBottom: last ? "none" : `1px solid ${t.divider}` }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:500, color:t.text }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:t.sub, marginTop:1 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink:0 }}>{control}</div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────
function Section({ title, children, t }) {
  return (
    <div style={{ marginBottom:22 }}>
      {title && <div style={{ fontSize:11, fontWeight:700, color:t.muted, letterSpacing:0.7, textTransform:"uppercase", marginBottom:8, paddingLeft:2 }}>{title}</div>}
      <div style={{ background:t.card, border:`1px solid ${t.cardBorder}`, borderRadius:14, overflow:"hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsView({ t, dark, mobile, compact }) {
  const { user, profile, signOut } = useAuth();
  const ease = "all 0.18s cubic-bezier(.4,0,.2,1)";

  const [activeCat, setActiveCat]   = useState("datetime");
  const [search, setSearch]         = useState("");
  const [settings, setSettings]     = useState(getSettings);
  const [gConnecting, setGConnecting] = useState(false);
  const [gConnected, setGConnected]   = useState(() => !!localStorage.getItem("gCalToken"));
  const [tzSearch, setTzSearch]     = useState("");
  const [tzOpen, setTzOpen]         = useState(false);

  const update = (key, value) => {
    const next = persist({ [key]: value });
    setSettings(next);
  };

  // All IANA timezones
  const allTimezones = useMemo(() => {
    try { return Intl.supportedValuesOf("timeZone"); } catch { return ["UTC"]; }
  }, []);

  const filteredTz = useMemo(() => {
    if (!tzSearch) return allTimezones;
    const q = tzSearch.toLowerCase().replace(/\s/g,"_");
    return allTimezones.filter(tz => tz.toLowerCase().includes(q) || tz.toLowerCase().replace(/_/g," ").includes(tzSearch.toLowerCase()));
  }, [allTimezones, tzSearch]);

  // Close tz dropdown on outside click
  useEffect(() => {
    if (!tzOpen) return;
    const h = (e) => { if (!e.target.closest("[data-tz-picker]")) setTzOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [tzOpen]);

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const loadGsi = () => new Promise(res => {
    if (window.google?.accounts?.oauth2) { res(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = res;
    document.head.appendChild(s);
  });

  const connectGoogle = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) { alert("VITE_GOOGLE_CLIENT_ID not set."); return; }
    setGConnecting(true);
    await loadGsi();
    window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: (resp) => {
        setGConnecting(false);
        if (resp.access_token) { localStorage.setItem("gCalToken", resp.access_token); setGConnected(true); }
      },
      error_callback: () => setGConnecting(false),
    }).requestAccessToken();
  };

  const disconnectGoogle = () => {
    localStorage.removeItem("gCalToken");
    setGConnected(false);
  };

  // ── Timezone picker ─────────────────────────────────────────────────────────
  const renderTzPicker = () => (
    <div data-tz-picker style={{ position:"relative" }}>
      <button onClick={() => setTzOpen(v=>!v)}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:9, border:`1px solid ${t.inputBorder}`, background:t.input, color:t.text, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit", maxWidth:240 }}>
        <Globe size={13} style={{ color:t.muted, flexShrink:0 }}/>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{settings.timezone.replace(/_/g," ")}</span>
        <ChevronRight size={11} style={{ color:t.muted, transform:tzOpen?"rotate(90deg)":"rotate(0deg)", transition:ease, flexShrink:0, marginLeft:2 }}/>
      </button>

      {tzOpen && (
        <div style={{ position:"absolute", right:0, top:"calc(100% + 6px)", width:280, zIndex:200,
          background: dark?"rgba(20,20,24,0.98)":"rgba(252,251,249,0.98)",
          border:`1px solid ${t.cardBorder}`, borderRadius:14,
          boxShadow: dark?"0 16px 48px rgba(0,0,0,0.5)":"0 16px 48px rgba(0,0,0,0.12)",
          backdropFilter:"blur(32px)", overflow:"hidden" }}>
          {/* Search */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderBottom:`1px solid ${t.divider}` }}>
            <Search size={13} style={{ color:t.muted, flexShrink:0 }}/>
            <input autoFocus value={tzSearch} onChange={e=>setTzSearch(e.target.value)}
              placeholder="Search timezone..." style={{ background:"transparent", border:"none", color:t.text, fontSize:13, outline:"none", fontFamily:"inherit", width:"100%" }}/>
          </div>
          {/* List */}
          <div style={{ maxHeight:240, overflowY:"auto" }}>
            {filteredTz.map(tz => (
              <div key={tz} onClick={() => { update("timezone", tz); setTzOpen(false); setTzSearch(""); }}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 14px", cursor:"pointer", fontSize:13, color:t.text, transition:ease }}
                onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tz.replace(/_/g," ")}</span>
                {settings.timezone===tz && <Check size={12} style={{ color:t.accent, flexShrink:0, marginLeft:8 }}/>}
              </div>
            ))}
            {filteredTz.length===0 && <div style={{ padding:"16px", fontSize:13, color:t.muted, textAlign:"center" }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Panel: Date & Time
  // ─────────────────────────────────────────────────────────────────────────────
  const renderDateTime = () => (
    <>
      <Section title="Time Zone" t={t}>
        <Row last t={t}
          label="Time Zone"
          sub={`Current: ${settings.timezone.replace(/_/g," ")}`}
          control={renderTzPicker()}
        />
      </Section>

      <Section title="Clock" t={t}>
        <Row t={t}
          label="Time Format"
          sub="How times appear across the app"
          control={
            <Seg t={t} ease={ease} value={settings.timeFormat} onChange={v=>update("timeFormat",v)}
              options={[{ label:"24h", value:"24h" },{ label:"12h", value:"12h" }]}/>
          }
        />
        <Row last t={t}
          label="Week Starts On"
          control={
            <Seg t={t} ease={ease} value={settings.weekStartsOn} onChange={v=>update("weekStartsOn",v)}
              options={[{ label:"Sunday", value:0 },{ label:"Monday", value:1 }]}/>
          }
        />
      </Section>

      <Section title="Date Format" t={t}>
        {DATE_FORMATS.map((fmt, i) => (
          <div key={fmt.id} onClick={() => update("dateFormat", fmt.id)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 16px",
              borderBottom: i<DATE_FORMATS.length-1 ? `1px solid ${t.divider}` : "none",
              cursor:"pointer", transition:ease }}
            onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.02)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
              <span style={{ fontSize:14, fontWeight: settings.dateFormat===fmt.id ? 600 : 500, color:t.text }}>{fmt.id}</span>
              <span style={{ fontSize:12, color:t.sub }}>{fmt.example}</span>
            </div>
            {settings.dateFormat===fmt.id && <Check size={14} style={{ color:t.accent }}/>}
          </div>
        ))}
      </Section>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Panel: Integrations
  // ─────────────────────────────────────────────────────────────────────────────
  const renderIntegrations = () => (
    <>
      <Section title="Calendar" t={t}>
        {/* Google Calendar */}
        <div style={{ padding:"16px", borderBottom:`1px solid ${t.divider}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom: gConnected ? 12 : 14 }}>
            {/* Google G icon */}
            <div style={{ width:38, height:38, borderRadius:10, background:"#fff", border:"1px solid rgba(0,0,0,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:600, color:t.text }}>Google Calendar</div>
              <div style={{ fontSize:12, color: gConnected ? "#34C759" : t.sub, marginTop:1 }}>
                {gConnected ? "Connected — events syncing to calendar" : "Not connected"}
              </div>
            </div>
            {gConnected && <CheckCircle size={16} style={{ color:"#34C759", flexShrink:0 }}/>}
          </div>

          {gConnected ? (
            <div style={{ display:"flex", gap:8 }}>
              <button
                onClick={() => { /* trigger sync — just reload token */ const tok=localStorage.getItem("gCalToken"); if(tok) alert("Sync triggered — navigate to Calendar to see events."); }}
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px", borderRadius:10,
                  border:`1px solid ${t.inputBorder}`, background:t.input, color:t.sub, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                <RefreshCw size={12}/> Sync Now
              </button>
              <button onClick={disconnectGoogle}
                style={{ padding:"8px 14px", borderRadius:10, border:"1px solid rgba(255,59,48,0.2)", background:"rgba(255,59,48,0.05)",
                  color:"#FF453A", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={connectGoogle} disabled={gConnecting}
              style={{ width:"100%", padding:"9px", borderRadius:10, border:"none",
                background: gConnecting ? t.input : "#4285F4", color: gConnecting ? t.muted : "#fff",
                fontSize:13, fontWeight:600, cursor: gConnecting ? "wait" : "pointer", fontFamily:"inherit" }}>
              {gConnecting ? "Connecting…" : "Connect Google Calendar"}
            </button>
          )}
        </div>

        {/* Google Meet */}
        <div style={{ padding:"16px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"#00897B", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Video size={18} color="#fff" strokeWidth={2}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:t.text }}>Google Meet</div>
            <div style={{ fontSize:12, color:t.sub, marginTop:1 }}>
              {gConnected ? "Active — Join links appear on calendar events" : "Connect Google Calendar to enable"}
            </div>
          </div>
          {gConnected && <CheckCircle size={16} style={{ color:"#34C759" }}/>}
        </div>
      </Section>

      {/* Coming soon */}
      <Section title="Coming Soon" t={t}>
        {[
          { name:"Stripe", sub:"Sync invoices and payments", bg:"#635BFF" },
          { name:"Xero",   sub:"Accounting and expenses",    bg:"#13B5EA" },
          { name:"Notion", sub:"Sync tasks and docs",        bg:dark?"#fff":"#1a1a1a" },
        ].map((item, i, arr) => (
          <div key={item.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
            borderBottom: i<arr.length-1?`1px solid ${t.divider}`:"none", opacity:0.45 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:item.bg, flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:t.text }}>{item.name}</div>
              <div style={{ fontSize:12, color:t.sub }}>{item.sub}</div>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:t.muted, background:t.input, border:`1px solid ${t.inputBorder}`, borderRadius:6, padding:"2px 8px" }}>SOON</span>
          </div>
        ))}
      </Section>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Panel: Profile
  // ─────────────────────────────────────────────────────────────────────────────
  const renderProfile = () => {
    const name  = profile?.full_name || user?.user_metadata?.full_name || "—";
    const email = user?.email || "—";
    const initials = name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "?";

    return (
      <>
        <Section title="Account" t={t}>
          {/* Avatar + name */}
          <div style={{ padding:"20px 16px 16px", display:"flex", alignItems:"center", gap:16, borderBottom:`1px solid ${t.divider}` }}>
            <div style={{ width:56, height:56, borderRadius:28, background:`linear-gradient(135deg,#ccfd01,#b8e300)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#0a0a0a", flexShrink:0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:t.text, letterSpacing:-0.3 }}>{name}</div>
              <div style={{ fontSize:13, color:t.sub, marginTop:2 }}>{email}</div>
            </div>
          </div>

          <Row t={t} label="Full Name"  control={<span style={{ fontSize:13, color:t.sub }}>{name}</span>} />
          <Row t={t} label="Email"      control={<span style={{ fontSize:13, color:t.sub }}>{email}</span>} last />
        </Section>

        <Section title="Account Actions" t={t}>
          <div style={{ padding:"12px 16px" }}>
            <button onClick={signOut}
              style={{ width:"100%", padding:"10px", borderRadius:10, border:"1px solid rgba(255,59,48,0.2)", background:"rgba(255,59,48,0.05)", color:"#FF453A", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              Sign Out
            </button>
          </div>
        </Section>
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  const meta = CAT_META[activeCat];
  const filteredCats = CATS.filter(c => !search || c.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:"flex", height:"100%", gap:0, overflow:"hidden" }}>

      {/* ── Left sidebar ── */}
      <div style={{ width:220, flexShrink:0, display:"flex", flexDirection:"column", paddingRight:16, overflowY:"auto" }}>
        {/* Search */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:10,
          background:t.input, border:`1px solid ${t.inputBorder}`, marginBottom:14 }}>
          <Search size={13} style={{ color:t.muted, flexShrink:0 }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search settings…"
            style={{ background:"transparent", border:"none", color:t.text, fontSize:13, outline:"none", fontFamily:"inherit", width:"100%" }}/>
        </div>

        {/* Category list */}
        {filteredCats.map(cat => {
          const active = activeCat===cat.id;
          return (
            <button key={cat.id} onClick={()=>{ setActiveCat(cat.id); setSearch(""); }}
              style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"7px 9px", borderRadius:10, border:"none",
                background: active ? (dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.055)") : "transparent",
                cursor:"pointer", marginBottom:3, transition:ease, textAlign:"left" }}>
              <div style={{ width:30, height:30, borderRadius:8, background:cat.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 2px 8px ${cat.bg}44` }}>
                {cat.icon}
              </div>
              <span style={{ fontSize:13, fontWeight: active ? 600 : 500, color: active ? t.text : t.sub }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex:1, overflowY:"auto", paddingLeft:24, minWidth:0 }}>

        {/* Panel header */}
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28, paddingBottom:20, borderBottom:`1px solid ${t.divider}` }}>
          <div style={{ width:56, height:56, borderRadius:16, background: CATS.find(c=>c.id===activeCat)?.bg,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            boxShadow:`0 4px 20px ${CATS.find(c=>c.id===activeCat)?.bg}44` }}>
            {/* Larger icon for header */}
            {activeCat==="datetime"     && <Clock size={26} color="#fff" strokeWidth={1.8}/>}
            {activeCat==="integrations" && <Plug  size={26} color="#fff" strokeWidth={1.8}/>}
            {activeCat==="profile"      && <User  size={26} color="#fff" strokeWidth={1.8}/>}
          </div>
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:-0.5, color:t.text, margin:0 }}>{meta.title}</h1>
            <p style={{ fontSize:13, color:t.sub, marginTop:3 }}>{meta.sub}</p>
          </div>
        </div>

        {/* Panel content */}
        {activeCat==="datetime"     && renderDateTime()}
        {activeCat==="integrations" && renderIntegrations()}
        {activeCat==="profile"      && renderProfile()}
      </div>
    </div>
  );
}
