import React, { useState } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects, useDroppable } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Plus, Clock, Target, CreditCard, PlayCircle, Film, CheckCircle2, X, Eye, AlertCircle, Package, Link, Play, AlignLeft, Users, Calendar as CalIcon, Settings2, Trash2, CheckSquare, MessageSquare, Send, ListTodo, UserPlus, UserMinus, Activity } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';


const STAGES = [
  { id: 'planning', title: 'Planning', ic: <Target size={15} />, color: '#AF52DE' },
  { id: 'active', title: 'Active', ic: <Film size={15} />, color: '#5AC8FA' },
  { id: 'review', title: 'Review', ic: <Eye size={15} />, color: '#FFB340' },
  { id: 'completed', title: 'Completed', ic: <CheckCircle2 size={15} />, color: '#34C759' },
  { id: 'archived', title: 'Archived', ic: <Package size={15} />, color: '#ccfd01' }
];

// Members are now managed individually

const INIT_TASKS = []; // Fetched dynamically


function DroppableColumn({ id, items, children }) {
  const { setNodeRef } = useDroppable({ id, data: { type: 'Column' } });
  return (
    <div ref={setNodeRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 150 }}>
      {children}
    </div>
  );
}

function SortableItem({ id, task, t, dark, ease, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: id, data: { type: 'Task', task } });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, cursor: 'grab' }} {...attributes} {...listeners} onClick={(e) => {
      // Prevent drag click interference
      if (e.defaultPrevented) return;
      onOpen(task);
    }}>
      <TaskCard task={task} t={t} dark={dark} ease={ease} isDragging={isDragging} />
    </div>
  );
}

