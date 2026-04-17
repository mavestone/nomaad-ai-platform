import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  Plus, ChevronLeft, ChevronRight, X, Trash2, Edit3, Briefcase,
  Users, Coffee, Camera, Clock, Zap, Activity, Target, PanelRight,
  AlignLeft, LayoutGrid, Video, Plane, MapPin, Bell, RefreshCw,
  FileText, ChevronDown, Calendar as CalIcon, CheckCircle,
} from "lucide-react";
import {
  format, addDays, startOfWeek, startOfMonth, endOfMonth,
  isSameDay, startOfDay, addMinutes, eachDayOfInterval,
  getDay, addMonths, subMonths,
} from "date-fns";

// ─── Grid geometry ────────────────────────────────────────────────────────────
const S_HR = 6;
const E_HR = 23;
const HH = 64; // px per hour
const GRID_H = (E_HR - S_HR) * HH;
const SNAP = 0.25;
const HOURS = Array.from({ length: E_HR - S_HR }, (_, i) => i + S_HR);

const fmt24  = (hr) => { const h = Math.floor(hr), m = Math.round((hr - h) * 60); return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; };
const fmtDur = (hrs) => { const h = Math.floor(hrs), m = Math.round((hrs - h) * 60); if (h === 0) return `${m}m`; if (m === 0) return `${h}h`; return `${h}h ${m}m`; };
const snap   = (hr) => Math.round(hr / SNAP) * SNAP;
const hexRgb = (hex) => { if (!hex || !hex.startsWith("#")) return "255,255,255"; const c = parseInt(hex.slice(1), 16); return `${(c>>16)&255},${(c>>8)&255},${c&255}`; };

// ─── Categories ───────────────────────────────────────────────────────────────
const CATS = {
  Shoot:    { color: "#ccfd01", text: "#1a1a1f", bg: "rgba(204,253,1,0.12)",   icon: <Camera  size={11} strokeWidth={2.5}/> },
  Edit:     { color: "#5AC8FA", text: "#fff",    bg: "rgba(90,200,250,0.12)",  icon: <Edit3   size={11} strokeWidth={2.5}/> },
  Admin:    { color: "#AF52DE", text: "#fff",    bg: "rgba(175,82,222,0.12)",  icon: <Briefcase size={11} strokeWidth={2.5}/> },
  Meeting:  { color: "#FFB340", text: "#1a1a1f", bg: "rgba(255,179,64,0.12)",  icon: <Users   size={11} strokeWidth={2.5}/> },
  Personal: { color: "#34C759", text: "#fff",    bg: "rgba(52,199,89,0.12)",   icon: <Coffee  size={11} strokeWidth={2.5}/> },
};
const CAT_LIST = Object.keys(CATS);

// ─── Templates (serialisable — icons derived from CATS at render time) ────────
const DEFAULT_TEMPLATES = [
  { id: "t-deep",    name: "Deep Work",    dur: 120, cat: "Edit" },
  { id: "t-shallow", name: "Shallow Work", dur: 30,  cat: "Admin" },
  { id: "t-call",    name: "Client Call",  dur: 30,  cat: "Meeting" },
  { id: "t-shoot",   name: "Shoot Day",    dur: 480, cat: "Shoot" },
  { id: "t-edit",    name: "Edit Session", dur: 180, cat: "Edit" },
  { id: "t-travel",  name: "Travel",       dur: 120, cat: "Personal" },
  { id: "t-workout", name: "Workout",      dur: 45,  cat: "Personal" },
  { id: "t-meal",    name: "Meal",         dur: 30,  cat: "Personal" },
  { id: "t-buffer",  name: "Buffer",       dur: 15,  cat: "Admin" },
];

// INBOX_TASKS is now state
const PRI = { high: "#FF3B30", medium: "#FFB340", low: "#34C759" };

// ─── NL parser (stubs to Claude API Phase 2) ──────────────────────────────────
function parseNL(text) {
  let cat = "Meeting";
  if (/shoot|location|on-?site/i.test(text)) cat = "Shoot";
  else if (/edit|cut|grade|colour|color|render/i.test(text)) cat = "Edit";
  else if (/invoice|admin|email|send/i.test(text)) cat = "Admin";
  else if (/gym|workout|run|yoga|personal|meal/i.test(text)) cat = "Personal";
  let startHr = 9;
  const tm = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?=\s|$)/i);
  if (tm) {
    startHr = parseInt(tm[1]);
    const mn = parseInt(tm[2] || "0");
    const ap = (tm[3] || "").toLowerCase();
    if (ap === "pm" && startHr < 12) startHr += 12;
    if (ap === "am" && startHr === 12) startHr = 0;
    startHr += mn / 60;
  }
  let durMins = 60;
  const dh = text.match(/(\d+)\s*(?:h|hr|hours?)/i); if (dh) durMins = parseInt(dh[1]) * 60;
  const dm = text.match(/(\d+)\s*(?:m|min|minutes?)/i); if (dm) durMins = parseInt(dm[1]);
  const toM = text.match(/\bto\s+(\d{1,2})\s*(am|pm)/i);
  if (toM) { let eH = parseInt(toM[1]); if ((toM[2]||"").toLowerCase()==="pm"&&eH<12) eH+=12; durMins = Math.max(30,(eH-startHr)*60); }
  let date = new Date();
  if (/tomorrow/i.test(text)) date = addDays(new Date(),1);
  const dm2={monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6,sun:0};
  for (const [k,v] of Object.entries(dm2)) { if (new RegExp(`\\b${k}\\b`,"i").test(text)){ const diff=(v-new Date().getDay()+7)%7||7; date=addDays(new Date(),diff); break; } }
  const title = text.replace(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi,"").replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi,"").replace(/\bto\s+\d+(am|pm)\b/gi,"").replace(/\b\d+(h|hr|hours?|m|min|minutes?)\b/gi,"").replace(/\s+/g," ").trim()||text;
  return { title, cat, startDate: date, startHr: snap(Math.max(S_HR,Math.min(E_HR-0.5,startHr))), endHr: snap(Math.max(S_HR+0.5,Math.min(E_HR,startHr+durMins/60))) };
}

