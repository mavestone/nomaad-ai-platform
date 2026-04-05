import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, X, Video, Edit3, Briefcase, Users, Coffee, Trash2, Clock, GripVertical } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, differenceInDays, startOfDay, addHours, addMinutes } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';


const CATEGORIES = [
  { id: 'Shoot', label: 'Shoot', color: '#ccfd01', textColor: '#1a1a1f', darkBg: 'rgba(204,253,1,0.12)', lightBg: 'rgba(204,253,1,0.15)', icon: <Video size={11} strokeWidth={2.5} /> },
  { id: 'Edit', label: 'Edit', color: '#5AC8FA', textColor: '#fff', darkBg: 'rgba(90,200,250,0.12)', lightBg: 'rgba(90,200,250,0.15)', icon: <Edit3 size={11} strokeWidth={2.5} /> },
  { id: 'Admin', label: 'Admin', color: '#AF52DE', textColor: '#fff', darkBg: 'rgba(175,82,222,0.12)', lightBg: 'rgba(175,82,222,0.15)', icon: <Briefcase size={11} strokeWidth={2.5} /> },
  { id: 'Meeting', label: 'Meeting', color: '#FFB340', textColor: '#1a1a1f', darkBg: 'rgba(255,179,64,0.12)', lightBg: 'rgba(255,179,64,0.15)', icon: <Users size={11} strokeWidth={2.5} /> },
  { id: 'Personal', label: 'Personal', color: '#34C759', textColor: '#fff', darkBg: 'rgba(52,199,89,0.12)', lightBg: 'rgba(52,199,89,0.15)', icon: <Coffee size={11} strokeWidth={2.5} /> },
];

const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => i + START_HOUR);
const HOUR_HEIGHT = 64;

// Initial blocks removed. Fetched from Supabase DB.