function TaskCard({ task, t, dark, ease, isDragging }) {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const isPast = new Date(task.dueDate) < new Date();
  
  return (
    <div style={{
      background: t.card, border: `1px solid ${isDragging ? t.accent : t.cardBorder}`, borderRadius: 16, padding: '16px',
      boxShadow: isDragging ? t.accentGlow : t.cardShadow, transition: ease, backdropFilter: 'blur(20px) saturate(1.5)',
      display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.text, background: t.input, border: `1px solid ${t.inputBorder}`, padding: '4px 8px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {task.client}
        </div>
        <button style={{ color: t.muted, background: 'transparent', border: 'none', cursor: 'pointer' }}><MoreHorizontal size={14} /></button>
      </div>
      
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: t.text, lineHeight: 1.3, marginBottom: 4 }}>{task.title}</h4>
        <div style={{ fontSize: 18, fontWeight: 700, color: t.text, letterSpacing: -0.5 }}>{formatter.format(task.value)}</div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: isPast ? (dark ? '#FF453A' : '#FF3B30') : t.sub }}>
          <Clock size={12} /> {format(parseISO(task.dueDate), 'MMM d, yyyy')}
        </div>
        
        {/* Team Member Avatars */}
        {task.members && task.members.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {task.members.map((m, i) => (
              <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: t.accentGrad, border: `2px solid ${t.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accentText, fontSize: 9, fontWeight: 800, marginLeft: i > 0 ? -6 : 0, zIndex: 10 - i }}>
                {m}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deliverables Indicator Footer */}
      {((task.deliverables && task.deliverables.length > 0) || (task.checklist && task.checklist.length > 0)) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${t.divider}`, paddingTop: 12, marginTop: 'auto' }}>
          
          {(task.checklist && task.checklist.length > 0) && (
            <div style={{ fontSize: 11, fontWeight: 600, color: task.checklist.every(c=>c.done) ? '#34C759' : t.sub, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckSquare size={12} color={task.checklist.every(c=>c.done) ? "#34C759" : "currentColor"} /> 
              {task.checklist.filter(c=>c.done).length}/{task.checklist.length}
            </div>
          )}

          {(task.deliverables && task.deliverables.length > 0) && (
            <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, display: 'flex', alignItems: 'center', gap: 6 }}>
              {task.deliverables.some(d => d.status === 'Changes Requested') && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF453A' }} />}
              {task.deliverables.every(d => d.status === 'Approved') && <CheckCircle2 size={12} color="#34C759" />}
              <Package size={12} /> {task.deliverables.length} File{task.deliverables.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

    </div>
  );
}


export default function ProjectsView({ t, dark, mobile, onLaunchPortal }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [openedTask, setOpenedTask] = useState(null); 
  
  React.useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (data) {
      setTasks(data.map(p => ({
        id: p.id,
        columnId: p.status,
        client: p.client_name || 'No Client',
        title: p.name,
        value: 0, 
        dueDate: p.due_date ? p.due_date.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
        desc: p.description || '',
        members: []
      })));
    }
  }
  const ease = "all 0.45s cubic-bezier(.4,0,.2,1)";
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e) => setActiveTask(tasks.find(tk => tk.id === e.active.id) || null);

  const handleDragOver = (e) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(tk => tk.id === activeId);
        const overIndex = prev.findIndex(tk => tk.id === overId);
        if (prev[activeIndex].columnId !== prev[overIndex].columnId) {
          const newTasks = [...prev];
          newTasks[activeIndex] = { ...newTasks[activeIndex], columnId: newTasks[overIndex].columnId };
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    if (isActiveTask && isOverColumn) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(tk => tk.id === activeId);
        const newTasks = [...prev];
        newTasks[activeIndex] = { ...newTasks[activeIndex], columnId: overId };
        supabase.from('projects').update({ status: overId }).eq('id', activeId).then();
        return arrayMove(newTasks, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = () => setActiveTask(null);

  const saveTaskDetails = async (key, val) => {
    setTasks(prev => prev.map(t => t.id === openedTask.id ? { ...t, [key]: val } : t));
    setOpenedTask(prev => ({ ...prev, [key]: val }));
    
    // Auto-save mapped fields to DB
    const updatePayload = {};
    if (key === 'title') updatePayload.name = val;
    if (key === 'client') updatePayload.client_name = val;
    if (key === 'desc') updatePayload.description = val;
    if (key === 'dueDate') updatePayload.due_date = new Date(val).toISOString();
    
    if (Object.keys(updatePayload).length > 0) {
      await supabase.from('projects').update(updatePayload).eq('id', openedTask.id);
    }
  };

  const addDeliverable = () => {
    const n = { id: Math.random().toString(36).substr(2, 9), name: 'New Revision', status: 'Draft', revsUsed: 0, revsMax: 3 };
    saveTaskDetails('deliverables', [...(openedTask.deliverables || []), n]);
  };

  const addChecklistItem = () => {
    const n = { id: Math.random().toString(36).substr(2, 9), text: 'New item...', done: false };
    saveTaskDetails('checklist', [...(openedTask.checklist || []), n]);
  };

  const [newComment, setNewComment] = useState('');
  const addComment = () => {
    if(!newComment.trim()) return;
    const n = { id: Math.random().toString(36).substr(2, 9), author: 'AA', text: newComment, time: 'Just now' };
    saveTaskDetails('comments', [...(openedTask.comments || []), n]);
    setNewComment('');
  };

  const [showMembers, setShowMembers] = useState(false);

  // Weekly Calendar Strip Logic
  const today = new Date('2023-11-20');
  const startOfWk = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfWk, i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      
      {/* Calendar Strip */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5 }}>{format(startOfWk, 'MMMM yyyy')}</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {weekDays.map(day => {
            const dayTasks = tasks.filter(tk => tk.dueDate && isSameDay(parseISO(tk.dueDate), day));
            return (
              <div key={day.toISOString()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 16, background: isSameDay(day, today) ? (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.muted, textTransform: 'uppercase' }}>{format(day, 'EEE')}</span>
                <span style={{ fontSize: 16, fontWeight: isSameDay(day, today) ? 700 : 500, color: isSameDay(day, today) ? t.text : t.sub }}>{format(day, 'd')}</span>
                <div style={{ display: 'flex', gap: 3, height: 6, marginTop: 4 }}>
                  {dayTasks.map((tk, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: STAGES.find(s => s.id === tk.columnId)?.color || t.accent }} title={tk.title} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div style={{ flex: 1, display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {STAGES.map(col => {
            const colTasks = tasks.filter(tk => tk.columnId === col.id);
            const totalVal = colTasks.reduce((acc, curr) => acc + (curr.value || 0), 0);
            
            return (
              <div key={col.id} style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ 
                      color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `linear-gradient(135deg, ${col.color}33, ${col.color}11)`, 
                      width: 32, height: 32, borderRadius: '50%', border: `1px solid ${col.color}44`,
                      boxShadow: `0 2px 10px ${col.color}22`
                    }}>
                      {col.ic}
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>{col.title}</h3>
                    <span style={{ fontSize: 11, background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 10, padding: "2px 8px", color: t.sub, fontWeight: 600 }}>{colTasks.length}</span>
                  </div>
                </div>

                {/* Droppable Column Area */}
                <DroppableColumn id={col.id}>
                  <SortableContext items={colTasks.map(tk => tk.id)} strategy={verticalListSortingStrategy}>
                    {colTasks.map(task => <SortableItem key={task.id} id={task.id} task={task} t={t} dark={dark} ease={ease} onOpen={setOpenedTask} />)}
                  </SortableContext>
                  
                  {/* Add Button */}
                  <button onClick={async () => {
                    const todayStr = format(new Date(), 'yyyy-MM-dd');
                    const { data } = await supabase.from('projects').insert([{
                      user_id: user.id,
                      name: 'New Project',
                      status: col.id,
                      client_name: 'New Client',
                      due_date: new Date().toISOString()
                    }]).select().single();
                    if (data) {
                      const newTask = { id: data.id, columnId: data.status, client: data.client_name, title: data.name, value: 0, dueDate: todayStr, deliverables: [], members: [] };
                      setTasks([...tasks, newTask]);
                      setOpenedTask(newTask);
                    }
                  }} style={{ padding: "14px", borderRadius: 16, border: `1px dashed ${t.cardBorder}`, background: "transparent", color: t.sub, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", transition: ease, ':hover': { background: t.input } }}>
                    <Plus size={14} /> Add Project
                  </button>
                </DroppableColumn>
              </div>
            );
          })}
        </div>
        
        <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' })}>
          {activeTask ? <TaskCard task={activeTask} t={t} dark={dark} ease={ease} isDragging /> : null}
        </DragOverlay>
      </DndContext>
      
      {/* Massive Trello-like Modal */}
      {openedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease', padding: 24 }} onClick={() => setOpenedTask(null)}>
          
          <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 24, width: '100%', maxWidth: 960, height: '90vh', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', position: 'relative', animation: 'fadeUp 0.3s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 32px', borderBottom: `1px solid ${t.divider}`, background: t.input }}>
              
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accentText, boxShadow: t.accentGlow, marginTop: 4 }}>
                  <Package size={24} />
                </div>
                <div>
                  <input value={openedTask.title} onChange={e => saveTaskDetails('title', e.target.value)} style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: t.text, background: 'transparent', border: 'none', outline: 'none', width: 400, padding: 0 }} />
                  <div style={{ fontSize: 14, color: t.sub, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    in column: <span style={{ textDecoration: 'underline', color: t.text, cursor: 'pointer' }}>{STAGES.find(s=>s.id === openedTask.columnId)?.title}</span>
                  </div>
                </div>
              </div>

              <button onClick={() => setOpenedTask(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'transparent', border: 'none', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: ease, ':hover': { background: t.divider } }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Split Layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* Left Column: Description & Deliverables */}
              <div style={{ flex: 1, padding: '32px', overflowY: 'auto', borderRight: `1px solid ${t.divider}` }}>
                
                {/* Description */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 12 }}>
                    <AlignLeft size={18} /> Description
                  </div>
                  <textarea 
                    value={openedTask.desc || ''} 
                    onChange={e => saveTaskDetails('desc', e.target.value)}
                    placeholder="Add a more detailed description..." 
                    style={{ width: '100%', minHeight: 100, padding: '16px', borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 14, outline: 'none', resize: 'vertical', lineHeight: 1.5 }} 
                  />
                </div>

                {/* Checklist Section */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: t.text }}>
                      <ListTodo size={18} /> Checklist
                    </div>
                    <button onClick={addChecklistItem} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: t.input, color: t.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                  
                  {openedTask.checklist && openedTask.checklist.length > 0 && (() => {
                    const comp = openedTask.checklist.filter(c=>c.done).length;
                    const tot = openedTask.checklist.length;
                    const pct = Math.round((comp/tot)*100);
                    return (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.sub, fontWeight: 600, marginBottom: 6 }}>
                          <span>{pct}% Complete</span>
                        </div>
                        <div style={{ width: '100%', height: 8, background: t.input, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#34C759' : t.accent, borderRadius: 4, transition: ease }} />
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(openedTask.checklist || []).map((c) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 12, transition: ease }}>
                        <button onClick={() => {
                          const newC = openedTask.checklist.map(x => x.id === c.id ? {...x, done: !x.done} : x);
                          saveTaskDetails('checklist', newC);
                        }} style={{ width: 18, height: 18, borderRadius: 4, border: c.done ? 'none' : `1.5px solid ${t.sub}`, background: c.done ? '#34C759' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', cursor: 'pointer' }}>
                          {c.done && <CheckSquare size={14} color="#000" strokeWidth={3} />}
                        </button>
                        <input value={c.text} onChange={e => {
                          const newC = openedTask.checklist.map(x => x.id === c.id ? {...x, text: e.target.value} : x);
                          saveTaskDetails('checklist', newC);
                        }} style={{ flex: 1, background: 'transparent', border: 'none', color: c.done ? t.sub : t.text, textDecoration: c.done ? 'line-through' : 'none', fontSize: 13, outline: 'none' }} />
                        <button onClick={() => {
                          saveTaskDetails('checklist', openedTask.checklist.filter(x => x.id !== c.id));
                        }} style={{ background: 'transparent', border: 'none', color: t.sub, cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deliverables Section */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: t.text }}>
                      <Play size={18} /> File Deliverables
                    </div>
                    <button onClick={addDeliverable} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: t.accentGrad, color: t.accentText, fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: t.accentGlow, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Plus size={14} /> Add File
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(openedTask.deliverables || []).map((d, i) => {
                      const isRed = d.revsUsed >= d.revsMax;
                      const isAmber = d.revsUsed === d.revsMax - 1;
                      const barColor = isRed ? '#FF453A' : (isAmber ? '#FFB340' : '#34C759');

                      return (
                        <div key={d.id} style={{ background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{d.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {d.status === 'Approved' && <CheckCircle2 size={12} color="#34C759" />}
                                {d.status === 'Changes Requested' && <AlertCircle size={12} color="#FF453A" />}
                                {d.status === 'Shared' && <Eye size={12} color="#5AC8FA" />}
                                <span style={{ color: t.sub }}>{d.status}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Link size={12} /> Share
                              </button>
                              <button onClick={() => { if(onLaunchPortal) onLaunchPortal(); else alert('Launch Client-Facing Mockup'); }} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Play size={12} fill="currentColor" /> Preview Portal
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, background: t.card, padding: '8px 12px', borderRadius: 8, border: `1px dashed ${t.cardBorder}` }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: t.muted, textTransform: 'uppercase' }}>Revision Limit</span>
                            <div style={{ flex: 1, height: 6, background: dark ? '#000' : '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${(d.revsUsed / Math.max(d.revsMax, 1)) * 100}%`, height: '100%', background: barColor, borderRadius: 3, transition: ease }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{d.revsUsed}/{d.revsMax}</span>
                          </div>
                        </div>
                      );
                    })}
                    {!(openedTask.deliverables || []).length && (
                      <div style={{ padding: '32px', textAlign: 'center', color: t.sub, fontSize: 13, border: `1px dashed ${t.inputBorder}`, borderRadius: 16 }}>
                        No deliverables uploaded yet. Click Add File to generate a review link.
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 16 }}>
                    <MessageSquare size={18} /> Activity & Comments
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                    {(openedTask.comments || []).map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accentText, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                          {c.author}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{c.author}</span>
                            <span style={{ fontSize: 11, color: t.sub }}>{c.time}</span>
                          </div>
                          <div style={{ fontSize: 13, color: t.text, background: t.input, padding: '10px 14px', borderRadius: '0 12px 12px 12px', border: `1px solid ${t.inputBorder}`, lineHeight: 1.5 }}>
                            {c.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accentText, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                      AA
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <textarea 
                        value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder="Write a comment... (use @ to mention)" 
                        style={{ width: '100%', minHeight: 80, padding: '12px 40px 12px 16px', borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: 'none', resize: 'vertical' }} 
                        onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); addComment(); } }}
                      />
                      <button onClick={addComment} style={{ position: 'absolute', right: 8, bottom: 8, width: 28, height: 28, borderRadius: 8, background: t.accentGrad, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: t.accentGlow, color: t.accentText }}>
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Settings / Sidebar */}
              <div style={{ width: 280, flexShrink: 0, padding: '32px 24px', background: t.input, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Client</h4>
                  <div style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.card, fontSize: 14, fontWeight: 600, color: t.text }}>
                    <input value={openedTask.client || ''} onChange={e => saveTaskDetails('client', e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: t.text, outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Budget / Value</h4>
                  <div style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.card, fontSize: 14, fontWeight: 600, color: t.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                    $ <input type="number" value={openedTask.value || 0} onChange={e => saveTaskDetails('value', parseInt(e.target.value,10))} style={{ flex: 1, background: 'transparent', border: 'none', color: t.text, outline: 'none', fontWeight: 600 }} />
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><CalIcon size={14} /> Due Date</h4>
                  <div style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.card, fontSize: 14, fontWeight: 600, color: t.text }}>
                    <input type="date" value={openedTask.dueDate || ''} onChange={e => saveTaskDetails('dueDate', e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: t.text, outline: 'none' }} />
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> Assignees</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(openedTask.members || []).map((m,i) => (
                      <div key={i} onClick={() => saveTaskDetails('members', openedTask.members.filter(x => x !== m))} style={{ width: 36, height: 36, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accentText, fontSize: 12, fontWeight: 800, boxShadow: t.accentGlow, cursor: 'pointer', position: 'relative' }} title="Click to remove">
                        {m}
                      </div>
                    ))}
                    <button onClick={() => setShowMembers(!showMembers)} style={{ width: 36, height: 36, borderRadius: '50%', background: t.card, border: `1px dashed ${t.sub}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, cursor: 'pointer' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                  {showMembers && (
                    <div style={{ position: 'absolute', top: 60, left: 0, width: 200, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, boxShadow: t.cardShadow, zIndex: 10, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                      <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: t.muted, borderBottom: `1px solid ${t.divider}` }}>Add / Remove Members</div>
                      {/* Add Member Quick Input */}
                      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.divider}` }}>
                        <input
                          placeholder="Type initials and press enter..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              const nm = [...(openedTask.members||[]), e.target.value.trim().substring(0, 2).toUpperCase()];
                              saveTaskDetails('members', nm);
                              e.target.value = '';
                            }
                          }}
                          style={{ width: '100%', background: 'transparent', border: `1px solid ${t.inputBorder}`, padding: '6px 10px', borderRadius: 6, color: t.text, fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      {(openedTask.members || []).map(u => {
                        return (
                          <div key={u} onClick={() => {
                            const nm = openedTask.members.filter(x=>x!==u);
                            saveTaskDetails('members', nm);
                          }} style={{ padding: '8px 12px', fontSize: 13, color: t.text, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.card, borderBottom: `1px solid ${t.divider}`, transition: ease, ':hover': { background: t.input } }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accentText, fontSize: 9, fontWeight: 800 }}>{u}</div>
                              {u}
                            </div>
                            <CheckCircle2 size={14} color="#34C759" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: `1px solid ${t.divider}` }}>
                  <button onClick={async () => { 
                    await supabase.from('projects').delete().eq('id', openedTask.id);
                    setTasks(prev => prev.filter(t => t.id !== openedTask.id)); 
                    setOpenedTask(null); 
                  }} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'rgba(255,59,48,0.1)', color: '#FF453A', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Trash2 size={16} /> Delete Project
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