// ─── Persist helpers ──────────────────────────────────────────────────────────
const lsGet = (k, fallback) => { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : fallback; } catch { return fallback; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ─────────────────────────────────────────────────────────────────────────────
export default function CalendarView({ t, dark, mobile, compact }) {
  const { user } = useAuth();
  const VOLT = "#ccfd01";

  // ── Persisted state (survives tab switches) ────────────────────────────────
  const [view, setViewRaw]               = useState(() => lsGet("cal_view","week"));
  const [currentDate, setCurrentDateRaw] = useState(() => { const s=lsGet("cal_date",null); return s ? new Date(s) : new Date(); });
  const [railOpen, setRailOpenRaw]       = useState(() => lsGet("cal_rail", !mobile));
  const [railTab, setRailTabRaw]         = useState(() => lsGet("cal_railtab","calendars"));

  const setView        = (v) => { lsSet("cal_view",v);              setViewRaw(v); };
  const setCurrentDate = (d) => { lsSet("cal_date",d.toISOString()); setCurrentDateRaw(d); };
  const setRailOpen    = (v) => { const val=typeof v==="function"?v(railOpen):v; lsSet("cal_rail",val); setRailOpenRaw(val); };
  const setRailTab     = (v) => { lsSet("cal_railtab",v); setRailTabRaw(v); };

  // ── Core state ──────────────────────────────────────────────────────────────
  const [blocks, setBlocks]           = useState([]);
  const [inboxTasks, setInboxTasks]   = useState([]);
  const [selectedCat]                 = useState("Edit");
  const [scheduled, setScheduled]     = useState(new Set());

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [eventPanel, setEventPanel]   = useState(null); // { block, mode: 'create'|'edit' }
  const [quickOpen, setQuickOpen]     = useState(false);
  const [quickText, setQuickText]     = useState("");
  const [parsed, setParsed]           = useState(null);
  const [ctxMenu, setCtxMenu]         = useState(null);
  const [gConnecting, setGConnecting] = useState(false);
  const [gConnected, setGConnected]   = useState(() => !!localStorage.getItem("gCalToken"));

  // ── Templates (user-editable, persisted) ────────────────────────────────────
  const [userTemplates, setUserTemplates] = useState(() => lsGet("cal_user_tpls", DEFAULT_TEMPLATES));
  const [newTplForm, setNewTplForm]       = useState(null); // null | { name, dur, cat }

  // ── Current time ──────────────────────────────────────────────────────────
  const [nowHr, setNowHr] = useState(() => { const n=new Date(); return n.getHours()+n.getMinutes()/60; });
  useEffect(() => { const id=setInterval(()=>{ const n=new Date(); setNowHr(n.getHours()+n.getMinutes()/60); },60000); return ()=>clearInterval(id); },[]);

  // ── Ghost (drag preview) ──────────────────────────────────────────────────
  const [ghost, setGhostRaw]   = useState(null);
  const ghostRef               = useRef(null);
  const setGhost = useCallback((g) => { ghostRef.current = g; setGhostRaw(g); }, []);

  // ── Computed dates ────────────────────────────────────────────────────────
  const weekStart = useMemo(() => startOfWeek(currentDate,{weekStartsOn:1}), [currentDate]);
  const weekDays  = useMemo(() => Array.from({length:7},(_,i)=>addDays(weekStart,i)), [weekStart]);
  const weekDRef  = useRef(weekDays);
  useEffect(() => { weekDRef.current = weekDays; }, [weekDays]);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef = useRef(null);
  const drag    = useRef({ type: null });

  // ── Scroll to now on mount / view change ─────────────────────────────────
  useEffect(() => { setTimeout(()=>{ if(gridRef.current) gridRef.current.scrollTop=Math.max(0,(nowHr-S_HR-1.5)*HH); }, 50); }, [view]);

  // ─── Supabase ─────────────────────────────────────────────────────────────
  const fetchBlocks = useCallback(async () => {
    if (!user) return;
    let from, to;
    if (view==="month") { from=startOfMonth(currentDate); to=endOfMonth(currentDate); }
    else if (view==="day") { from=startOfDay(currentDate); to=addDays(from,1); }
    else { from=weekStart; to=addDays(weekStart,7); }
    
    const [eventsRes, tasksRes] = await Promise.all([
      supabase.from("calendar_events").select("*").gte("start_time",from.toISOString()).lt("start_time",to.toISOString()),
      supabase.from("tasks").select("id,title,priority,project_id").eq("status", "todo")
    ]);
    
    if (eventsRes.data) {
      setBlocks(prev => {
        const google = prev.filter(b=>b.source==="google");
        const fresh = eventsRes.data.map(d=>{ const s=new Date(d.start_time),e=new Date(d.end_time); return { id:d.id,title:d.title,cat:d.type?(d.type.charAt(0).toUpperCase()+d.type.slice(1)):"Edit",startDate:s,startHr:s.getHours()+s.getMinutes()/60,endHr:e.getHours()+e.getMinutes()/60,source:"nomaad" }; });
        return [...fresh,...google];
      });
    }
    
    if (tasksRes.data) {
      setInboxTasks(tasksRes.data.map((t, i) => ({
        id: t.id,
        title: t.title,
        project: "Project", // We can fetch project name in a more advanced query if needed
        pri: t.priority === "urgent" || t.priority === "high" ? "high" : t.priority === "low" ? "low" : "medium",
        dur: 60,
        cat: "Edit"
      })));
    }
  }, [user, view, currentDate, weekStart]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const saveBlock = async (b) => {
    if (!user) return;
    const day = b.startDate || new Date();
    const sTime = addMinutes(startOfDay(day), b.startHr*60).toISOString();
    const eTime = addMinutes(startOfDay(day), b.endHr*60).toISOString();
    const payload = { user_id:user.id, title:b.title, start_time:sTime, end_time:eTime, type:(b.cat||"edit").toLowerCase() };
    if (b.id && String(b.id).length > 10 && !b.id.startsWith("tmp-")) {
      await supabase.from("calendar_events").update({ title:b.title,start_time:sTime,end_time:eTime,type:payload.type }).eq("id",b.id);
    } else {
      const {data} = await supabase.from("calendar_events").insert([payload]).select().single();
      if (data) setBlocks(prev=>prev.map(x=>x.id===b.id?{...x,id:data.id}:x));
    }
  };

  const deleteBlock = async (id) => {
    if (String(id).length>10 && !id.startsWith("tmp-")) await supabase.from("calendar_events").delete().eq("id",id);
    setBlocks(prev=>prev.filter(x=>x.id!==id));
    setEventPanel(null); setCtxMenu(null);
  };

  const updatePosition = async (b) => {
    if (!b.id || String(b.id).length<=10 || b.id.startsWith("tmp-") || b.source==="google") return;
    const sTime = addMinutes(startOfDay(b.startDate), b.startHr*60).toISOString();
    const eTime = addMinutes(startOfDay(b.startDate), b.endHr*60).toISOString();
    await supabase.from("calendar_events").update({ start_time:sTime,end_time:eTime }).eq("id",b.id);
  };

  // ─── Google Calendar OAuth ────────────────────────────────────────────────
  const loadGsiScript = () => new Promise(res => {
    if (window.google?.accounts?.oauth2) { res(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = res;
    document.head.appendChild(s);
  });

  const fetchGoogleEvents = async (token) => {
    const from = addDays(new Date(),-7).toISOString();
    const to   = addDays(new Date(), 60).toISOString();
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${from}&timeMax=${to}&singleEvents=true&orderBy=startTime&maxResults=250`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) { localStorage.removeItem("gCalToken"); setGConnected(false); return; }
      const data = await res.json();
      const gEvts = (data.items||[]).flatMap(ev => {
        const s = ev.start?.dateTime||ev.start?.date;
        const e = ev.end?.dateTime||ev.end?.date;
        if (!s||!e) return [];
        const sD=new Date(s),eD=new Date(e);
        const sH=sD.getHours()+sD.getMinutes()/60;
        const eH=eD.getHours()+eD.getMinutes()/60;
        if (eH<=sH) return [];
        const meetEntry = ev.conferenceData?.entryPoints?.find(ep=>ep.entryPointType==="video");
        return [{ id:`g-${ev.id}`,title:ev.summary||"Busy",cat:"Meeting",startDate:sD,startHr:sH,endHr:eH,source:"google",meetLink:meetEntry?.uri||null,meetCode:ev.conferenceData?.conferenceId||null }];
      });
      setBlocks(prev=>[...prev.filter(b=>b.source!=="google"),...gEvts]);
    } catch {}
  };

  const connectGoogle = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert("Add VITE_GOOGLE_CLIENT_ID to your .env file.\n\nGet one at console.cloud.google.com — create a project, enable Calendar API, add OAuth 2.0 credentials (Web), add your domain to authorized origins.");
      return;
    }
    setGConnecting(true);
    await loadGsiScript();
    window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: async (resp) => {
        setGConnecting(false);
        if (resp.access_token) {
          localStorage.setItem("gCalToken", resp.access_token);
          setGConnected(true);
          await fetchGoogleEvents(resp.access_token);
        }
      },
      error_callback: () => setGConnecting(false),
    }).requestAccessToken();
  };

  const syncGoogle = async () => {
    const token = localStorage.getItem("gCalToken");
    if (token) await fetchGoogleEvents(token);
    else connectGoogle();
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const navigate = (dir) => {
    if (view==="month") setCurrentDate(dir>0 ? addMonths(currentDate,1) : subMonths(currentDate,1));
    else if (view==="day") setCurrentDate(addDays(currentDate,dir));
    else setCurrentDate(addDays(currentDate,dir*7));
  };
  const goToday = () => setCurrentDate(new Date());

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;
      switch(e.key) {
        case "c": case "C": setQuickOpen(true); setQuickText(""); setParsed(null); break;
        case "t": case "T": goToday(); break;
        case "j": case "J": navigate(1); break;
        case "k": case "K": navigate(-1); break;
        case "d": case "D": setView("day"); break;
        case "w": case "W": setView("week"); break;
        case "m": case "M": setView("month"); break;
        case "/": e.preventDefault(); setQuickOpen(true); setQuickText(""); setParsed(null); break;
        case "Escape": setEventPanel(null); setQuickOpen(false); setCtxMenu(null); break;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [view]);

  // ─── Drag system ──────────────────────────────────────────────────────────
  useEffect(() => {
    let hasMoved = false;

    const onMove = (e) => {
      const d = drag.current;
      if (!d.type) return;
      const grid = gridRef.current;
      if (!grid) return;

      const rect  = grid.getBoundingClientRect();
      const y     = e.clientY - rect.top + grid.scrollTop;
      const rawHr = S_HR + y / HH;

      if (!hasMoved) {
        const dy = Math.abs(e.clientY - (d.startClientY || e.clientY));
        if (dy < 4) return;
        hasMoved = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
      }

      if (d.type === "create") {
        const endHr = snap(Math.max(d.startHr + 0.25, Math.min(E_HR, rawHr)));
        setGhost({ dayIdx: d.dayIdx, startDate: d.startDate, startHr: d.startHr, endHr, cat: d.cat, title: "" });
        return;
      }

      if (d.type === "move") {
        const dur = d.original.endHr - d.original.startHr;
        const newStart = snap(Math.max(S_HR, Math.min(E_HR - dur, rawHr - d.offsetHr)));
        let newDate = d.original.startDate;
        // Detect column
        const cols = grid.querySelectorAll("[data-day-col]");
        for (let i = 0; i < cols.length; i++) {
          const cr = cols[i].getBoundingClientRect();
          if (e.clientX >= cr.left && e.clientX < cr.right) {
            newDate = weekDRef.current[i] || d.original.startDate;
            break;
          }
        }
        setGhost({ ...d.original, startDate: newDate, startHr: newStart, endHr: newStart + dur, moving: true });
        return;
      }

      if (d.type === "resize") {
        const dY    = e.clientY - d.startClientY;
        const newEnd = snap(Math.max(d.original.startHr + 0.25, Math.min(E_HR, d.original.endHr + dY / HH)));
        setGhost({ ...d.original, endHr: newEnd, resizing: true });
      }
    };

    const onUp = async () => {
      const d = drag.current;
      const g = ghostRef.current;
      document.body.style.userSelect = "";
      document.body.style.cursor     = "";

      if (!d.type) return;

      if (d.type === "create") {
        if (hasMoved && g) {
          openEvent({ startDate: g.startDate, startHr: g.startHr, endHr: g.endHr, title: "", cat: g.cat });
        } else {
          openEvent({ startDate: d.startDate, startHr: d.startHr, endHr: snap(d.startHr + 1), title: "", cat: d.cat });
        }
      }

      if (d.type === "move") {
        if (hasMoved && g) {
          const updated = { ...d.original, startDate: g.startDate, startHr: g.startHr, endHr: g.endHr };
          setBlocks(prev => prev.map(b => b.id === d.original.id ? updated : b));
          await updatePosition(updated);
        } else if (!hasMoved) {
          // plain click — open popup near cursor
          openEvent(d.original, "view", { x: e.clientX, y: e.clientY });
        }
      }

      if (d.type === "resize" && hasMoved && g) {
        const updated = { ...d.original, endHr: g.endHr };
        setBlocks(prev => prev.map(b => b.id === d.original.id ? updated : b));
        await updatePosition(updated);
      }

      drag.current = { type: null };
      hasMoved = false;
      setGhost(null);
    };

    // Cancel drag if window loses focus
    const onBlur = () => {
      if (drag.current.type) {
        drag.current = { type: null };
        hasMoved = false;
        document.body.style.userSelect = "";
        document.body.style.cursor     = "";
        setGhost(null);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [setGhost]);

  const onGridMouseDown = (e, date, cat) => {
    if (e.button !== 0) return;
    const grid = gridRef.current;
    if (!grid) return;
    const rect   = grid.getBoundingClientRect();
    const y      = e.clientY - rect.top + grid.scrollTop;
    const startHr = snap(Math.max(S_HR, Math.min(E_HR, S_HR + y / HH)));
    drag.current = { type: "create", startDate: date, startHr, cat: cat || selectedCat, startClientY: e.clientY };
    e.preventDefault();
  };

  const onEventMouseDown = (e, block) => {
    if (e.button !== 0 || e.currentTarget.dataset.resize) return;
    const grid   = gridRef.current;
    if (!grid) return;
    const rect   = grid.getBoundingClientRect();
    const y      = e.clientY - rect.top + grid.scrollTop;
    const hr     = S_HR + y / HH;
    drag.current = { type: "move", original: block, offsetHr: hr - block.startHr, startClientY: e.clientY };
    e.preventDefault();
    e.stopPropagation();
  };

  const onResizeMouseDown = (e, block) => {
    if (e.button !== 0) return;
    drag.current = { type: "resize", original: block, startClientY: e.clientY };
    e.preventDefault();
    e.stopPropagation();
  };

  // ─── Rail drag (HTML5) ────────────────────────────────────────────────────
  const [railDrag,    setRailDrag]    = useState(null);
  const [dropTarget, setDropTarget]  = useState(null);

  const onRailDragStart = (e, item, type) => {
    setRailDrag({ item, type });
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", item.id);
  };
  const onGridDragOver = (e, date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const grid = gridRef.current;
    if (!grid) return;
    const rect  = grid.getBoundingClientRect();
    const y     = e.clientY - rect.top + grid.scrollTop;
    setDropTarget({ date, hr: snap(S_HR + y / HH) });
  };
  const onGridDrop = async (e, date) => {
    e.preventDefault();
    if (!railDrag) return;
    const { item, type } = railDrag;
    const grid = gridRef.current;
    const rect  = grid?.getBoundingClientRect();
    const y     = rect ? e.clientY - rect.top + grid.scrollTop : 0;
    const startHr = snap(Math.max(S_HR, Math.min(E_HR - (item.dur||60)/60, S_HR + y / HH)));
    const endHr   = snap(Math.min(E_HR, startHr + (item.dur||60)/60));
    const cat   = item.cat || item.category || "Edit";
    const title = item.name || item.title || "";
    const tmpId = `tmp-${Date.now()}`;
    const nb    = { id: tmpId, title, cat, startDate: date, startHr, endHr, source: "nomaad" };
    setBlocks(prev => [...prev, nb]);
    if (type === "task") setScheduled(prev => new Set([...prev, item.id]));
    await saveBlock(nb);
    setRailDrag(null); setDropTarget(null);
  };

  // ─── Event panel helpers ──────────────────────────────────────────────────
  // mode: "view" (popup near click) | "create" (form modal) | "editForm" (form modal for existing)
  const openEvent = (block, mode = "create", pos = null) => setEventPanel({ block: { ...block }, mode, pos });

  const saveEventPanel = async () => {
    if (!eventPanel) return;
    const { block, mode } = eventPanel;
    if (mode === "editForm") {
      setBlocks(prev => prev.map(b => b.id === block.id ? block : b));
      await saveBlock(block);
    } else {
      const tmpId = `tmp-${Date.now()}`;
      const nb = { ...block, id: tmpId, source: "nomaad" };
      setBlocks(prev => [...prev, nb]);
      await saveBlock(nb);
    }
    setEventPanel(null);
  };

  // ─── Quick create ─────────────────────────────────────────────────────────
  const handleQuickInput = (v) => { setQuickText(v); if(v.length>3) setParsed(parseNL(v)); else setParsed(null); };
  const confirmQuick = async () => {
    if (!parsed) return;
    const tmpId = `tmp-${Date.now()}`;
    const nb = { id: tmpId, ...parsed, source: "nomaad" };
    setBlocks(prev => [...prev, nb]);
    setQuickOpen(false); setQuickText(""); setParsed(null);
    await saveBlock(nb);
  };

  // ─── Style helpers ────────────────────────────────────────────────────────
  const ease = "all 0.28s cubic-bezier(.4,0,.2,1)";
  const card  = (ex={}) => ({ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: "blur(24px) saturate(1.6)", ...ex });

  // ─── Block renderer ───────────────────────────────────────────────────────
  const renderBlock = (block, opts = {}) => {
    const { isGhost=false, faded=false } = opts;
    const c      = CATS[block.cat] || CATS.Edit;
    const top    = (block.startHr - S_HR) * HH;
    const height = Math.max(22, (block.endHr - block.startHr) * HH);
    const short  = height < 44;
    const isGoogle = block.source === "google";

    return (
      <div
        key={block.id + (isGhost ? "-g" : "")}
        data-event="1"
        onMouseDown={!isGhost && !faded ? (e) => onEventMouseDown(e, block) : undefined}
        onContextMenu={!isGhost ? (e) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, block }); } : undefined}
        style={{
          position: "absolute", top: top + 1, height: height - 2, left: 3, right: 3,
          background: isGhost
            ? `rgba(${hexRgb(c.color)},0.16)`
            : (dark ? c.bg : c.bg.replace("0.12","0.2")),
          borderLeft: `3px solid ${c.color}`,
          borderRadius: 8,
          border: isGhost ? `1.5px dashed ${c.color}` : undefined,
          padding: short ? "2px 8px" : "6px 10px",
          overflow: "hidden",
          cursor: isGhost || faded ? "default" : "grab",
          opacity: faded ? 0.3 : isGhost ? 0.85 : 1,
          backdropFilter: "blur(6px)",
          display: "flex", flexDirection: "column", gap: short ? 0 : 2,
          userSelect: "none",
          zIndex: isGhost ? 20 : 10,
          pointerEvents: isGhost || faded ? "none" : "auto",
          borderTopRightRadius: isGoogle ? 0 : 8,
        }}
        onMouseEnter={!isGhost&&!faded ? (e)=>{ e.currentTarget.style.boxShadow=`0 4px 14px rgba(${hexRgb(c.color)},0.3)`; } : undefined}
        onMouseLeave={!isGhost&&!faded ? (e)=>{ e.currentTarget.style.boxShadow="none"; } : undefined}
      >
        {isGoogle && <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 8px 8px 0", borderColor: `transparent #4285F4 transparent transparent` }} />}
        {!short && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: c.color, display: "flex" }}>{c.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: c.color, fontVariantNumeric: "tabular-nums" }}>{fmt24(block.startHr)} - {fmt24(block.endHr)}</span>
          </div>
        )}
        <div style={{ fontSize: short?11:12, fontWeight:600, color:t.text, lineHeight:1.25, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:short?"nowrap":"normal", display:"-webkit-box", WebkitLineClamp:short?1:3, WebkitBoxOrient:"vertical" }}>
          {block.title || (isGhost ? "New event" : "Untitled")}
        </div>
        {!short && height>=80 && <div style={{ fontSize:10, color:t.sub, marginTop:"auto" }}>{fmtDur(block.endHr-block.startHr)}</div>}
        {/* Resize handle */}
        {!isGhost && !faded && (
          <div
            onMouseDown={(e) => onResizeMouseDown(e, block)}
            style={{ position:"absolute", bottom:0, left:0, right:0, height:10, cursor:"ns-resize", display:"flex", alignItems:"center", justifyContent:"center", zIndex:15 }}
          >
            <div style={{ width:20, height:2, borderRadius:1, background:`rgba(${hexRgb(c.color)},0.35)` }} />
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK / DAY GRID — proper structure matching Notion/Google Calendar
  // ─────────────────────────────────────────────────────────────────────────────
  const renderGrid = (days) => (
    <div style={{ ...card(), flex:1, overflow:"hidden", display:"flex", flexDirection:"column", marginTop:12 }}>
      {/* Day header row */}
      <div style={{ display:"flex", borderBottom:`1px solid ${t.divider}`, flexShrink:0 }}>
        <div style={{ width:52, flexShrink:0 }} />
        {days.map((day, idx) => {
          const tod = isSameDay(day, new Date());
          return (
            <div key={idx} style={{ flex:1, textAlign:"center", padding:"10px 0 8px", borderLeft:`1px solid ${t.divider}` }}>
              <div style={{ fontSize:10, fontWeight:600, color:tod?t.accent:t.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>
                {format(day,"EEE")}
              </div>
              <div
                onClick={()=>{ setCurrentDate(day); setView("day"); }}
                style={{ width:28, height:28, margin:"0 auto", borderRadius:"50%", background:tod?t.accentGrad:"transparent", color:tod?t.accentText:t.sub, fontSize:14, fontWeight:tod?700:500, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:tod?t.accentGlow:"none", transition:ease }}
              >
                {format(day,"d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid body */}
      <div ref={gridRef} className="cal-grid" style={{ flex:1, overflowY:"auto", display:"flex" }}>
        {/* Time gutter — absolute-positioned labels */}
        <div style={{ width:52, flexShrink:0, position:"relative", height:GRID_H }}>
          {HOURS.map(hr => (
            <div key={hr} style={{ position:"absolute", top:(hr-S_HR)*HH-7, right:8, fontSize:10, fontWeight:500, color:t.muted, fontVariantNumeric:"tabular-nums", lineHeight:1, pointerEvents:"none" }}>
              {fmt24(hr)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, colIdx) => {
          const movingId   = ghost?.moving  ? ghost.id : null;
          const resizingId = ghost?.resizing ? ghost.id : null;
          const ghostHere  = ghost && isSameDay(ghost.startDate, day);
          const isDrop     = dropTarget && isSameDay(dropTarget.date, day);

          return (
            <div
              key={colIdx}
              data-day-col={colIdx}
              style={{ flex:1, borderLeft:`1px solid ${t.divider}`, position:"relative", height:GRID_H, backgroundColor: isDrop ? `rgba(${hexRgb(VOLT)},0.03)` : "transparent", transition:"background-color 0.15s ease" }}
              onMouseDown={(e) => {
                if (e.target.dataset.event || e.target.closest("[data-event]")) return;
                onGridMouseDown(e, day, selectedCat);
              }}
              onDragOver={(e) => onGridDragOver(e, day)}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => onGridDrop(e, day)}
            >
              {/* Hour lines */}
              {HOURS.map(hr => (
                <div key={hr} style={{ position:"absolute", top:(hr-S_HR)*HH, left:0, right:0, borderTop:`1px solid ${t.gridLine}`, pointerEvents:"none" }}>
                  <div style={{ position:"absolute", top:HH/2, left:0, right:0, borderTop:`1px dashed ${dark?"rgba(255,255,255,0.022)":"rgba(0,0,0,0.03)"}` }} />
                </div>
              ))}

              {/* Current time indicator in today's column */}
              {isSameDay(day, new Date()) && (
                <div style={{ position:"absolute", top:(nowHr-S_HR)*HH, left:0, right:0, zIndex:15, pointerEvents:"none", display:"flex", alignItems:"center" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#FF453A", marginLeft:-4, flexShrink:0 }} />
                  <div style={{ flex:1, height:1.5, background:"linear-gradient(to right,#FF453A,rgba(255,69,58,0.15))" }} />
                </div>
              )}

              {/* Drop preview when rail dragging */}
              {isDrop && railDrag && (
                <div style={{ position:"absolute", top:(dropTarget.hr-S_HR)*HH, height:((railDrag.item.dur||60)/60)*HH, left:3, right:3, background:`rgba(${hexRgb(CATS[railDrag.item.cat||"Edit"]?.color||VOLT)},0.14)`, borderRadius:8, border:`2px dashed rgba(${hexRgb(CATS[railDrag.item.cat||"Edit"]?.color||VOLT)},0.45)`, pointerEvents:"none", zIndex:18 }} />
              )}

              {/* Events */}
              {blocks.filter(b => isSameDay(b.startDate, day)).map(b =>
                renderBlock(b, { faded: b.id===movingId || b.id===resizingId })
              )}

              {/* Ghost */}
              {ghostHere && renderBlock(ghost, { isGhost: true })}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // MONTH VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  const renderMonth = () => {
    const mStart   = startOfMonth(currentDate);
    const mEnd     = endOfMonth(currentDate);
    const padStart = (getDay(mStart)+6)%7;
    const allDays  = [...Array.from({length:padStart},(_,i)=>addDays(mStart,-(padStart-i))), ...eachDayOfInterval({start:mStart,end:mEnd})];
    while (allDays.length%7!==0) allDays.push(addDays(allDays[allDays.length-1],1));
    const DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

    return (
      <div style={{ ...card(), flex:1, overflow:"hidden", display:"flex", flexDirection:"column", marginTop:12 }}>
        {/* DOW row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${t.divider}`, flexShrink:0 }}>
          {DOW.map(d=><div key={d} style={{ padding:"10px 0", textAlign:"center", fontSize:11, fontWeight:600, color:t.muted, letterSpacing:0.5, textTransform:"uppercase" }}>{d}</div>)}
        </div>
        {/* Day cells */}
        <div style={{ flex:1, overflowY:"auto", display:"grid", gridTemplateColumns:"repeat(7,1fr)", gridAutoRows:"1fr" }}>
          {allDays.map((day,i) => {
            const inMonth = day.getMonth()===currentDate.getMonth();
            const tod     = isSameDay(day,new Date());
            const evts    = blocks.filter(b=>isSameDay(b.startDate,day));
            const hrs     = evts.reduce((s,b)=>s+(b.endHr-b.startHr),0);
            const heat    = Math.min(1,hrs/8);
            return (
              <div key={i}
                onClick={()=>{ setCurrentDate(day); setView("day"); }}
                style={{ borderRight:(i+1)%7!==0?`1px solid ${t.divider}`:"none", borderBottom:`1px solid ${t.divider}`, padding:8, cursor:"pointer", opacity:inMonth?1:0.35, background:heat>0?`rgba(${hexRgb(VOLT)},${heat*0.07})`:"transparent", transition:ease, overflow:"hidden" }}
                onMouseEnter={e=>{e.currentTarget.style.background=dark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.02)";}}
                onMouseLeave={e=>{e.currentTarget.style.background=heat>0?`rgba(${hexRgb(VOLT)},${heat*0.07})`:"transparent";}}
              >
                <div style={{ width:24,height:24,borderRadius:"50%",background:tod?t.accentGrad:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:tod?700:500,color:tod?t.accentText:(inMonth?t.text:t.muted),marginBottom:5,boxShadow:tod?t.accentGlow:"none" }}>
                  {format(day,"d")}
                </div>
                {evts.slice(0,3).map(ev=>{
                  const c=CATS[ev.cat]||CATS.Edit;
                  return <div key={ev.id} onClick={e=>{e.stopPropagation();openEvent(ev,"view",{x:e.clientX,y:e.clientY});}} style={{ fontSize:10,fontWeight:600,color:c.color,background:`rgba(${hexRgb(c.color)},0.12)`,borderRadius:4,padding:"1px 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2,cursor:"pointer" }}>{fmt24(ev.startHr)} {ev.title}</div>;
                })}
                {evts.length>3&&<div style={{fontSize:10,color:t.muted,fontWeight:600}}>+{evts.length-3} more</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENT PANEL — view popup (near click) + create/edit modal (centered)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderEventPanel = () => {
    if (!eventPanel) return null;
    const { block, mode, pos } = eventPanel;
    const cat = CATS[block.cat] || CATS.Edit;
    const updateField = (key, val) => setEventPanel(prev => ({ ...prev, block: { ...prev.block, [key]: val } }));
    const dur = block.endHr - block.startHr;

    // ── VIEW POPUP (clicking existing event) ────────────────────────────────
    if (mode === "view") {
      const PW = 332;
      const PH = block.meetLink ? 360 : 270;
      let left, top;
      if (pos) {
        left = pos.x - PW - 14;
        if (left < 14) left = pos.x + 14;
        if (left + PW > window.innerWidth - 14) left = window.innerWidth - PW - 14;
        top = pos.y - 40;
        if (top < 14) top = 14;
        if (top + PH > window.innerHeight - 14) top = window.innerHeight - PH - 14;
      } else {
        left = (window.innerWidth - PW) / 2;
        top  = (window.innerHeight - PH) / 3;
      }

      return (
        <>
          <div style={{ position:"fixed",inset:0,zIndex:298 }} onClick={()=>setEventPanel(null)}/>
          <motion.div
            initial={{ opacity:0, scale:0.93 }}
            animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.93 }}
            transition={{ type:"spring", stiffness:440, damping:32 }}
            style={{ position:"fixed", left, top, width:PW, zIndex:300, background:dark?"rgba(16,16,20,0.97)":"rgba(252,251,249,0.98)", backdropFilter:"blur(40px) saturate(1.8)", border:`1px solid ${t.cardBorder}`, borderRadius:18, boxShadow:dark?"0 20px 60px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.05) inset":"0 20px 60px rgba(0,0,0,0.15)", overflow:"hidden" }}
            onClick={e=>e.stopPropagation()}
          >
            {/* Header row */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px 10px", borderBottom:`1px solid ${t.divider}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:9,height:9,borderRadius:"50%",background:cat.color,flexShrink:0 }}/>
                <span style={{ fontSize:12,fontWeight:600,color:t.sub }}>{block.cat}</span>
                {block.source==="google" && <span style={{ fontSize:10,color:"#4285F4",background:"rgba(66,133,244,0.12)",padding:"1px 6px",borderRadius:5,fontWeight:600 }}>Google</span>}
              </div>
              <div style={{ display:"flex", gap:5 }}>
                {block.source!=="google" && (
                  <button onClick={()=>setEventPanel(prev=>({...prev,mode:"editForm"}))} title="Edit" style={{ width:26,height:26,borderRadius:7,background:t.input,border:`1px solid ${t.inputBorder}`,color:t.sub,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                    <Edit3 size={11}/>
                  </button>
                )}
                <button onClick={()=>deleteBlock(block.id)} title="Delete" style={{ width:26,height:26,borderRadius:7,background:"rgba(255,59,48,0.06)",border:"1px solid rgba(255,59,48,0.14)",color:"#FF453A",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                  <Trash2 size={11}/>
                </button>
                <button onClick={()=>setEventPanel(null)} style={{ width:26,height:26,borderRadius:7,background:t.input,border:`1px solid ${t.inputBorder}`,color:t.sub,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                  <X size={11}/>
                </button>
              </div>
            </div>

            {/* Title */}
            <div style={{ padding:"14px 14px 10px" }}>
              <div style={{ fontSize:18,fontWeight:700,color:t.text,letterSpacing:-0.3,lineHeight:1.3 }}>{block.title||"Untitled"}</div>
            </div>

            {/* Time */}
            <div style={{ padding:"0 14px 14px", display:"flex", alignItems:"flex-start", gap:10 }}>
              <Clock size={13} style={{ color:t.muted,marginTop:2,flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:13,fontWeight:500,color:t.text }}>
                  {fmt24(block.startHr)} → {fmt24(block.endHr)}
                  <span style={{ color:t.muted,marginLeft:8,fontWeight:400,fontSize:12 }}>{fmtDur(dur)}</span>
                </div>
                {block.startDate && <div style={{ fontSize:12,color:t.sub,marginTop:2 }}>{format(block.startDate,"EEE, dd MMM yyyy")}</div>}
              </div>
            </div>

            {/* Google Meet */}
            {block.meetLink && (
              <div style={{ padding:"10px 14px 12px", borderTop:`1px solid ${t.divider}` }}>
                <a href={block.meetLink} target="_blank" rel="noreferrer"
                  style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"9px 14px",borderRadius:12,background:"#1a73e8",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none",cursor:"pointer" }}
                >
                  <Video size={14}/> Join Google Meet
                </a>
                {block.meetCode && <div style={{ fontSize:11,color:t.muted,textAlign:"center",marginTop:5 }}>Code: {block.meetCode}</div>}
              </div>
            )}

            {/* Calendar */}
            <div style={{ padding:"10px 14px 12px", borderTop:`1px solid ${t.divider}`, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:11,height:11,borderRadius:3,background:block.source==="google"?"#4285F4":cat.color,flexShrink:0 }}/>
              <span style={{ fontSize:12,color:t.sub,fontWeight:500 }}>{block.source==="google"?"Google Calendar":"NOMAAD"}</span>
              <span style={{ fontSize:11,color:t.muted }}>· Busy</span>
            </div>
          </motion.div>
        </>
      );
    }

    // ── CREATE / EDIT FORM (centered modal) ─────────────────────────────────
    const isCreate = mode === "create";
    return (
      <motion.div
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        exit={{ opacity:0 }}
        style={{ position:"fixed",inset:0,zIndex:298,display:"flex",alignItems:"center",justifyContent:"center",background:dark?"rgba(0,0,0,0.5)":"rgba(0,0,0,0.22)",backdropFilter:"blur(8px)" }}
        onClick={e=>{ if(e.target===e.currentTarget) setEventPanel(null); }}
      >
        <motion.div
          initial={{ opacity:0,scale:0.96,y:10 }}
          animate={{ opacity:1,scale:1,y:0 }}
          exit={{ opacity:0,scale:0.96 }}
          transition={{ type:"spring",stiffness:420,damping:30 }}
          style={{ width:Math.min(400,window.innerWidth-32), background:dark?"rgba(16,16,20,0.98)":"rgba(252,251,249,0.98)", backdropFilter:"blur(40px) saturate(1.8)", border:`1px solid ${t.cardBorder}`, borderRadius:20, boxShadow:dark?"0 24px 80px rgba(0,0,0,0.5)":"0 24px 80px rgba(0,0,0,0.15)", overflow:"hidden", maxHeight:"90vh", display:"flex", flexDirection:"column" }}
          onClick={e=>e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:`1px solid ${t.divider}`,flexShrink:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
              <div style={{ width:9,height:9,borderRadius:"50%",background:cat.color }}/>
              <select value={block.cat||"Meeting"} onChange={e=>updateField("cat",e.target.value)}
                style={{ background:"transparent",border:"none",color:t.text,fontSize:13,fontWeight:600,outline:"none",cursor:"pointer",fontFamily:"inherit" }}>
                {CAT_LIST.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={11} style={{ color:t.muted }}/>
            </div>
            <button onClick={()=>setEventPanel(null)} style={{ width:26,height:26,borderRadius:7,background:t.input,border:`1px solid ${t.inputBorder}`,color:t.sub,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
              <X size={11}/>
            </button>
          </div>

          <div style={{ flex:1,overflowY:"auto" }}>
            {/* Title */}
            <div style={{ padding:"16px 16px 10px" }}>
              <input autoFocus={isCreate} value={block.title||""} onChange={e=>updateField("title",e.target.value)}
                placeholder="Add title"
                style={{ width:"100%",background:"transparent",border:"none",color:t.text,fontSize:21,fontWeight:700,outline:"none",fontFamily:"inherit",letterSpacing:-0.3,boxSizing:"border-box" }}
              />
            </div>

            {/* Date / time */}
            <div style={{ borderTop:`1px solid ${t.divider}`,padding:"12px 16px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                <Clock size={13} style={{ color:t.muted,flexShrink:0 }}/>
                <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                  <input type="date"
                    defaultValue={block.startDate?format(block.startDate,"yyyy-MM-dd"):format(new Date(),"yyyy-MM-dd")}
                    onChange={e=>{ const d=new Date(e.target.value+"T12:00:00"); updateField("startDate",d); }}
                    style={{ background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:8,padding:"4px 8px",color:t.text,fontSize:12,outline:"none",fontFamily:"inherit",cursor:"pointer" }}
                  />
                  <select value={block.startHr||9} onChange={e=>updateField("startHr",parseFloat(e.target.value))}
                    style={{ background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:8,padding:"4px 8px",color:t.text,fontSize:12,outline:"none",fontFamily:"inherit",cursor:"pointer" }}>
                    {Array.from({length:(E_HR-S_HR)*4},(_,i)=>S_HR+i*0.25).map(h=><option key={h} value={h}>{fmt24(h)}</option>)}
                  </select>
                  <span style={{ color:t.muted,fontSize:12 }}>→</span>
                  <select value={block.endHr||10} onChange={e=>updateField("endHr",parseFloat(e.target.value))}
                    style={{ background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:8,padding:"4px 8px",color:t.text,fontSize:12,outline:"none",fontFamily:"inherit",cursor:"pointer" }}>
                    {Array.from({length:(E_HR-S_HR)*4},(_,i)=>S_HR+i*0.25).map(h=><option key={h} value={h}>{fmt24(h)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:10,padding:"5px 0",color:t.muted,cursor:"pointer" }}>
                <RefreshCw size={13} style={{ flexShrink:0 }}/>
                <span style={{ fontSize:13 }}>Does not repeat</span>
              </div>
            </div>

            {/* Fields */}
            <div style={{ borderTop:`1px solid ${t.divider}`,padding:"4px 16px" }}>
              {[
                { icon:<Users size={13}/>,    ph:"Add participants", key:"participants" },
                { icon:<MapPin size={13}/>,   ph:"Add location",     key:"location" },
                { icon:<Bell size={13}/>,     ph:"Add reminder",     key:"reminder" },
                { icon:<FileText size={13}/>, ph:"Add notes",        key:"notes" },
              ].map(f=>(
                <div key={f.key} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${t.divider}` }}>
                  <span style={{ color:t.muted,flexShrink:0 }}>{f.icon}</span>
                  <input placeholder={f.ph} style={{ flex:1,background:"transparent",border:"none",color:t.text,fontSize:13,outline:"none",fontFamily:"inherit" }}/>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding:"12px 16px",borderTop:`1px solid ${t.divider}`,display:"flex",gap:8,flexShrink:0 }}>
            {mode==="editForm" && (
              <button onClick={()=>deleteBlock(block.id)} style={{ width:34,height:34,borderRadius:10,border:"1px solid rgba(255,59,48,0.15)",background:"rgba(255,59,48,0.06)",color:"#FF453A",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0 }}>
                <Trash2 size={13}/>
              </button>
            )}
            <button onClick={saveEventPanel}
              style={{ flex:1,padding:"9px",borderRadius:12,border:"none",background:t.accentGrad,color:t.accentText,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:t.accentGlow }}>
              {isCreate ? "Create Event" : "Save Changes"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // ─── Template helpers ─────────────────────────────────────────────────────
  const deleteTemplate = (id) => {
    const next = userTemplates.filter(t=>t.id!==id);
    setUserTemplates(next);
    lsSet("cal_user_tpls", next);
  };
  const saveNewTemplate = () => {
    if (!newTplForm?.name?.trim()) return;
    const tpl = { id:`tpl-${Date.now()}`, name:newTplForm.name.trim(), dur:parseInt(newTplForm.dur)||60, cat:newTplForm.cat||"Edit" };
    const next = [...userTemplates, tpl];
    setUserTemplates(next);
    lsSet("cal_user_tpls", next);
    setNewTplForm(null);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // INBOX RAIL
  // ─────────────────────────────────────────────────────────────────────────────
  const renderRail = () => (
    <motion.div
      initial={{ width:0, opacity:0 }} animate={{ width:mobile?"100%":260, opacity:1 }} exit={{ width:0, opacity:0 }}
      transition={{ type:"spring", stiffness:350, damping:32 }}
      style={{ overflow:"hidden", flexShrink:0, paddingLeft:12, minHeight:0 }}
    >
      <div style={{ width:mobile?"100%":260, height:"100%", display:"flex", flexDirection:"column", minHeight:0 }}>
        <div style={{ ...card({padding:0}), flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${t.divider}`, padding:"8px 8px 0", gap:4, flexShrink:0 }}>
            {["calendars","tasks","templates"].map(tab=>(
              <button key={tab} onClick={()=>setRailTab(tab)} style={{ flex:1,padding:"7px 0",borderRadius:"10px 10px 0 0",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",transition:ease,background:railTab===tab?(dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)"):"transparent",color:railTab===tab?t.text:t.muted,borderBottom:railTab===tab?`2px solid ${t.accent}`:"2px solid transparent" }}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"12px 10px" }}>

            {/* ── TEMPLATES TAB ── */}
            {railTab==="templates" && (
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}>
                  <p style={{ fontSize:10,fontWeight:600,color:t.muted,letterSpacing:0.5,textTransform:"uppercase" }}>Drag to calendar</p>
                  <button onClick={()=>setNewTplForm({ name:"", dur:60, cat:"Edit" })}
                    style={{ display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:8,border:`1px solid ${t.inputBorder}`,background:t.input,color:t.muted,fontSize:10,fontWeight:600,cursor:"pointer" }}>
                    <Plus size={9}/> New
                  </button>
                </div>

                {/* New template form */}
                {newTplForm && (
                  <div style={{ padding:"10px",borderRadius:12,border:`1px solid ${t.accent}44`,background:`rgba(${hexRgb(VOLT)},0.05)`,display:"flex",flexDirection:"column",gap:8 }}>
                    <input autoFocus value={newTplForm.name} onChange={e=>setNewTplForm(p=>({...p,name:e.target.value}))}
                      placeholder="Template name" onKeyDown={e=>{ if(e.key==="Enter") saveNewTemplate(); if(e.key==="Escape") setNewTplForm(null); }}
                      style={{ background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:8,padding:"5px 8px",color:t.text,fontSize:12,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box" }}
                    />
                    <div style={{ display:"flex",gap:6 }}>
                      <input type="number" value={newTplForm.dur} onChange={e=>setNewTplForm(p=>({...p,dur:e.target.value}))}
                        min={15} max={480} step={15} placeholder="mins"
                        style={{ flex:1,background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:8,padding:"5px 8px",color:t.text,fontSize:12,outline:"none",fontFamily:"inherit" }}
                      />
                      <select value={newTplForm.cat} onChange={e=>setNewTplForm(p=>({...p,cat:e.target.value}))}
                        style={{ flex:1,background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:8,padding:"5px 6px",color:t.text,fontSize:12,outline:"none",fontFamily:"inherit",cursor:"pointer" }}>
                        {CAT_LIST.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"flex",gap:6 }}>
                      <button onClick={saveNewTemplate} style={{ flex:1,padding:"5px",borderRadius:8,border:"none",background:t.accentGrad,color:t.accentText,fontSize:11,fontWeight:700,cursor:"pointer" }}>Save</button>
                      <button onClick={()=>setNewTplForm(null)} style={{ padding:"5px 10px",borderRadius:8,border:`1px solid ${t.inputBorder}`,background:"transparent",color:t.muted,fontSize:11,cursor:"pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}

                {userTemplates.map(tpl=>{
                  const tplColor = CATS[tpl.cat]?.color || VOLT;
                  const tplIcon  = CATS[tpl.cat]?.icon;
                  return (
                    <div key={tpl.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 10px",borderRadius:12,border:`1px solid ${t.inputBorder}`,background:t.input,cursor:"grab",userSelect:"none",position:"relative" }}
                      draggable onDragStart={e=>onRailDragStart(e,tpl,"template")} onDragEnd={()=>{setRailDrag(null);setDropTarget(null);}}
                      onMouseEnter={e=>{ e.currentTarget.style.border=`1px solid ${tplColor}44`; e.currentTarget.style.background=`rgba(${hexRgb(tplColor)},0.06)`; e.currentTarget.querySelector(".del-tpl").style.opacity="1"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.border=`1px solid ${t.inputBorder}`; e.currentTarget.style.background=t.input; e.currentTarget.querySelector(".del-tpl").style.opacity="0"; }}
                    >
                      <div style={{ width:26,height:26,borderRadius:7,background:`rgba(${hexRgb(tplColor)},0.15)`,display:"flex",alignItems:"center",justifyContent:"center",color:tplColor,flexShrink:0 }}>{tplIcon}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:600,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{tpl.name}</div>
                        <div style={{ fontSize:10,color:t.muted }}>{fmtDur(tpl.dur/60)} · {tpl.cat}</div>
                      </div>
                      <button className="del-tpl" onClick={e=>{ e.stopPropagation(); deleteTemplate(tpl.id); }}
                        style={{ opacity:0,transition:"opacity 0.15s",width:20,height:20,borderRadius:5,border:"none",background:"rgba(255,59,48,0.12)",color:"#FF453A",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0 }}>
                        <X size={9}/>
                      </button>
                    </div>
                  );
                })}

                {userTemplates.length===0 && <p style={{ fontSize:12,color:t.muted,fontStyle:"italic",textAlign:"center",marginTop:16 }}>No templates yet</p>}
              </div>
            )}

            {/* ── TASKS TAB ── */}
            {railTab==="tasks" && (
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                <p style={{ fontSize:10,fontWeight:600,color:t.muted,letterSpacing:0.5,textTransform:"uppercase",marginBottom:4 }}>Drag to timebox</p>
                {inboxTasks.filter(tk=>!scheduled.has(tk.id)).map(tk=>{
                  const c=CATS[tk.cat]||CATS.Edit;
                  return (
                    <div key={tk.id} draggable onDragStart={e=>onRailDragStart(e,tk,"task")} onDragEnd={()=>{setRailDrag(null);setDropTarget(null);}}
                      style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:12,border:`1px solid ${t.inputBorder}`,background:t.input,cursor:"grab",userSelect:"none" }}
                      onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${c.color}44`;}}
                      onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${t.inputBorder}`;}}
                    >
                      <div style={{ width:6,height:6,borderRadius:"50%",background:PRI[tk.pri],marginTop:5,flexShrink:0 }}/>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:600,color:t.text,lineHeight:1.3 }}>{tk.title}</div>
                        <div style={{ fontSize:10,color:t.muted,marginTop:2 }}>{tk.project} · {fmtDur(tk.dur/60)}</div>
                      </div>
                    </div>
                  );
                })}
                {inboxTasks.filter(tk=>!scheduled.has(tk.id)).length===0 && <p style={{ fontSize:12,color:t.muted,fontStyle:"italic",textAlign:"center",marginTop:20 }}>All tasks scheduled</p>}
              </div>
            )}

            {/* ── CALENDARS TAB ── */}
            {railTab==="calendars" && (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <p style={{ fontSize:10,fontWeight:600,color:t.muted,letterSpacing:0.5,textTransform:"uppercase",marginBottom:2 }}>Connected Calendars</p>

                {/* NOMAAD */}
                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,border:`1px solid ${t.inputBorder}`,background:t.input }}>
                  <div style={{ width:11,height:11,borderRadius:3,background:VOLT,flexShrink:0 }}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:t.text }}>NOMAAD</div>
                    <div style={{ fontSize:10,color:"#34C759" }}>Active</div>
                  </div>
                  <CheckCircle size={13} style={{ color:"#34C759",flexShrink:0 }}/>
                </div>

                {/* Google Calendar */}
                <div style={{ padding:"10px 12px",borderRadius:12,border:`1px solid ${gConnected?"rgba(66,133,244,0.3)":t.inputBorder}`,background:gConnected?"rgba(66,133,244,0.05)":t.input }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:gConnected?10:0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:12,fontWeight:600,color:t.text }}>Google Calendar</div>
                      <div style={{ fontSize:10,color:gConnected?"#34C759":t.muted }}>{gConnected?"Connected":"Not connected"}</div>
                    </div>
                    {gConnected && <CheckCircle size={13} style={{ color:"#34C759",flexShrink:0 }}/>}
                  </div>
                  {gConnected ? (
                    <div style={{ display:"flex",gap:6 }}>
                      <button onClick={syncGoogle} style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"6px",borderRadius:8,border:`1px solid rgba(66,133,244,0.3)`,background:"transparent",color:"#4285F4",fontSize:11,fontWeight:600,cursor:"pointer" }}>
                        <RefreshCw size={10}/> Sync now
                      </button>
                      <button onClick={()=>{ localStorage.removeItem("gCalToken"); setGConnected(false); setBlocks(prev=>prev.filter(b=>b.source!=="google")); }}
                        style={{ padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,59,48,0.15)",background:"transparent",color:"#FF453A",fontSize:11,fontWeight:600,cursor:"pointer" }}>
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button onClick={connectGoogle} disabled={gConnecting}
                      style={{ width:"100%",padding:"7px",borderRadius:8,border:"none",background:"#4285F4",color:"#fff",fontSize:12,fontWeight:600,cursor:gConnecting?"wait":"pointer",marginTop:0 }}>
                      {gConnecting?"Connecting...":"Connect"}
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height:1,background:t.divider,margin:"2px 0" }}/>
                <p style={{ fontSize:10,fontWeight:600,color:t.muted,letterSpacing:0.5,textTransform:"uppercase" }}>Coming Soon</p>
                {["iCloud Calendar","Outlook"].map(name=>(
                  <div key={name} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,border:`1px solid ${t.inputBorder}`,background:t.input,opacity:0.5 }}>
                    <div style={{ width:11,height:11,borderRadius:3,background:t.muted,flexShrink:0 }}/>
                    <div style={{ fontSize:12,fontWeight:600,color:t.text }}>{name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // ─── Header label ─────────────────────────────────────────────────────────
  const headerLabel = () => {
    if (view==="month") return format(currentDate,"MMMM yyyy");
    if (view==="day")   return format(currentDate,"d MMMM yyyy");
    // week: show month + year (or range if spans two months)
    const wEnd = addDays(weekStart,6);
    if (format(weekStart,"MMM yyyy")===format(wEnd,"MMM yyyy")) return format(weekStart,"MMMM yyyy");
    if (format(weekStart,"yyyy")===format(wEnd,"yyyy")) return `${format(weekStart,"MMM")} – ${format(wEnd,"MMM yyyy")}`;
    return `${format(weekStart,"MMM yyyy")} – ${format(wEnd,"MMM yyyy")}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:0 }}>

      {/* ── Header ── */}
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, marginLeft:mobile?48:0, marginBottom:12 }}>
        {/* Left: date title */}
        <h1 style={{ fontSize:compact?22:28, fontWeight:700, letterSpacing:-0.7, color:t.text, margin:0 }}>{headerLabel()}</h1>

        {/* Right: controls */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          {/* View dropdown pill */}
          <div style={{ position:"relative" }}>
            <select
              value={view}
              onChange={e=>setView(e.target.value)}
              style={{ appearance:"none",WebkitAppearance:"none",background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:10,padding:"6px 28px 6px 12px",color:t.text,fontSize:13,fontWeight:600,cursor:"pointer",outline:"none",fontFamily:"inherit" }}
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
            <ChevronDown size={12} style={{ position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",color:t.muted,pointerEvents:"none" }}/>
          </div>

          {/* Today */}
          <button onClick={goToday} style={{ height:32,padding:"0 13px",borderRadius:10,border:`1px solid ${t.inputBorder}`,background:t.input,color:t.text,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Today</button>

          {/* Prev / Next */}
          <div style={{ display:"flex", gap:2 }}>
            <button onClick={()=>navigate(-1)} style={{ width:28,height:32,borderRadius:8,border:`1px solid ${t.inputBorder}`,background:t.input,color:t.sub,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><ChevronLeft size={14}/></button>
            <button onClick={()=>navigate(1)}  style={{ width:28,height:32,borderRadius:8,border:`1px solid ${t.inputBorder}`,background:t.input,color:t.sub,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><ChevronRight size={14}/></button>
          </div>

          {/* New event */}
          <button onClick={()=>setQuickOpen(true)} style={{ height:32,padding:"0 13px",borderRadius:10,border:"none",background:t.accentGrad,color:t.accentText,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:5,cursor:"pointer",boxShadow:t.accentGlow }}>
            <Plus size={13}/>{!mobile&&" New"}
          </button>

          {/* Rail toggle */}
          <button onClick={()=>setRailOpen(v=>!v)} title="Toggle panel" style={{ width:32,height:32,borderRadius:9,border:`1px solid ${railOpen?t.accent:t.inputBorder}`,background:railOpen?`rgba(${hexRgb(VOLT)},0.1)`:t.input,color:railOpen?t.accent:t.sub,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:ease }}>
            <PanelRight size={14}/>
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <div style={{ flex:1, display:"flex", minHeight:0 }}>
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
          {view==="week"  && renderGrid(weekDays)}
          {view==="day"   && renderGrid([currentDate])}
          {view==="month" && renderMonth()}
        </div>
        <AnimatePresence>{railOpen && renderRail()}</AnimatePresence>
      </div>

      {/* ── Keyboard hints ── */}
      {!mobile && (
        <div style={{ flexShrink:0, paddingTop:8, display:"flex", gap:10, flexWrap:"wrap" }}>
          {[["C","New event"],["T","Today"],["J/K","Navigate"],["D/W/M","Switch view"],["↑↓ drag","Create/move"]].map(([key,label])=>(
            <div key={key} style={{ display:"flex",alignItems:"center",gap:5,fontSize:10,color:t.muted }}>
              <kbd style={{ background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:5,padding:"1px 6px",fontFamily:"inherit",fontSize:10,fontWeight:600,color:t.sub }}>{key}</kbd>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Context menu ── */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} transition={{duration:0.1}}
            style={{ position:"fixed",top:ctxMenu.y,left:ctxMenu.x,zIndex:400,background:dark?"rgba(28,28,32,0.97)":"rgba(255,255,255,0.97)",border:`1px solid ${t.cardBorder}`,borderRadius:14,boxShadow:"0 12px 40px rgba(0,0,0,0.25)",backdropFilter:"blur(32px)",padding:6,minWidth:160 }}
            onMouseLeave={()=>setCtxMenu(null)}
          >
            {[
              { label:"Edit", icon:<Edit3 size={13}/>, fn:()=>{ openEvent(ctxMenu.block,"edit"); setCtxMenu(null); } },
              { label:"Duplicate", icon:<Plus size={13}/>, fn:()=>{ const b={...ctxMenu.block,id:`tmp-${Date.now()}`,startHr:ctxMenu.block.startHr,endHr:ctxMenu.block.endHr}; setBlocks(p=>[...p,b]); saveBlock(b); setCtxMenu(null); } },
              { label:"Delete", icon:<Trash2 size={13}/>, danger:true, fn:()=>deleteBlock(ctxMenu.block.id) },
            ].map(item=>(
              <button key={item.label} onClick={item.fn} style={{ display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 12px",border:"none",background:"transparent",color:item.danger?t.red:t.text,fontSize:13,fontWeight:500,cursor:"pointer",borderRadius:8,textAlign:"left" }}
                onMouseEnter={e=>{e.currentTarget.style.background=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.04)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
              >{item.icon}{item.label}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick create ── */}
      <AnimatePresence>
        {quickOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:"14vh",background:dark?"rgba(0,0,0,0.5)":"rgba(0,0,0,0.2)",backdropFilter:"blur(8px)" }}
            onClick={e=>{if(e.target===e.currentTarget){setQuickOpen(false);setQuickText("");setParsed(null);}}}
          >
            <motion.div initial={{opacity:0,y:-8,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8}} transition={{type:"spring",stiffness:400,damping:30}}
              style={{ background:dark?"rgba(22,22,28,0.98)":"rgba(255,255,255,0.98)",border:`1px solid ${t.cardBorder}`,borderRadius:20,width:Math.min(560,window.innerWidth-32),boxShadow:"0 24px 80px rgba(0,0,0,0.3)",backdropFilter:"blur(40px)",overflow:"hidden" }}
            >
              <div style={{ display:"flex",alignItems:"center",gap:12,padding:"16px 18px" }}>
                <Zap size={17} style={{ color:t.accent,flexShrink:0 }}/>
                <input autoFocus value={quickText} onChange={e=>handleQuickInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&parsed) confirmQuick(); if(e.key==="Escape"){setQuickOpen(false);setQuickText("");setParsed(null);} }}
                  placeholder="shoot Brandon wedding Friday 9am to 6pm at Prideaux Estate..."
                  style={{ flex:1,background:"transparent",border:"none",color:t.text,fontSize:15,fontWeight:500,outline:"none",fontFamily:"inherit" }}
                />
                <kbd style={{ fontSize:10,fontWeight:600,color:t.muted,background:t.input,border:`1px solid ${t.inputBorder}`,borderRadius:6,padding:"2px 6px" }}>ESC</kbd>
              </div>
              {parsed && (
                <>
                  <div style={{ height:1,background:t.divider }}/>
                  <div style={{ padding:"12px 18px 14px",display:"flex",alignItems:"center",gap:14 }}>
                    <div style={{ width:34,height:34,borderRadius:10,background:`rgba(${hexRgb(CATS[parsed.cat]?.color||VOLT)},0.15)`,display:"flex",alignItems:"center",justifyContent:"center",color:CATS[parsed.cat]?.color,flexShrink:0 }}>{CATS[parsed.cat]?.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14,fontWeight:700,color:t.text }}>{parsed.title}</div>
                      <div style={{ fontSize:12,color:t.sub,marginTop:2 }}>{format(parsed.startDate,"EEE dd/MM")} · {fmt24(parsed.startHr)} - {fmt24(parsed.endHr)} · {parsed.cat}</div>
                    </div>
                    <button onClick={confirmQuick} style={{ padding:"7px 14px",borderRadius:12,border:"none",background:t.accentGrad,color:t.accentText,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:t.accentGlow }}>Create</button>
                  </div>
                </>
              )}
              {!quickText && (
                <div style={{ padding:"0 18px 14px",display:"flex",gap:6,flexWrap:"wrap" }}>
                  {["Deep Work 2h","Client call tomorrow 10am","Edit session Friday 13:00 3h","Shoot day Monday 8am to 6pm"].map(ex=>(
                    <button key={ex} onClick={()=>handleQuickInput(ex)} style={{ fontSize:11,padding:"4px 10px",borderRadius:20,border:`1px solid ${t.inputBorder}`,background:t.input,color:t.sub,cursor:"pointer",fontFamily:"inherit" }}>{ex}</button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Event panel ── */}
      <AnimatePresence>
        {eventPanel && renderEventPanel()}
      </AnimatePresence>
    </div>
  );
}