const fmtTime = (hr) => {
  const h = Math.floor(hr);
  const m = Math.round((hr - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const dh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${dh}:${m < 10 ? '0' + m : m} ${ampm}`;
};

const fmtDuration = (hrs) => {
  const h = Math.floor(hrs);
  const m = Math.round((hrs - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Generate time options for selects (6:00 AM to 10:00 PM in 30-min increments)
const TIME_OPTIONS = [];
for (let h = START_HOUR; h <= END_HOUR; h += 0.5) {
  TIME_OPTIONS.push({ value: h, label: fmtTime(h) });
}

export default function CalendarView({ t, dark, mobile, compact }) {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBlock, setEditBlock] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [selectedCat, setSelectedCat] = useState('Edit');
  const [weekOffset, setWeekOffset] = useState(0);
  const gridRef = useRef(null);
  const ease = 'all 0.3s cubic-bezier(.4,0,.2,1)';

  const today = new Date(); // Changed to dynamic today
  const startOfWk = addDays(startOfWeek(today, { weekStartsOn: 1 }), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfWk, i));

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, weekOffset]);

  const fetchEvents = async () => {
    const start = startOfWk.toISOString();
    const end = addDays(startOfWk, 7).toISOString();
    
    const { data } = await supabase.from('calendar_events')
      .select('*')
      .gte('start_time', start)
      .lt('start_time', end);
      
    if (data) {
      setBlocks(data.map(d => {
        const sTime = new Date(d.start_time);
        const eTime = new Date(d.end_time);
        const dayIdx = differenceInDays(startOfDay(sTime), startOfDay(startOfWk));
        return {
          id: d.id,
          dayIdx,
          startHr: sTime.getHours() + sTime.getMinutes() / 60,
          endHr: eTime.getHours() + eTime.getMinutes() / 60,
          title: d.title,
          category: d.type.charAt(0).toUpperCase() + d.type.slice(1) // Title case
        };
      }));
    }
  };

  // Stats
  const totalHours = blocks.reduce((acc, b) => acc + (b.endHr - b.startHr), 0);
  const stats = CATEGORIES.map(cat => {
    const hrs = blocks.filter(b => b.category === cat.id).reduce((acc, b) => acc + (b.endHr - b.startHr), 0);
    return { ...cat, hrs, pct: totalHours > 0 ? Math.round((hrs / totalHours) * 100) : 0 };
  }).filter(s => s.hrs > 0).sort((a, b) => b.hrs - a.hrs);

  // Current time indicator (mock: 11:30 AM)
  const currentHr = 11.5;
  const currentTimeTop = (currentHr - START_HOUR) * HOUR_HEIGHT;
  const currentDayIdx = 0; // Monday

  const handleGridClick = (dayIdx, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawHr = START_HOUR + (y / HOUR_HEIGHT);
    const snapped = Math.floor(rawHr * 2) / 2;
    setEditBlock({
      dayIdx,
      startHr: snapped,
      endHr: Math.min(snapped + 1.0, END_HOUR),
      title: '',
      category: selectedCat,
    });
    setModalOpen(true);
  };

  const openEditBlock = (block, e) => {
    e.stopPropagation();
    setEditBlock({ ...block });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.target);
    
    const dayIdx = parseInt(fd.get('dayIdx'), 10);
    const startHr = parseFloat(fd.get('startHr'));
    const endHr = parseFloat(fd.get('endHr'));
    const title = fd.get('title') || 'Untitled Block';
    const category = fd.get('category');
    
    const targetDay = addDays(startOfWk, dayIdx);
    const sTime = addMinutes(startOfDay(targetDay), startHr * 60).toISOString();
    const eTime = addMinutes(startOfDay(targetDay), endHr * 60).toISOString();

    const isEdit = editBlock.id && String(editBlock.id).length > 20; // Check UUID length roughly

    if (isEdit) {
      await supabase.from('calendar_events').update({
        title, start_time: sTime, end_time: eTime, type: category.toLowerCase()
      }).eq('id', editBlock.id);
    } else {
      await supabase.from('calendar_events').insert([{
        user_id: user.id, title, start_time: sTime, end_time: eTime, type: category.toLowerCase()
      }]);
    }
    
    fetchEvents();
    setModalOpen(false);
    setEditBlock(null);
  };

  const handleDelete = async () => {
    if (editBlock?.id && String(editBlock.id).length > 20) {
      await supabase.from('calendar_events').delete().eq('id', editBlock.id);
      fetchEvents();
    } else {
      setBlocks(blocks.filter(x => x.id !== editBlock.id));
    }
    setModalOpen(false);
    setEditBlock(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: mobile ? 'flex-start' : 'center', flexShrink: 0, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: compact ? 22 : 26, fontWeight: 700, letterSpacing: -0.6 }}>Time Blocks</h1>
          <p style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>Week of {format(startOfWk, 'MMMM d, yyyy')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: t.card, border: `1px solid ${t.cardBorder}`, padding: 3, borderRadius: 12, boxShadow: t.cardShadow, backdropFilter: 'blur(20px)' }}>
            <button onClick={() => setWeekOffset(prev => prev - 1)} style={{ background: 'transparent', border: 'none', color: t.sub, display: 'flex', alignItems: 'center', padding: '5px 8px', cursor: 'pointer', borderRadius: 8 }}><ChevronLeft size={15} /></button>
            <span style={{ fontSize: 13, fontWeight: 600, padding: '5px 10px', display: 'flex', alignItems: 'center', color: t.text }}>{weekOffset === 0 ? 'This Week' : weekOffset > 0 ? `+${weekOffset} Wk` : `${weekOffset} Wk`}</span>
            <button onClick={() => setWeekOffset(prev => prev + 1)} style={{ background: 'transparent', border: 'none', color: t.sub, display: 'flex', alignItems: 'center', padding: '5px 8px', cursor: 'pointer', borderRadius: 8 }}><ChevronRight size={15} /></button>
          </div>
          <button onClick={() => { setEditBlock({ dayIdx: 0, startHr: 9, endHr: 10, title: '', category: selectedCat }); setModalOpen(true); }} style={{ height: 36, padding: '0 16px', borderRadius: 18, border: 'none', background: t.accentGrad, color: t.accentText, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: t.accentGlow, transition: ease }}>
            <Plus size={15} strokeWidth={2.5} /> Block
          </button>
        </div>
      </div>

      {/* ── Weekly Mix Stats (Apple Health inspired) ── */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0, overflowX: 'auto', paddingBottom: 2 }}>
        {/* Total hours pill */}
        <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: '12px 18px', boxShadow: t.cardShadow, backdropFilter: 'blur(20px) saturate(1.6)', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 100, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: t.text }}>{totalHours}h</span>
        </div>
        
        {/* Category breakdown */}
        {stats.map(s => (
          <div key={s.id} onClick={() => setSelectedCat(s.id)} style={{ background: selectedCat === s.id ? (dark ? `${s.color}18` : `${s.color}22`) : t.card, border: `1px solid ${selectedCat === s.id ? `${s.color}44` : t.cardBorder}`, borderRadius: 16, padding: '12px 18px', boxShadow: selectedCat === s.id ? `0 2px 12px ${s.color}22` : t.cardShadow, backdropFilter: 'blur(20px) saturate(1.6)', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110, flexShrink: 0, cursor: 'pointer', transition: ease }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: t.sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: t.text }}>{fmtDuration(s.hrs)}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.pct}%</span>
            </div>
            {/* Mini bar */}
            <div style={{ width: '100%', height: 3, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
              <div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: 2, transition: ease }} />
            </div>
          </div>
        ))}

        {/* Category quick-select legend */}
        <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: '10px 14px', boxShadow: t.cardShadow, backdropFilter: 'blur(20px) saturate(1.6)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, minWidth: 90, flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Quick Add</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setSelectedCat(c.id)} style={{ width: 22, height: 22, borderRadius: 6, background: selectedCat === c.id ? c.color : (dark ? `${c.color}22` : `${c.color}18`), border: selectedCat === c.id ? `2px solid ${c.color}` : `1px solid ${c.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: ease, color: selectedCat === c.id ? c.textColor : c.color }} title={c.label}>
                {c.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar Grid ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', overflow: 'hidden' }}>

        {/* Day Headers */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${t.divider}`, flexShrink: 0 }}>
          <div style={{ width: 56, flexShrink: 0 }} />
          {weekDays.map((day, idx) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={idx} style={{ flex: 1, textAlign: 'center', padding: '14px 0 10px', borderLeft: `1px solid ${t.divider}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? t.accent : t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{format(day, 'EEE')}</div>
                <div style={{
                  width: 30, height: 30, margin: '0 auto', borderRadius: '50%',
                  background: isToday ? t.accentGrad : 'transparent',
                  color: isToday ? t.accentText : t.sub,
                  fontSize: 15, fontWeight: isToday ? 700 : 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isToday ? t.accentGlow : 'none',
                  transition: ease
                }}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Grid */}
        <div ref={gridRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', position: 'relative' }}>

          {/* Time gutter */}
          <div style={{ width: 56, flexShrink: 0, position: 'relative' }}>
            {HOURS.map(hr => (
              <div key={hr} style={{ height: HOUR_HEIGHT, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 10, paddingTop: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: t.muted, fontVariantNumeric: 'tabular-nums', lineHeight: '1', transform: 'translateY(-5px)' }}>
                  {hr > 12 ? `${hr - 12} PM` : (hr === 12 ? '12 PM' : `${hr} AM`)}
                </span>
              </div>
            ))}
          </div>

          {/* Columns */}
          <div style={{ display: 'flex', flex: 1, position: 'relative' }}>

            {/* Horizontal grid lines (behind everything) */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
              {HOURS.map(hr => (
                <div key={hr} style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${t.gridLine}`, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: HOUR_HEIGHT / 2, left: 0, right: 0, borderBottom: `1px dashed ${dark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)'}` }} />
                </div>
              ))}
            </div>

            {/* Current time indicator */}
            <div style={{ position: 'absolute', top: currentTimeTop, left: 0, right: 0, zIndex: 5, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF453A', marginLeft: -4, flexShrink: 0 }} />
              <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right, #FF453A, transparent 80%)' }} />
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIdx) => {
              const dayBlocks = blocks.filter(b => b.dayIdx === dayIdx);
              return (
                <div
                  key={dayIdx}
                  style={{ flex: 1, borderLeft: `1px solid ${t.divider}`, position: 'relative', zIndex: 1 }}
                  onClick={(e) => handleGridClick(dayIdx, e)}
                >
                  {/* Blocks */}
                  {dayBlocks.map(block => {
                    const top = (block.startHr - START_HOUR) * HOUR_HEIGHT;
                    const height = (block.endHr - block.startHr) * HOUR_HEIGHT;
                    const cat = CATEGORIES.find(c => c.id === block.category);
                    const isShort = height < 40;

                    return (
                      <div
                        key={block.id}
                        onClick={(e) => openEditBlock(block, e)}
                        style={{
                          position: 'absolute',
                          top: top + 1,
                          height: height - 2,
                          left: 3,
                          right: 3,
                          background: dark ? cat.darkBg : cat.lightBg,
                          borderLeft: `3px solid ${cat.color}`,
                          borderRadius: 8,
                          padding: isShort ? '2px 8px' : '6px 10px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: isShort ? 0 : 2,
                          backdropFilter: 'blur(8px)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${cat.color}33, inset 0 0 0 1px ${cat.color}22`; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        {!isShort && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ color: cat.color, display: 'flex' }}>{cat.icon}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: cat.color, fontVariantNumeric: 'tabular-nums' }}>
                              {fmtTime(block.startHr)} – {fmtTime(block.endHr)}
                            </span>
                          </div>
                        )}
                        <div style={{
                          fontSize: isShort ? 11 : 12,
                          fontWeight: 600,
                          color: t.text,
                          lineHeight: 1.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: isShort ? 'nowrap' : 'normal',
                          display: '-webkit-box',
                          WebkitLineClamp: isShort ? 1 : 3,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {block.title}
                        </div>
                        {!isShort && height >= 80 && (
                          <div style={{ fontSize: 10, color: t.sub, marginTop: 'auto', fontWeight: 500 }}>
                            {fmtDuration(block.endHr - block.startHr)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {modalOpen && editBlock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'calFadeIn 0.2s ease' }} onClick={() => { setModalOpen(false); setEditBlock(null); }}>
          <div style={{
            background: dark ? 'rgba(28,28,32,0.95)' : 'rgba(255,255,255,0.97)',
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 24,
            padding: '32px',
            width: 420,
            boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(40px) saturate(1.8)',
            position: 'relative',
            animation: 'calSlideUp 0.3s cubic-bezier(.4,0,.2,1)',
          }} onClick={e => e.stopPropagation()}>

            {/* Close */}
            <button onClick={() => { setModalOpen(false); setEditBlock(null); }} style={{ position: 'absolute', top: 18, right: 18, width: 30, height: 30, borderRadius: '50%', background: t.input, border: 'none', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: ease }}>
              <X size={14} />
            </button>

            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, marginBottom: 24 }}>
              {editBlock.id ? 'Edit Block' : 'New Block'}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Title</label>
                <input name="title" defaultValue={editBlock.title || ''} placeholder="What are you working on?" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', fontWeight: 500 }} autoFocus />
              </div>

              {/* Category selector (pill buttons) */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Category</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(c => {
                    const active = (editBlock.category || selectedCat) === c.id;
                    return (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, cursor: 'pointer', transition: ease, background: active ? `${c.color}22` : t.input, border: `1.5px solid ${active ? c.color : t.inputBorder}`, boxShadow: active ? `0 2px 8px ${c.color}22` : 'none' }}>
                        <input type="radio" name="category" value={c.id} defaultChecked={active} onChange={() => setEditBlock({ ...editBlock, category: c.id })} style={{ display: 'none' }} />
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: active ? c.color : t.sub }}>{c.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Day + Times */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Day</label>
                  <select name="dayIdx" defaultValue={editBlock.dayIdx} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', fontWeight: 500 }}>
                    {weekDays.map((d, i) => <option key={i} value={i}>{format(d, 'EEE, MMM d')}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Start</label>
                  <select name="startHr" defaultValue={editBlock.startHr} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', fontWeight: 500 }}>
                    {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>End</label>
                  <select name="endHr" defaultValue={editBlock.endHr} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', fontWeight: 500 }}>
                    {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                {editBlock.id ? (
                  <button type="button" onClick={handleDelete} style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.15)', color: '#FF453A', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: ease }}>
                    <Trash2 size={14} /> Delete
                  </button>
                ) : <div />}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => { setModalOpen(false); setEditBlock(null); }} style={{ padding: '10px 18px', borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: 'transparent', color: t.sub, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: ease }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: t.accentGrad, color: t.accentText, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: t.accentGlow, transition: ease }}>
                    {editBlock.id ? 'Save' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes calFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes calSlideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
