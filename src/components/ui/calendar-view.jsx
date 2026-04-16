import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  Plus, ChevronLeft, ChevronRight, X, Trash2, Edit3, Briefcase,
  Users, Coffee, Camera, Clock, Zap, Activity, Target, PanelRight,
  AlignLeft, LayoutGrid, Video, Plane,
} from "lucide-react";
import {
  format, addDays, startOfWeek, startOfMonth, endOfMonth,
  isSameDay, differenceInDays, startOfDay, addMinutes,
  eachDayOfInterval, getDay, addMonths, subMonths,
} from "date-fns";

// ─── Grid geometry ────────────────────────────────────────────────────────────
const S_HR = 6;
const E_HR = 23;
const HH = 64; // pixels per hour
const SNAP = 0.25; // 15-min snap
const HOURS = Array.from({ length: E_HR - S_HR }, (_, i) => i + S_HR);

// ─── Formatters (24h / DD/MM/YYYY per brief) ──────────────────────────────────
const fmt24 = (hr) => {
  const h = Math.floor(hr), m = Math.round((hr - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const fmtDur = (hrs) => {
  const h = Math.floor(hrs), m = Math.round((hrs - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};
const snap = (hr) => Math.round(hr / SNAP) * SNAP;

// ─── Categories ───────────────────────────────────────────────────────────────
const CATS = {
  Shoot:    { color: "#ccfd01", text: "#1a1a1f", bg: "rgba(204,253,1,0.12)",  icon: <Camera size={11} strokeWidth={2.5}/> },
  Edit:     { color: "#5AC8FA", text: "#fff",    bg: "rgba(90,200,250,0.12)", icon: <Edit3 size={11} strokeWidth={2.5}/> },
  Admin:    { color: "#AF52DE", text: "#fff",    bg: "rgba(175,82,222,0.12)", icon: <Briefcase size={11} strokeWidth={2.5}/> },
  Meeting:  { color: "#FFB340", text: "#1a1a1f", bg: "rgba(255,179,64,0.12)", icon: <Users size={11} strokeWidth={2.5}/> },
  Personal: { color: "#34C759", text: "#fff",    bg: "rgba(52,199,89,0.12)",  icon: <Coffee size={11} strokeWidth={2.5}/> },
};
const CAT_LIST = Object.keys(CATS);

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: "t-deep",    name: "Deep Work",    dur: 120, cat: "Edit",     color: "#ccfd01", icon: <Target size={12}/> },
  { id: "t-shallow", name: "Shallow Work", dur: 30,  cat: "Admin",    color: "#AF52DE", icon: <Briefcase size={12}/> },
  { id: "t-call",    name: "Client Call",  dur: 30,  cat: "Meeting",  color: "#FFB340", icon: <Users size={12}/> },
  { id: "t-shoot",   name: "Shoot Day",    dur: 480, cat: "Shoot",    color: "#FF9500", icon: <Camera size={12}/> },
  { id: "t-edit",    name: "Edit Session", dur: 180, cat: "Edit",     color: "#5AC8FA", icon: <Edit3 size={12}/> },
  { id: "t-travel",  name: "Travel",       dur: 120, cat: "Personal", color: "#8E8E93", icon: <Plane size={12}/> },
  { id: "t-workout", name: "Workout",      dur: 45,  cat: "Personal", color: "#FF3B30", icon: <Activity size={12}/> },
  { id: "t-meal",    name: "Meal",         dur: 30,  cat: "Personal", color: "#F5E6C8", icon: <Coffee size={12}/> },
  { id: "t-buffer",  name: "Buffer",       dur: 15,  cat: "Admin",    color: "#3A3A3C", icon: <Clock size={12}/> },
];

// ─── Inbox tasks (connects to Tasks module Phase 2) ───────────────────────────
const INBOX_TASKS = [
  { id: "it-1", title: "Edit Brandon wedding highlights", project: "Brandon Wedding",  pri: "high",   dur: 180, cat: "Edit" },
  { id: "it-2", title: "Send invoice to Kyle",            project: "Admin",            pri: "high",   dur: 30,  cat: "Admin" },
  { id: "it-3", title: "Review Amara shot list",          project: "Amara Bali Shoot", pri: "medium", dur: 60,  cat: "Shoot" },
  { id: "it-4", title: "Nomaad landing page copy",        project: "Nomaad Build",     pri: "medium", dur: 120, cat: "Edit" },
  { id: "it-5", title: "Follow up with Harvey",           project: "CRM",              pri: "low",    dur: 30,  cat: "Meeting" },
  { id: "it-6", title: "Back up Mauritania footage",      project: "Travel Docs",      pri: "low",    dur: 60,  cat: "Edit" },
];
const PRI = { high: "#FF3B30", medium: "#FFB340", low: "#34C759" };

// ─── Natural language parser (stub - wires to Claude API in Phase 2) ──────────
function parseNL(text) {
  let cat = "Meeting";
  if (/shoot|location|on-?site/i.test(text)) cat = "Shoot";
  else if (/edit|cut|grade|colour|color|render/i.test(text)) cat = "Edit";
  else if (/invoice|admin|email|send|receipt/i.test(text)) cat = "Admin";
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
  const dh = text.match(/(\d+)\s*(?:h|hr|hours?)/i);
  if (dh) durMins = parseInt(dh[1]) * 60;
  const dm = text.match(/(\d+)\s*(?:m|min|minutes?)/i);
  if (dm) durMins = parseInt(dm[1]);
  const toM = text.match(/\bto\s+(\d{1,2})\s*(am|pm)/i);
  if (toM) {
    let eH = parseInt(toM[1]);
    if ((toM[2] || "").toLowerCase() === "pm" && eH < 12) eH += 12;
    durMins = Math.max(30, (eH - startHr) * 60);
  }

  let date = new Date();
  const dayMap = { monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6,sun:0 };
  if (/tomorrow/i.test(text)) { date = addDays(new Date(), 1); }
  else {
    for (const [k, v] of Object.entries(dayMap)) {
      if (new RegExp(`\\b${k}\\b`, "i").test(text)) {
        const diff = (v - new Date().getDay() + 7) % 7 || 7;
        date = addDays(new Date(), diff);
        break;
      }
    }
  }

  const title = text
    .replace(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi, "")
    .replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, "")
    .replace(/\bto\s+\d+(am|pm)\b/gi, "")
    .replace(/\b\d+(h|hr|hours?|m|min|minutes?)\b/gi, "")
    .replace(/\s+/g, " ").trim() || text;

  return {
    title,
    cat,
    startDate: date,
    startHr: snap(Math.max(S_HR, Math.min(E_HR - 0.5, startHr))),
    endHr: snap(Math.max(S_HR + 0.5, Math.min(E_HR, startHr + durMins / 60))),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function CalendarView({ t, dark, mobile, compact }) {
  const { user } = useAuth();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [view, setView]             = useState("week"); // week | day | month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blocks, setBlocks]         = useState([]);
  const [, setLoading]              = useState(true);
  const [selectedCat]               = useState("Edit");

  // ── Rail ────────────────────────────────────────────────────────────────────
  const [railOpen, setRailOpen]     = useState(!mobile);
  const [railTab, setRailTab]       = useState("templates"); // templates | tasks
  const [scheduled, setScheduled]   = useState(new Set()); // task ids placed on grid

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]   = useState(false);
  const [editBlock, setEditBlock]   = useState(null);
  const [quickOpen, setQuickOpen]   = useState(false);
  const [quickText, setQuickText]   = useState("");
  const [parsed, setParsed]         = useState(null);
  const [ctxMenu, setCtxMenu]       = useState(null); // { x, y, block }

  // ── Current time ────────────────────────────────────────────────────────────
  const [nowHr, setNowHr] = useState(() => {
    const n = new Date();
    return n.getHours() + n.getMinutes() / 60;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNowHr(n.getHours() + n.getMinutes() / 60);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  // ── Computed dates ───────────────────────────────────────────────────────────
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays  = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const gridRef   = useRef(null);
  const drag      = useRef({ type: null }); // drag state without re-renders
  const ghostRef  = useRef(null);
  const weekDRef  = useRef(weekDays);
  useEffect(() => { weekDRef.current = weekDays; }, [weekDays]);

  // ── Ghost (drag preview) ─────────────────────────────────────────────────────
  const [ghost, setGhostRaw] = useState(null);
  const setGhost = useCallback((g) => { ghostRef.current = g; setGhostRaw(g); }, []);

  // ── Scroll to current time on mount ─────────────────────────────────────────
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = Math.max(0, (nowHr - S_HR - 1.5) * HH);
    }
  }, [view]);

  // ─── Supabase ──────────────────────────────────────────────────────────────
  const fetchBlocks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let from, to;
    if (view === "month") {
      from = startOfMonth(currentDate);
      to   = endOfMonth(currentDate);
    } else if (view === "day") {
      from = startOfDay(currentDate);
      to   = addDays(from, 1);
    } else {
      from = weekStart;
      to   = addDays(weekStart, 7);
    }
    const { data } = await supabase
      .from("calendar_events")
      .select("*")
      .gte("start_time", from.toISOString())
      .lt("start_time", to.toISOString());

    if (data) {
      setBlocks(data.map(d => {
        const s = new Date(d.start_time), e = new Date(d.end_time);
        return {
          id: d.id, title: d.title,
          cat: d.type ? (d.type.charAt(0).toUpperCase() + d.type.slice(1)) : "Edit",
          startDate: s,
          startHr: s.getHours() + s.getMinutes() / 60,
          endHr: e.getHours() + e.getMinutes() / 60,
        };
      }));
    }
    setLoading(false);
  }, [user, view, currentDate, weekStart]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const saveBlock = async (b) => {
    if (!user) return;
    const day = b.startDate || weekDays[b.dayIdx] || new Date();
    const sTime = addMinutes(startOfDay(day), b.startHr * 60).toISOString();
    const eTime = addMinutes(startOfDay(day), b.endHr * 60).toISOString();
    const payload = { user_id: user.id, title: b.title, start_time: sTime, end_time: eTime, type: (b.cat || "edit").toLowerCase() };

    if (b.id && String(b.id).length > 10) {
      await supabase.from("calendar_events").update({ title: b.title, start_time: sTime, end_time: eTime, type: payload.type }).eq("id", b.id);
    } else {
      const { data } = await supabase.from("calendar_events").insert([payload]).select().single();
      if (data) {
        setBlocks(prev => prev.map(x => x.id === b.id ? { ...x, id: data.id } : x));
      }
    }
  };

  const deleteBlock = async (id) => {
    if (String(id).length > 10) await supabase.from("calendar_events").delete().eq("id", id);
    setBlocks(prev => prev.filter(x => x.id !== id));
    setModalOpen(false); setEditBlock(null); setCtxMenu(null);
  };

  const updateBlockPosition = async (b) => {
    if (!b.id || String(b.id).length <= 10) return;
    const day = b.startDate || new Date();
    const sTime = addMinutes(startOfDay(day), b.startHr * 60).toISOString();
    const eTime = addMinutes(startOfDay(day), b.endHr * 60).toISOString();
    await supabase.from("calendar_events").update({ start_time: sTime, end_time: eTime }).eq("id", b.id);
  };

  // ─── Navigation ────────────────────────────────────────────────────────────
  const navigate = (dir) => {
    if (view === "month") setCurrentDate(prev => dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
    else if (view === "day") setCurrentDate(prev => addDays(prev, dir));
    else setCurrentDate(prev => addDays(prev, dir * 7));
  };
  const goToday = () => setCurrentDate(new Date());

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      const key = e.key;
      if (key === "c" || key === "C") { setQuickOpen(true); setQuickText(""); setParsed(null); }
      else if (key === "t" || key === "T") goToday();
      else if (key === "j" || key === "J") navigate(1);
      else if (key === "k" || key === "K") navigate(-1);
      else if (key === "/" ) { e.preventDefault(); setQuickOpen(true); setQuickText(""); setParsed(null); }
      else if (key === "1") setView("week");
      else if (key === "2") setView("day");
      else if (key === "3") setView("month");
      else if (key === "Escape") { setModalOpen(false); setEditBlock(null); setQuickOpen(false); setCtxMenu(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view]);

  // ─── Grid mouse interactions ────────────────────────────────────────────────
  useEffect(() => {
    let moved = false;

    const onMove = (e) => {
      const d = drag.current;
      if (!d.type) return;
      const grid = gridRef.current;
      if (!grid) return;

      moved = true;
      const rect = grid.getBoundingClientRect();
      const y = e.clientY - rect.top + grid.scrollTop;
      const hr = S_HR + y / HH;

      if (d.type === "create") {
        const startHr = d.startHr;
        const endHr = snap(Math.max(startHr + 0.25, Math.min(E_HR, hr)));
        setGhost({ dayIdx: d.dayIdx, startDate: d.startDate, startHr, endHr, cat: selectedCat, title: "" });
      }

      if (d.type === "move") {
        const dur = d.original.endHr - d.original.startHr;
        let newStart = snap(Math.max(S_HR, Math.min(E_HR - dur, hr - d.offsetHr)));
        let newDayIdx = d.dayIdx;
        let newDate = d.original.startDate;

        // Detect column change in week view
        const cols = grid.querySelectorAll("[data-day-col]");
        for (let i = 0; i < cols.length; i++) {
          const cr = cols[i].getBoundingClientRect();
          if (e.clientX >= cr.left && e.clientX < cr.right) {
            newDayIdx = i;
            newDate = weekDRef.current[i];
            break;
          }
        }
        setGhost({ ...d.original, dayIdx: newDayIdx, startDate: newDate, startHr: newStart, endHr: newStart + dur, moving: true });
      }

      if (d.type === "resize") {
        const dY = e.clientY - d.startY;
        const newEnd = snap(Math.max(d.original.startHr + 0.25, Math.min(E_HR, d.original.endHr + dY / HH)));
        setGhost({ ...d.original, endHr: newEnd, resizing: true });
      }
    };

    const onUp = async (_e) => {
      const d = drag.current;
      if (!d.type) return;
      const g = ghostRef.current;

      if (d.type === "create") {
        if (moved && g) {
          openModal({ dayIdx: g.dayIdx, startDate: g.startDate, startHr: g.startHr, endHr: g.endHr, title: "", cat: selectedCat });
        } else {
          openModal({ dayIdx: d.dayIdx, startDate: d.startDate, startHr: d.startHr, endHr: snap(d.startHr + 1), title: "", cat: selectedCat });
        }
      }

      if (d.type === "move" && g) {
        const updated = { ...d.original, dayIdx: g.dayIdx, startDate: g.startDate, startHr: g.startHr, endHr: g.endHr };
        setBlocks(prev => prev.map(b => b.id === d.original.id ? updated : b));
        await updateBlockPosition(updated);
      }

      if (d.type === "resize" && g) {
        const updated = { ...d.original, endHr: g.endHr };
        setBlocks(prev => prev.map(b => b.id === d.original.id ? updated : b));
        await updateBlockPosition(updated);
      }

      drag.current = { type: null };
      moved = false;
      setGhost(null);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [selectedCat, setGhost]);

  const onGridMouseDown = useCallback((e, dayIdx, date) => {
    if (e.button !== 0) return;
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const y = e.clientY - rect.top + grid.scrollTop;
    const hr = snap(Math.max(S_HR, Math.min(E_HR, S_HR + y / HH)));
    drag.current = { type: "create", dayIdx, startDate: date, startHr: hr };
    e.preventDefault();
  }, []);

  const onEventMouseDown = useCallback((e, block) => {
    if (e.button !== 0 || e.target.dataset.resize) return;
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const y = e.clientY - rect.top + grid.scrollTop;
    const hr = S_HR + y / HH;
    const dayIdx = differenceInDays(startOfDay(block.startDate), startOfDay(weekDRef.current[0]));
    drag.current = { type: "move", dayIdx, original: block, offsetHr: hr - block.startHr, startY: e.clientY };
    e.preventDefault(); e.stopPropagation();
  }, []);

  const onResizeMouseDown = useCallback((e, block) => {
    if (e.button !== 0) return;
    drag.current = { type: "resize", original: block, startY: e.clientY };
    e.preventDefault(); e.stopPropagation();
  }, []);

  // ─── Rail drag (HTML5) ─────────────────────────────────────────────────────
  const [railDrag, setRailDrag]   = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { dayIdx, hr }

  const onRailDragStart = (e, item, type) => {
    setRailDrag({ item, type });
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", item.id);
  };

  const onGridDragOver = (e, dayIdx, hr) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropTarget({ dayIdx, hr: snap(hr) });
  };

  const onGridDrop = async (e, _dayIdx, date) => {
    e.preventDefault();
    if (!railDrag) return;
    const { item, type } = railDrag;
    const rect = gridRef.current?.getBoundingClientRect();
    const y = rect ? e.clientY - rect.top + gridRef.current.scrollTop : 0;
    const startHr = snap(Math.max(S_HR, Math.min(E_HR - (item.dur || 60) / 60, S_HR + y / HH)));
    const endHr = snap(Math.min(E_HR, startHr + (item.dur || 60) / 60));
    const cat = item.cat || item.category || selectedCat;
    const title = item.name || item.title;
    const tempId = `tmp-${Date.now()}`;
    const newBlock = { id: tempId, title, cat, startDate: date, startHr, endHr };
    setBlocks(prev => [...prev, newBlock]);
    if (type === "task") setScheduled(prev => new Set([...prev, item.id]));
    await saveBlock(newBlock);
    setRailDrag(null); setDropTarget(null);
  };

  const onGridDragLeave = () => setDropTarget(null);

  // ─── Quick create ──────────────────────────────────────────────────────────
  const handleQuickInput = (v) => {
    setQuickText(v);
    if (v.length > 3) setParsed(parseNL(v));
    else setParsed(null);
  };

  const confirmQuick = async () => {
    if (!parsed) return;
    const { title, cat, startDate, startHr, endHr } = parsed;
    const tempId = `tmp-${Date.now()}`;
    const newBlock = { id: tempId, title, cat, startDate, startHr, endHr };
    setBlocks(prev => [...prev, newBlock]);
    setQuickOpen(false); setQuickText(""); setParsed(null);
    await saveBlock(newBlock);
    fetchBlocks();
  };

  // ─── Modal helpers ─────────────────────────────────────────────────────────
  const openModal = (block) => { setEditBlock(block); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editBlock) return;
    const fd = new FormData(e.target);
    const title = fd.get("title") || "Untitled";
    const cat   = fd.get("cat") || selectedCat;
    const startHr = parseFloat(fd.get("startHr"));
    const endHr   = parseFloat(fd.get("endHr"));
    const updated = { ...editBlock, title, cat, startHr, endHr };

    if (editBlock.id && String(editBlock.id).length > 10) {
      setBlocks(prev => prev.map(b => b.id === editBlock.id ? updated : b));
    } else {
      const tempId = `tmp-${Date.now()}`;
      setBlocks(prev => [...prev, { ...updated, id: tempId }]);
    }
    setModalOpen(false); setEditBlock(null);
    await saveBlock(updated);
  };

  // ─── Style helpers ─────────────────────────────────────────────────────────
  const ease = "all 0.3s cubic-bezier(.4,0,.2,1)";
  const card = (ex = {}) => ({
    background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20,
    boxShadow: t.cardShadow, backdropFilter: "blur(24px) saturate(1.6)", ...ex,
  });
  const hexToRgb = (hex) => {
    if (!hex || !hex.startsWith("#")) return "255,255,255";
    const c = parseInt(hex.slice(1), 16);
    return `${(c >> 16) & 255},${(c >> 8) & 255},${c & 255}`;
  };

  // ─── Time options for selects ──────────────────────────────────────────────
  const TIME_OPTS = [];
  for (let h = S_HR; h <= E_HR; h += 0.25) TIME_OPTS.push({ value: h, label: fmt24(h) });

  // ─── Block rendering ───────────────────────────────────────────────────────
  const renderBlock = (block, _dayIdx, opts = {}) => {
    const { isGhost = false, faded = false } = opts;
    const c = CATS[block.cat] || CATS.Edit;
    const top = (block.startHr - S_HR) * HH;
    const height = Math.max(20, (block.endHr - block.startHr) * HH);
    const short = height < 44;

    return (
      <div
        key={block.id + (isGhost ? "-ghost" : "")}
        data-event={!isGhost ? "1" : undefined}
        onMouseDown={!isGhost ? (e) => onEventMouseDown(e, block) : undefined}
        onContextMenu={!isGhost ? (e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, block }); } : undefined}
        style={{
          position: "absolute", top: top + 1, height: height - 2,
          left: 3, right: 3,
          background: isGhost ? `rgba(${hexToRgb(c.color)}, 0.18)` : (dark ? c.bg : c.bg.replace("0.12", "0.18")),
          borderLeft: `3px solid ${c.color}`,
          borderRadius: 8,
          border: isGhost ? `1.5px dashed ${c.color}` : undefined,
          padding: short ? "2px 8px" : "6px 10px",
          overflow: "hidden", cursor: isGhost ? "default" : "grab",
          opacity: faded ? 0.35 : isGhost ? 0.8 : 1,
          backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", gap: short ? 0 : 2,
          userSelect: "none",
          zIndex: isGhost ? 20 : 10,
          transition: isGhost ? "none" : "box-shadow 0.15s ease",
          outline: isGhost ? "none" : undefined,
        }}
        onMouseEnter={!isGhost ? (e) => { e.currentTarget.style.boxShadow = `0 4px 16px rgba(${hexToRgb(c.color)},0.3)`; } : undefined}
        onMouseLeave={!isGhost ? (e) => { e.currentTarget.style.boxShadow = "none"; } : undefined}
      >
        {!short && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: c.color, display: "flex" }}>{c.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: c.color, fontVariantNumeric: "tabular-nums" }}>
              {fmt24(block.startHr)} - {fmt24(block.endHr)}
            </span>
          </div>
        )}
        <div style={{ fontSize: short ? 11 : 12, fontWeight: 600, color: t.text, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: short ? "nowrap" : "normal" }}>
          {block.title || (isGhost ? "New event" : "Untitled")}
        </div>
        {!short && height >= 80 && (
          <div style={{ fontSize: 10, color: t.sub, marginTop: "auto" }}>{fmtDur(block.endHr - block.startHr)}</div>
        )}
        {/* Resize handle */}
        {!isGhost && (
          <div
            data-resize="1"
            onMouseDown={(e) => onResizeMouseDown(e, block)}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, cursor: "ns-resize", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <div style={{ width: 24, height: 2, borderRadius: 1, background: `rgba(${hexToRgb(c.color)},0.4)` }} />
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK / DAY GRID (shared)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderGrid = (days) => {
    return (
      <div style={{ ...card(), flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", marginTop: 12 }}>
        {/* Day headers */}
        <div style={{ display: "flex", borderBottom: `1px solid ${t.divider}`, flexShrink: 0 }}>
          <div style={{ width: 52, flexShrink: 0 }} />
          {days.map((day, idx) => {
            const tod = isSameDay(day, new Date());
            return (
              <div key={idx} style={{ flex: 1, textAlign: "center", padding: "12px 0 8px", borderLeft: `1px solid ${t.divider}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: tod ? t.accent : t.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                  {format(day, "EEE")}
                </div>
                <div
                  onClick={() => { setCurrentDate(day); setView("day"); }}
                  style={{ width: 28, height: 28, margin: "0 auto", borderRadius: "50%", background: tod ? t.accentGrad : "transparent", color: tod ? t.accentText : t.sub, fontSize: 14, fontWeight: tod ? 700 : 500, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: tod ? t.accentGlow : "none" }}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable time grid */}
        <div
          ref={gridRef}
          style={{ flex: 1, overflowY: "auto", display: "flex", position: "relative" }}
          onDragLeave={onGridDragLeave}
        >
          {/* Time gutter */}
          <div style={{ width: 52, flexShrink: 0 }}>
            {HOURS.map(hr => (
              <div key={hr} style={{ height: HH, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: t.muted, fontVariantNumeric: "tabular-nums", transform: "translateY(-5px)" }}>
                  {fmt24(hr)}
                </span>
              </div>
            ))}
          </div>

          {/* Columns */}
          <div style={{ display: "flex", flex: 1, position: "relative" }}>
            {/* Grid lines */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
              {HOURS.map(hr => (
                <div key={hr} style={{ height: HH, borderBottom: `1px solid ${t.gridLine}` }}>
                  <div style={{ height: "50%", borderBottom: `1px dashed ${dark ? "rgba(255,255,255,0.022)" : "rgba(0,0,0,0.028)"}` }} />
                </div>
              ))}
            </div>

            {/* Current time line */}
            {days.some(d => isSameDay(d, new Date())) && (
              <div style={{ position: "absolute", top: (nowHr - S_HR) * HH, left: 0, right: 0, zIndex: 6, pointerEvents: "none", display: "flex", alignItems: "center" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF453A", marginLeft: -4, flexShrink: 0 }} />
                <div style={{ flex: 1, height: 1.5, background: "linear-gradient(to right, #FF453A, rgba(255,69,58,0.2))" }} />
              </div>
            )}

            {/* Day columns */}
            {days.map((day, colIdx) => {
              const dayBlocks = blocks.filter(b => isSameDay(b.startDate, day));
              const ghostHere = ghost && isSameDay(ghost.startDate, day);
              const movingId = ghost?.moving ? ghost.id : null;
              const isDropTarget = dropTarget && dropTarget.dayIdx === colIdx;

              return (
                <div
                  key={colIdx}
                  data-day-col={colIdx}
                  style={{
                    flex: 1, borderLeft: `1px solid ${t.divider}`, position: "relative", zIndex: 1,
                    background: isDropTarget ? `rgba(${hexToRgb(t.accent || "#ccfd01")},0.04)` : "transparent",
                    transition: ease,
                  }}
                  onMouseDown={(e) => {
                    if (!e.target.dataset.event && !e.target.dataset.resize) onGridMouseDown(e, colIdx, day);
                  }}
                  onDragOver={(e) => {
                    const rect = gridRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const y = e.clientY - rect.top + gridRef.current.scrollTop;
                    onGridDragOver(e, colIdx, S_HR + y / HH);
                  }}
                  onDrop={(e) => onGridDrop(e, colIdx, day)}
                >
                  {/* Drop zone indicator */}
                  {isDropTarget && railDrag && (
                    <div style={{
                      position: "absolute", top: ((dropTarget.hr - S_HR)) * HH,
                      height: ((railDrag.item.dur || 60) / 60) * HH, left: 3, right: 3,
                      background: `rgba(${hexToRgb(CATS[railDrag.item.cat || "Edit"]?.color || "#ccfd01")},0.15)`,
                      borderRadius: 8, border: `2px dashed rgba(${hexToRgb(CATS[railDrag.item.cat || "Edit"]?.color || "#ccfd01")},0.5)`,
                      pointerEvents: "none", zIndex: 8,
                    }} />
                  )}

                  {/* Events */}
                  {dayBlocks.map(b => renderBlock(b, colIdx, { faded: b.id === movingId }))}

                  {/* Ghost */}
                  {ghostHere && renderBlock(ghost, colIdx, { isGhost: true })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MONTH VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  const renderMonth = () => {
    const mStart = startOfMonth(currentDate);
    const mEnd   = endOfMonth(currentDate);
    const padStart = (getDay(mStart) + 6) % 7;
    const allDays = [
      ...Array.from({ length: padStart }, (_, i) => addDays(mStart, -(padStart - i))),
      ...eachDayOfInterval({ start: mStart, end: mEnd }),
    ];
    // Pad to full weeks
    while (allDays.length % 7 !== 0) allDays.push(addDays(allDays[allDays.length - 1], 1));
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div style={{ ...card(), flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", marginTop: 12 }}>
        {/* DOW headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: `1px solid ${t.divider}`, flexShrink: 0 }}>
          {dayNames.map(d => (
            <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: t.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>{d}</div>
          ))}
        </div>
        {/* Day grid */}
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(7,1fr)", gridAutoRows: "minmax(80px,1fr)", alignContent: "start" }}>
          {allDays.map((day, i) => {
            const inMonth = day.getMonth() === currentDate.getMonth();
            const tod = isSameDay(day, new Date());
            const dayEvts = blocks.filter(b => isSameDay(b.startDate, day));
            const totalHrs = dayEvts.reduce((s, b) => s + (b.endHr - b.startHr), 0);
            const heatPct = Math.min(1, totalHrs / 8);

            return (
              <div
                key={i}
                onClick={() => { setCurrentDate(day); setView("day"); }}
                style={{
                  borderRight: (i + 1) % 7 !== 0 ? `1px solid ${t.divider}` : "none",
                  borderBottom: `1px solid ${t.divider}`,
                  padding: "8px", cursor: "pointer",
                  background: heatPct > 0 ? `rgba(${hexToRgb(VOLT)},${heatPct * 0.07})` : "transparent",
                  opacity: inMonth ? 1 : 0.35,
                  transition: ease,
                  position: "relative",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"; }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = heatPct > 0
                    ? `rgba(${hexToRgb(VOLT)},${heatPct * 0.07})`
                    : "transparent";
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: tod ? t.accentGrad : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: tod ? 700 : 500, color: tod ? t.accentText : (inMonth ? t.text : t.muted), marginBottom: 6, boxShadow: tod ? t.accentGlow : "none" }}>
                  {format(day, "d")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {dayEvts.slice(0, 3).map(ev => {
                    const c = CATS[ev.cat] || CATS.Edit;
                    return (
                      <div key={ev.id} onClick={e => { e.stopPropagation(); openModal(ev); }} style={{ fontSize: 10, fontWeight: 600, color: c.color, background: `rgba(${hexToRgb(c.color)},0.12)`, borderRadius: 4, padding: "1px 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}>
                        {fmt24(ev.startHr)} {ev.title}
                      </div>
                    );
                  })}
                  {dayEvts.length > 3 && (
                    <div style={{ fontSize: 10, color: t.muted, fontWeight: 600 }}>+{dayEvts.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // INBOX RAIL
  // ─────────────────────────────────────────────────────────────────────────────
  const renderRail = () => (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: mobile ? "100%" : 260, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      style={{ overflow: "hidden", flexShrink: 0 }}
    >
      <div style={{ width: mobile ? "100%" : 260, height: "100%", display: "flex", flexDirection: "column", paddingLeft: 14 }}>
        <div style={{ ...card({ padding: 0 }), flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Rail tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${t.divider}`, padding: "8px 8px 0", gap: 4, flexShrink: 0 }}>
            {["templates", "tasks"].map(tab => (
              <button
                key={tab}
                onClick={() => setRailTab(tab)}
                style={{ flex: 1, padding: "7px 0", borderRadius: "10px 10px 0 0", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: ease, background: railTab === tab ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent", color: railTab === tab ? t.text : t.muted, borderBottom: railTab === tab ? `2px solid ${t.accent}` : "2px solid transparent" }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
            {railTab === "templates" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Drag onto any time slot</p>
                {TEMPLATES.map(tpl => (
                  <div
                    key={tpl.id}
                    draggable
                    onDragStart={(e) => onRailDragStart(e, tpl, "template")}
                    onDragEnd={() => { setRailDrag(null); setDropTarget(null); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, cursor: "grab", transition: ease, userSelect: "none" }}
                    onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${tpl.color}44`; e.currentTarget.style.background = `rgba(${hexToRgb(tpl.color)},0.06)`; }}
                    onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${t.inputBorder}`; e.currentTarget.style.background = t.input; }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `rgba(${hexToRgb(tpl.color)},0.15)`, display: "flex", alignItems: "center", justifyContent: "center", color: tpl.color, flexShrink: 0 }}>
                      {tpl.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{tpl.name}</div>
                      <div style={{ fontSize: 10, color: t.muted }}>{fmtDur(tpl.dur / 60)}</div>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: tpl.color, background: `rgba(${hexToRgb(tpl.color)},0.1)`, padding: "2px 6px", borderRadius: 6 }}>{tpl.cat}</div>
                  </div>
                ))}
              </div>
            )}

            {railTab === "tasks" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Drag to timebox</p>
                {INBOX_TASKS.filter(tk => !scheduled.has(tk.id)).map(tk => {
                  const c = CATS[tk.cat] || CATS.Edit;
                  return (
                    <div
                      key={tk.id}
                      draggable
                      onDragStart={(e) => onRailDragStart(e, tk, "task")}
                      onDragEnd={() => { setRailDrag(null); setDropTarget(null); }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, cursor: "grab", transition: ease, userSelect: "none" }}
                      onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${c.color}44`; }}
                      onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${t.inputBorder}`; }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: PRI[tk.pri], marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: t.text, lineHeight: 1.3 }}>{tk.title}</div>
                        <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>{tk.project} · {fmtDur(tk.dur / 60)}</div>
                      </div>
                    </div>
                  );
                })}
                {INBOX_TASKS.filter(tk => !scheduled.has(tk.id)).length === 0 && (
                  <p style={{ fontSize: 12, color: t.muted, fontStyle: "italic", textAlign: "center", marginTop: 20 }}>All tasks scheduled</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const VOLT = "#ccfd01";

  // ─────────────────────────────────────────────────────────────────────────────
  // Header date label
  // ─────────────────────────────────────────────────────────────────────────────
  const headerLabel = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "day")   return format(currentDate, "EEEE, dd/MM/yyyy");
    return `${format(weekStart, "dd MMM")} - ${format(addDays(weekStart, 6), "dd MMM yyyy")}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>

      {/* ── Header ── */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: mobile ? "4px 2px 0" : "8px 4px 0", flexShrink: 0, gap: 8, marginLeft: mobile ? 48 : 0, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
          <div>
            <h1 style={{ fontSize: compact ? 22 : 26, fontWeight: 700, letterSpacing: -0.6, color: t.text }}>Calendar</h1>
            <p style={{ fontSize: 12, color: t.sub, marginTop: 1 }}>{headerLabel()}</p>
          </div>

          {/* View switcher */}
          <div style={{ display: "flex", background: t.input, borderRadius: 12, border: `1px solid ${t.inputBorder}`, padding: 3 }}>
            {[
              { id: "week",  label: "Week",  icon: <LayoutGrid size={13}/> },
              { id: "day",   label: "Day",   icon: <AlignLeft size={13}/> },
              { id: "month", label: "Month", icon: <Video size={13}/> },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 9, fontSize: 12, fontWeight: view === v.id ? 600 : 500, color: view === v.id ? t.accentText : t.sub, background: view === v.id ? t.accentGrad : "transparent", boxShadow: view === v.id ? t.accentGlow : "none", border: "none", cursor: "pointer", transition: ease }}>
                {v.icon} {!mobile && v.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* Nav */}
          <div style={{ display: "flex", background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: 3, boxShadow: t.cardShadow }}>
            <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "none", color: t.sub, padding: "4px 8px", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center" }}><ChevronLeft size={14}/></button>
            <button onClick={goToday} style={{ background: "transparent", border: "none", color: t.sub, padding: "4px 10px", cursor: "pointer", borderRadius: 8, fontSize: 12, fontWeight: 600, color: t.text }}>Today</button>
            <button onClick={() => navigate(1)} style={{ background: "transparent", border: "none", color: t.sub, padding: "4px 8px", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center" }}><ChevronRight size={14}/></button>
          </div>

          {/* Quick create (C shortcut) */}
          <button onClick={() => { setQuickOpen(true); setQuickText(""); setParsed(null); }} style={{ height: 34, padding: "0 14px", borderRadius: 18, border: "none", background: t.accentGrad, color: t.accentText, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", boxShadow: t.accentGlow }}>
            <Zap size={13}/> {!mobile && "New"}
          </button>

          {/* Rail toggle */}
          <button onClick={() => setRailOpen(v => !v)} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${railOpen ? t.accent : t.cardBorder}`, background: railOpen ? `rgba(${hexToRgb(VOLT)},0.1)` : t.card, color: railOpen ? t.accent : t.sub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: ease }}>
            <PanelRight size={15}/>
          </button>
        </div>
      </header>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, gap: 0 }}>
        {/* Calendar area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {view === "week"  && renderGrid(weekDays)}
          {view === "day"   && renderGrid([currentDate])}
          {view === "month" && renderMonth()}
        </div>

        {/* Inbox rail */}
        <AnimatePresence>
          {railOpen && renderRail()}
        </AnimatePresence>
      </div>

      {/* ── Context menu ── */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{ position: "fixed", top: ctxMenu.y, left: ctxMenu.x, zIndex: 300, background: dark ? "rgba(28,28,32,0.97)" : "rgba(255,255,255,0.97)", border: `1px solid ${t.cardBorder}`, borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.25)", backdropFilter: "blur(32px)", padding: "6px", minWidth: 160 }}
            onMouseLeave={() => setCtxMenu(null)}
          >
            {[
              { label: "Edit", icon: <Edit3 size={13}/>, action: () => { openModal(ctxMenu.block); setCtxMenu(null); } },
              { label: "Duplicate", icon: <Plus size={13}/>, action: () => {
                const b = { ...ctxMenu.block, id: `tmp-${Date.now()}`, startHr: ctxMenu.block.startHr + 0.5, endHr: ctxMenu.block.endHr + 0.5 };
                setBlocks(prev => [...prev, b]);
                saveBlock(b);
                setCtxMenu(null);
              }},
              { label: "Delete", icon: <Trash2 size={13}/>, action: () => deleteBlock(ctxMenu.block.id), danger: true },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", border: "none", background: "transparent", color: item.danger ? t.red : t.text, fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 8, textAlign: "left" }}
                onMouseEnter={e => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick create (C / / shortcut) ── */}
      <AnimatePresence>
        {quickOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh", background: dark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) { setQuickOpen(false); setQuickText(""); setParsed(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{ background: dark ? "rgba(22,22,28,0.98)" : "rgba(255,255,255,0.98)", border: `1px solid ${t.cardBorder}`, borderRadius: 20, width: Math.min(560, window.innerWidth - 32), boxShadow: "0 24px 80px rgba(0,0,0,0.3)", backdropFilter: "blur(40px)", overflow: "hidden" }}
            >
              {/* Input */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px" }}>
                <Zap size={18} style={{ color: t.accent, flexShrink: 0 }}/>
                <input
                  autoFocus
                  value={quickText}
                  onChange={e => handleQuickInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && parsed) confirmQuick();
                    if (e.key === "Escape") { setQuickOpen(false); setQuickText(""); setParsed(null); }
                  }}
                  placeholder="Shoot Brandon wedding Friday 9am to 6pm at Prideaux Estate..."
                  style={{ flex: 1, background: "transparent", border: "none", color: t.text, fontSize: 15, fontWeight: 500, outline: "none", fontFamily: "inherit" }}
                />
                <kbd style={{ fontSize: 10, fontWeight: 600, color: t.muted, background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 6, padding: "2px 6px" }}>ESC</kbd>
              </div>

              {/* Parsed preview */}
              {parsed && (
                <>
                  <div style={{ height: 1, background: t.divider }} />
                  <div style={{ padding: "14px 20px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${hexToRgb(CATS[parsed.cat]?.color || "#ccfd01")},0.15)`, display: "flex", alignItems: "center", justifyContent: "center", color: CATS[parsed.cat]?.color, flexShrink: 0, fontSize: 16 }}>
                      {CATS[parsed.cat]?.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{parsed.title}</div>
                      <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>
                        {format(parsed.startDate, "EEEE dd/MM")} · {fmt24(parsed.startHr)} - {fmt24(parsed.endHr)} · {parsed.cat}
                      </div>
                    </div>
                    <button
                      onClick={confirmQuick}
                      style={{ padding: "8px 16px", borderRadius: 12, border: "none", background: t.accentGrad, color: t.accentText, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: t.accentGlow }}
                    >
                      Create
                    </button>
                  </div>
                </>
              )}
              {!parsed && quickText.length > 0 && (
                <div style={{ padding: "10px 20px 14px", fontSize: 12, color: t.muted }}>
                  Try: "shoot Brandon wedding Friday 9am to 6pm" or "client call tomorrow 14:00 for 30m"
                </div>
              )}
              {!quickText && (
                <div style={{ padding: "0 20px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Deep Work 2h", "Client call tomorrow 10am", "Edit session Friday 13:00 3h", "Shoot day Monday 8am to 6pm"].map(ex => (
                    <button key={ex} onClick={() => handleQuickInput(ex)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.sub, cursor: "pointer", fontFamily: "inherit" }}>
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Event create / edit modal ── */}
      <AnimatePresence>
        {modalOpen && editBlock && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: dark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) { setModalOpen(false); setEditBlock(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{ background: dark ? "rgba(24,24,28,0.98)" : "rgba(255,255,255,0.98)", border: `1px solid ${t.cardBorder}`, borderRadius: 24, padding: 28, width: Math.min(420, window.innerWidth - 32), boxShadow: "0 24px 80px rgba(0,0,0,0.3)", backdropFilter: "blur(40px)", position: "relative" }}
            >
              <button onClick={() => { setModalOpen(false); setEditBlock(null); }} style={{ position: "absolute", top: 16, right: 16, width: 28, height: 28, borderRadius: "50%", background: t.input, border: "none", color: t.sub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={13}/>
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, marginBottom: 22, color: t.text }}>
                {editBlock.id ? "Edit Event" : "New Event"}
              </h2>

              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Title</label>
                  <input name="title" defaultValue={editBlock.title || ""} placeholder="What are you working on?" autoFocus style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Category</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {CAT_LIST.map(cid => {
                      const c = CATS[cid];
                      const active = (editBlock.cat || selectedCat) === cid;
                      return (
                        <label key={cid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 20, cursor: "pointer", background: active ? `rgba(${hexToRgb(c.color)},0.15)` : t.input, border: `1.5px solid ${active ? c.color : t.inputBorder}`, boxShadow: active ? `0 2px 8px rgba(${hexToRgb(c.color)},0.2)` : "none", transition: ease }}>
                          <input type="radio" name="cat" value={cid} defaultChecked={active} onChange={() => setEditBlock({ ...editBlock, cat: cid })} style={{ display: "none" }} />
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.color }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: active ? c.color : t.sub }}>{cid}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Start</label>
                    <select name="startHr" defaultValue={editBlock.startHr} style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}>
                      {TIME_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>End</label>
                    <select name="endHr" defaultValue={editBlock.endHr} style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}>
                      {TIME_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  {editBlock.id && String(editBlock.id).length > 10 ? (
                    <button type="button" onClick={() => deleteBlock(editBlock.id)} style={{ padding: "9px 14px", borderRadius: 12, background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.15)", color: t.red, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <Trash2 size={13}/> Delete
                    </button>
                  ) : <div />}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => { setModalOpen(false); setEditBlock(null); }} style={{ padding: "9px 16px", borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: "transparent", color: t.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button type="submit" style={{ padding: "9px 18px", borderRadius: 12, border: "none", background: t.accentGrad, color: t.accentText, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: t.accentGlow }}>
                      {editBlock.id ? "Save" : "Create"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard hint */}
      {!mobile && (
        <div style={{ flexShrink: 0, paddingTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[["C", "New event"], ["T", "Today"], ["J/K", "Navigate"], ["/", "Quick create"], ["1-3", "Switch view"]].map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: t.muted }}>
              <kbd style={{ background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 5, padding: "1px 6px", fontFamily: "inherit", fontSize: 10, fontWeight: 600, color: t.sub }}>{key}</kbd>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
