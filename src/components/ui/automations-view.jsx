import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Zap, Send, Phone, FileText, FileCheck, Receipt, Eye, Clock, CheckCircle2,
  Mail, ExternalLink, Users, Target, Plus, Trash2, Play, Square, X,
  Tag, Filter, GitBranch, Bell, DollarSign, Briefcase, UserPlus, Search,
  MessageSquare, Link, Star, BarChart2, CalendarDays, RefreshCw,
} from 'lucide-react';

const STAGES = [
  { id: 'prospect', label: 'Prospect', color: '#AF52DE' },
  { id: 'outreach', label: 'Outreach', color: '#5AC8FA' },
  { id: 'qualify',  label: 'Qualify',  color: '#FFB340' },
  { id: 'propose',  label: 'Propose',  color: '#FF6259' },
  { id: 'close',    label: 'Close',    color: '#34C759' },
  { id: 'onboard',  label: 'Onboard',  color: '#ccfd01' },
];

const ICON_MAP = {
  target:     <Target size={14} />,
  send:       <Send size={14} />,
  mail:       <Mail size={14} />,
  eye:        <Eye size={14} />,
  phone:      <Phone size={14} />,
  check:      <CheckCircle2 size={14} />,
  file:       <FileText size={14} />,
  filecheck:  <FileCheck size={14} />,
  receipt:    <Receipt size={14} />,
  external:   <ExternalLink size={14} />,
  clock:      <Clock size={14} />,
  users:      <Users size={14} />,
  tag:        <Tag size={14} />,
  filter:     <Filter size={14} />,
  branch:     <GitBranch size={14} />,
  bell:       <Bell size={14} />,
  dollar:     <DollarSign size={14} />,
  briefcase:  <Briefcase size={14} />,
  userplus:   <UserPlus size={14} />,
  message:    <MessageSquare size={14} />,
  link:       <Link size={14} />,
  star:       <Star size={14} />,
  chart:      <BarChart2 size={14} />,
  calendar:   <CalendarDays size={14} />,
  refresh:    <RefreshCw size={14} />,
};

// ── Node catalog for the picker panel ─────────────────────────────────────────
const NODE_CATALOG = [
  {
    category: 'Triggers',
    color: '#AF52DE',
    items: [
      { type: 'trigger', icon: 'target',    label: 'New Prospect',     desc: 'Prospect added via Prospecting tool' },
      { type: 'trigger', icon: 'eye',       label: 'Email Opened',     desc: 'Prospect opened a tracked email' },
      { type: 'trigger', icon: 'phone',     label: 'Call Completed',   desc: 'Call logged in CRM' },
      { type: 'trigger', icon: 'filecheck', label: 'Contract Signed',  desc: 'E-signature completed' },
      { type: 'trigger', icon: 'dollar',    label: 'Invoice Paid',     desc: 'Payment received and confirmed' },
      { type: 'trigger', icon: 'external',  label: 'Portal Login',     desc: 'Client accessed their portal' },
      { type: 'trigger', icon: 'users',     label: 'Stage Changed',    desc: 'Deal moved to a new CRM stage' },
      { type: 'trigger', icon: 'check',     label: 'Task Completed',   desc: 'Project task marked complete' },
      { type: 'trigger', icon: 'file',      label: 'File Uploaded',    desc: 'Deliverable or doc uploaded' },
      { type: 'trigger', icon: 'mail',      label: 'Form Submitted',   desc: 'Lead form or onboarding form submitted' },
    ],
  },
  {
    category: 'Outreach',
    color: '#5AC8FA',
    items: [
      { type: 'action', icon: 'send',     label: 'Send Pitch Deck',   desc: 'Auto-generate & email pitch deck' },
      { type: 'action', icon: 'mail',     label: 'Send Email',        desc: 'Send a templated email' },
      { type: 'action', icon: 'mail',     label: 'Follow-up Email',   desc: 'Timed follow-up if no response' },
      { type: 'action', icon: 'phone',    label: 'Send SMS',          desc: 'Text message to prospect' },
      { type: 'action', icon: 'calendar', label: 'Send Calendar Link',desc: 'Share booking link for a call' },
      { type: 'action', icon: 'bell',     label: 'Slack Notify',      desc: 'Ping team channel with update' },
      { type: 'action', icon: 'message',  label: 'Internal Note',     desc: 'Log note for the team' },
    ],
  },
  {
    category: 'CRM',
    color: '#FFB340',
    items: [
      { type: 'action', icon: 'users',    label: 'Update Contact',    desc: 'Update CRM contact fields' },
      { type: 'action', icon: 'target',   label: 'Move Stage',        desc: 'Advance deal to next pipeline stage' },
      { type: 'action', icon: 'userplus', label: 'Assign Owner',      desc: 'Assign contact to a team member' },
      { type: 'action', icon: 'tag',      label: 'Add Tag',           desc: 'Tag contact for segmentation' },
      { type: 'action', icon: 'star',     label: 'Set Priority',      desc: 'Mark deal as high / medium / low' },
      { type: 'action', icon: 'file',     label: 'Log Activity',      desc: 'Add note or activity to CRM record' },
      { type: 'action', icon: 'chart',    label: 'Update Score',      desc: 'Adjust lead score by rule' },
    ],
  },
  {
    category: 'Projects',
    color: '#FF6259',
    items: [
      { type: 'action', icon: 'briefcase', label: 'Create Project',    desc: 'Spin up project from template' },
      { type: 'action', icon: 'check',     label: 'Create Task',       desc: 'Add task to an existing project' },
      { type: 'action', icon: 'file',      label: 'Create Deliverable',desc: 'Add a deliverable to a project' },
      { type: 'action', icon: 'eye',       label: 'Request Approval',  desc: 'Send deliverable for client review' },
      { type: 'action', icon: 'users',     label: 'Assign Team',       desc: 'Assign team members to project' },
      { type: 'action', icon: 'refresh',   label: 'Update Status',     desc: 'Change project or task status' },
    ],
  },
  {
    category: 'Documents',
    color: '#34C759',
    items: [
      { type: 'action', icon: 'file',      label: 'Generate Proposal', desc: 'Auto-create proposal from template' },
      { type: 'action', icon: 'receipt',   label: 'Send Quote',        desc: 'Generate and send a line-item quote' },
      { type: 'action', icon: 'filecheck', label: 'Send Contract',     desc: 'Generate & send for e-signature' },
      { type: 'action', icon: 'receipt',   label: 'Send Invoice',      desc: 'Auto-generate & send invoice' },
      { type: 'action', icon: 'link',      label: 'Share Doc Link',    desc: 'Send a shareable document link' },
    ],
  },
  {
    category: 'Client Portal',
    color: '#ccfd01',
    items: [
      { type: 'action', icon: 'external', label: 'Create Portal',     desc: 'Spin up client portal for project' },
      { type: 'action', icon: 'message',  label: 'Portal Message',    desc: 'Send message via client portal' },
      { type: 'action', icon: 'send',     label: 'Share Deliverable', desc: 'Share deliverable through portal' },
      { type: 'action', icon: 'file',     label: 'Upload to Portal',  desc: 'Push document to client portal' },
    ],
  },
  {
    category: 'Logic',
    color: '#888',
    items: [
      { type: 'action', icon: 'clock',   label: 'Wait / Delay',  desc: 'Pause flow for a set duration' },
      { type: 'action', icon: 'filter',  label: 'If / Condition',desc: 'Branch flow based on a condition' },
      { type: 'action', icon: 'branch',  label: 'Split Path',    desc: 'Run two branches in parallel' },
    ],
  },
];

// ── Node picker panel ──────────────────────────────────────────────────────────
const NodePickerPanel = ({ stageId, onAdd, onClose, dark, t }) => {
  const [search, setSearch] = useState('');
  const stage = STAGES.find(s => s.id === stageId);
  const q = search.toLowerCase();

  const filtered = NODE_CATALOG.map(cat => ({
    ...cat,
    items: cat.items.filter(n =>
      !q || n.label.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q) || cat.category.toLowerCase().includes(q)
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'absolute', inset: 0,
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: dark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(4px)',
        borderRadius: 22,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width: 560, maxWidth: '90%', maxHeight: '78vh',
          display: 'flex', flexDirection: 'column',
          background: dark ? '#111116' : '#fff',
          borderRadius: 20,
          border: `1px solid ${dark ? '#222' : '#e5e7eb'}`,
          boxShadow: dark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 16px 48px rgba(0,0,0,0.18)',
          animation: 'panelSlideIn 0.18s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
        }}
      >
      {/* Header */}
      <div style={{ padding: '20px 18px 14px', borderBottom: `1px solid ${dark ? '#1e1e26' : '#f0f0f4'}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: '-0.2px' }}>Add Step</div>
            <div style={{ fontSize: 11.5, color: t.sub, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
              Adding to <span style={{ color: stage.color, fontWeight: 600 }}>{stage.label}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: t.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
        {/* Search */}
        <div style={{ marginTop: 14, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.sub, pointerEvents: 'none' }}>
            <Search size={13} />
          </div>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '8px 10px 8px 32px',
              borderRadius: 10, border: `1px solid ${dark ? '#2a2a34' : '#e5e7eb'}`,
              background: dark ? 'rgba(255,255,255,0.04)' : '#f8f9fa',
              color: t.text, fontSize: 13, outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Scrollable node list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 20px' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: t.sub, fontSize: 13 }}>No nodes match "{search}"</div>
        )}
        {filtered.map(cat => (
          <div key={cat.category} style={{ marginBottom: 18 }}>
            {/* Category header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, padding: '0 4px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: t.sub, letterSpacing: '0.6px', textTransform: 'uppercase' }}>{cat.category}</span>
            </div>
            {/* 2-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {cat.items.map((item, i) => (
                <NodePickerCard
                  key={i} item={item} catColor={cat.color}
                  dark={dark} t={t}
                  onClick={() => { onAdd(item); onClose(); }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

const NodePickerCard = ({ item, catColor, dark, t, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '11px 12px', borderRadius: 13, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        background: hovered
          ? (dark ? `${catColor}18` : `${catColor}0e`)
          : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
        border: `1px solid ${hovered ? catColor + '55' : (dark ? '#222' : '#eee')}`,
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 8, background: dark ? 'rgba(255,255,255,0.05)' : '#f4f5f7', color: catColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        {ICON_MAP[item.icon] || <Zap size={14} />}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: t.text, lineHeight: 1.25, marginBottom: 4 }}>{item.label}</div>
      <div style={{ fontSize: 10.5, color: t.sub, lineHeight: 1.35 }}>{item.desc}</div>
      <div style={{
        marginTop: 8, display: 'inline-flex', alignItems: 'center',
        fontSize: 9.5, fontWeight: 700, letterSpacing: '0.5px',
        padding: '2px 6px', borderRadius: 4,
        background: item.type === 'trigger' ? `${catColor}22` : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
        color: item.type === 'trigger' ? catColor : t.sub,
      }}>
        {item.type === 'trigger' ? 'TRIGGER' : 'ACTION'}
      </div>
    </div>
  );
};

const INIT_NODES = [
  { id: 'n1',  stageId: 'prospect', label: 'New Prospect Added',      type: 'trigger', icon: 'target',    desc: 'Prospect found via Prospecting tool' },
  { id: 'n2',  stageId: 'outreach', label: 'Send Pitch Deck',         type: 'action',  icon: 'send',      desc: 'Auto-generate & email pitch deck' },
  { id: 'n3',  stageId: 'outreach', label: 'Follow-up Email',         type: 'action',  icon: 'mail',      desc: 'Email if no response in 3 days' },
  { id: 'n4',  stageId: 'outreach', label: 'Email Opened',            type: 'trigger', icon: 'eye',       desc: 'Prospect opened the pitch email' },
  { id: 'n5',  stageId: 'qualify',  label: 'Schedule Discovery Call', type: 'action',  icon: 'phone',     desc: 'Send calendar booking link' },
  { id: 'n6',  stageId: 'qualify',  label: 'Call Completed',          type: 'trigger', icon: 'check',     desc: 'Discovery call logged in CRM' },
  { id: 'n7',  stageId: 'propose',  label: 'Generate Proposal',       type: 'action',  icon: 'file',      desc: 'Auto-create proposal from template' },
  { id: 'n8',  stageId: 'propose',  label: 'Send Quote',              type: 'action',  icon: 'receipt',   desc: 'Generate line-item quote' },
  { id: 'n9',  stageId: 'close',    label: 'Send Contract',           type: 'action',  icon: 'filecheck', desc: 'Generate & send for e-signature' },
  { id: 'n10', stageId: 'close',    label: 'Contract Signed',         type: 'trigger', icon: 'check',     desc: 'E-signature completed' },
  { id: 'n11', stageId: 'onboard',  label: 'Send Invoice',            type: 'action',  icon: 'receipt',   desc: 'Auto-generate & send invoice' },
  { id: 'n12', stageId: 'onboard',  label: 'Create Client Portal',    type: 'action',  icon: 'external',  desc: 'Spin up portal for project tracking' },
];

const INIT_WIRES = [
  { id: 'w1',  from: 'n1',  fromPort: 'right',  to: 'n2',  toPort: 'left'   },
  { id: 'w2',  from: 'n2',  fromPort: 'bottom', to: 'n3',  toPort: 'top'    },
  { id: 'w3',  from: 'n2',  fromPort: 'bottom', to: 'n4',  toPort: 'top'    },
  { id: 'w4',  from: 'n4',  fromPort: 'right',  to: 'n5',  toPort: 'left'   },
  { id: 'w5',  from: 'n5',  fromPort: 'bottom', to: 'n6',  toPort: 'top'    },
  { id: 'w6',  from: 'n6',  fromPort: 'right',  to: 'n7',  toPort: 'left'   },
  { id: 'w7',  from: 'n7',  fromPort: 'bottom', to: 'n8',  toPort: 'top'    },
  { id: 'w8',  from: 'n8',  fromPort: 'right',  to: 'n9',  toPort: 'left'   },
  { id: 'w9',  from: 'n9',  fromPort: 'bottom', to: 'n10', toPort: 'top'    },
  { id: 'w10', from: 'n10', fromPort: 'right',  to: 'n11', toPort: 'left'   },
  { id: 'w11', from: 'n11', fromPort: 'bottom', to: 'n12', toPort: 'top'    },
];

function getPortXY(pos, side) {
  if (!pos) return { x: 0, y: 0 };
  const { x, y, w, h } = pos;
  if (side === 'top')    return { x: x + w / 2, y };
  if (side === 'bottom') return { x: x + w / 2, y: y + h };
  if (side === 'left')   return { x, y: y + h / 2 };
  if (side === 'right')  return { x: x + w, y: y + h / 2 };
  return { x: x + w / 2, y: y + h / 2 };
}

function buildPath(p1, side1, p2, side2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const isVertConn = side1 === 'top' || side1 === 'bottom';
  const aligned = isVertConn ? Math.abs(dx) < 8 : Math.abs(dy) < 8;
  if (aligned) return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;

  const dist    = Math.sqrt(dx * dx + dy * dy);
  const tension = Math.min(100, dist * 0.4);
  let c1x = p1.x, c1y = p1.y, c2x = p2.x, c2y = p2.y;
  if (side1 === 'right')       c1x += tension;
  else if (side1 === 'left')   c1x -= tension;
  else if (side1 === 'bottom') c1y += tension;
  else if (side1 === 'top')    c1y -= tension;
  if (side2 === 'right')       c2x += tension;
  else if (side2 === 'left')   c2x -= tension;
  else if (side2 === 'bottom') c2y += tension;
  else if (side2 === 'top')    c2y -= tension;
  return `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
}

const Port = ({ nodeId, side, color, active, onStartDrag, dark }) => {
  const isInput = side === 'left' || side === 'top';
  const size = 10;
  const posMap = {
    top:    { left: '50%', top: -size / 2,    transform: 'translateX(-50%)' },
    bottom: { left: '50%', bottom: -size / 2, transform: 'translateX(-50%)' },
    left:   { top: '50%', left: -size / 2,    transform: 'translateY(-50%)' },
    right:  { top: '50%', right: -size / 2,   transform: 'translateY(-50%)' },
  };
  return (
    <div
      data-port={nodeId}
      data-side={side}
      onMouseDown={(e) => onStartDrag(nodeId, side, e)}
      style={{
        position: 'absolute', ...posMap[side],
        width: size, height: size, zIndex: 15,
        cursor: 'crosshair', pointerEvents: 'auto',
        borderRadius: isInput ? '2px' : '50%',
        background: dark ? '#16161a' : '#fff',
        border: `1.5px solid ${active ? color : (dark ? '#444' : '#ccc')}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? `0 0 0 2px ${color}44` : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{ width: 3.5, height: 3.5, background: active ? color : (dark ? '#555' : '#bbb'), borderRadius: isInput ? '0.5px' : '50%' }} />
    </div>
  );
};

export default function AutomationsView({ t, dark }) {
  const [nodes, setNodes]                   = useState(INIT_NODES);
  const [wires, setWires]                   = useState(INIT_WIRES);
  const [selectedWireId, setSelectedWireId] = useState(null);
  const [hoveredWireId, setHoveredWireId]   = useState(null);
  const [selectedNode, setSelectedNode]     = useState(null);
  const [contextMenu, setContextMenu]       = useState(null);
  const [nodePicker, setNodePicker]         = useState(null); // stageId | null
  const [dragging, setDragging]             = useState(null);
  const [nodePositions, setNodePositions]   = useState({});
  const [isRunning, setIsRunning]           = useState(false);
  const canvasRef = useRef(null);
  const nodeRefs  = useRef({});

  const updatePositions = useCallback(() => {
    if (!canvasRef.current) return;
    const cr = canvasRef.current.getBoundingClientRect();
    const sl = canvasRef.current.scrollLeft;
    const st = canvasRef.current.scrollTop;
    const pos = {};
    Object.keys(nodeRefs.current).forEach(id => {
      const el = nodeRefs.current[id];
      if (el) {
        const r = el.getBoundingClientRect();
        pos[id] = { x: r.left - cr.left + sl, y: r.top - cr.top + st, w: r.width, h: r.height };
      }
    });
    setNodePositions(pos);
  }, []);

  useEffect(() => {
    updatePositions();
    const timer = setInterval(updatePositions, 1000);
    const ro = new ResizeObserver(updatePositions);
    if (canvasRef.current) ro.observe(canvasRef.current);
    const cv = canvasRef.current;
    if (cv) cv.addEventListener('scroll', updatePositions);
    return () => { ro.disconnect(); clearInterval(timer); if (cv) cv.removeEventListener('scroll', updatePositions); };
  }, [updatePositions, nodes]);

  const deleteNode = useCallback((nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setWires(prev => prev.filter(w => w.from !== nodeId && w.to !== nodeId));
    setSelectedNode(prev => prev === nodeId ? null : prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) deleteNode(selectedNode);
        else if (selectedWireId) { setWires(p => p.filter(w => w.id !== selectedWireId)); setSelectedWireId(null); }
      }
      if (e.key === 'Escape') { setContextMenu(null); setSelectedNode(null); setSelectedWireId(null); setNodePicker(null); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedWireId, deleteNode]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [contextMenu]);

  const onStartDrag = (nodeId, side, e) => {
    e.stopPropagation(); e.preventDefault();
    const cr = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - cr.left + canvasRef.current.scrollLeft;
    const my = e.clientY - cr.top  + canvasRef.current.scrollTop;
    const existingWire = wires.find(w => w.to === nodeId && w.toPort === side);
    if (existingWire) {
      setWires(prev => prev.filter(w => w.id !== existingWire.id));
      setDragging({ fromId: existingWire.from, fromSide: existingWire.fromPort, mx, my });
      return;
    }
    setDragging({ fromId: nodeId, fromSide: side, mx, my });
  };

  const addNodeFromPicker = (stageId, item) => {
    setNodes(p => [...p, {
      id: `n${Date.now()}`,
      stageId,
      label: item.label,
      type:  item.type,
      icon:  item.icon,
      desc:  item.desc,
    }]);
  };

  const wireData = useMemo(() => {
    return wires.map((w) => {
      const p1    = getPortXY(nodePositions[w.from], w.fromPort);
      const p2    = getPortXY(nodePositions[w.to],   w.toPort);
      const path  = buildPath(p1, w.fromPort, p2, w.toPort);
      const fNode = nodes.find(n => n.id === w.from);
      const color = STAGES.find(s => s.id === fNode?.stageId)?.color || '#AF52DE';
      const len   = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      return { path, color, id: w.id, mx: (p1.x + p2.x) / 2, my: (p1.y + p2.y) / 2, active: p1.x !== 0, len };
    });
  }, [wires, nodePositions, nodes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14, animation: 'fadeIn 0.5s ease' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', margin: 0 }}>Workflow Builder</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, color: t.sub, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: '4px 12px', borderRadius: 20 }}>
            {nodes.length} Nodes · {wires.length} Connections
          </div>
          <button
            onClick={() => setIsRunning(r => !r)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 18px', borderRadius: 20, border: 'none',
              background: isRunning ? 'linear-gradient(135deg, #ff453a, #ff6259)' : 'linear-gradient(135deg, #34C759, #30d158)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: isRunning ? '0 4px 14px rgba(255,69,58,0.4)' : '0 4px 14px rgba(52,199,89,0.35)',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            {isRunning ? <Square size={12} fill="#fff" strokeWidth={0} /> : <Play size={12} fill="#fff" strokeWidth={0} />}
            {isRunning ? 'Stop' : 'Run'}
          </button>
        </div>
      </header>

      <div
        ref={canvasRef}
        onMouseMove={(e) => {
          if (!dragging) return;
          const cr = canvasRef.current.getBoundingClientRect();
          setDragging(d => ({ ...d, mx: e.clientX - cr.left + canvasRef.current.scrollLeft, my: e.clientY - cr.top + canvasRef.current.scrollTop }));
        }}
        onMouseUp={(e) => {
          if (!dragging) return;
          const el = document.elementFromPoint(e.clientX, e.clientY);
          const port = el?.closest('[data-port]');
          if (port) {
            const toId = port.getAttribute('data-port'), toSide = port.getAttribute('data-side');
            if (toId !== dragging.fromId) setWires(w => [...w, { id: `w${Date.now()}`, from: dragging.fromId, fromPort: dragging.fromSide, to: toId, toPort: toSide }]);
          }
          setDragging(null);
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) { setSelectedNode(null); setSelectedWireId(null); setContextMenu(null); setNodePicker(null); }
        }}
        style={{ flex: 1, position: 'relative', overflow: 'auto', background: dark ? '#0a0a0c' : '#f8f9fa', borderRadius: 24, border: `1.5px solid ${t.cardBorder}` }}
      >
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.25, backgroundImage: `radial-gradient(circle, ${dark ? '#333' : '#ddd'} 0.8px, transparent 0.8px)`, backgroundSize: '18px 18px', pointerEvents: 'none' }} />

        {/* SVG wire layer */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3, pointerEvents: 'none', overflow: 'visible' }}>
          {wireData.map(w => w.active && (
            <g key={w.id} style={{ pointerEvents: 'auto' }}
               onMouseEnter={() => setHoveredWireId(w.id)}
               onMouseLeave={() => setHoveredWireId(null)}
               onClick={(e) => { e.stopPropagation(); setSelectedWireId(prev => prev === w.id ? null : w.id); setSelectedNode(null); }}>
              <path d={w.path} fill="none" stroke="transparent" strokeWidth="28" style={{ cursor: 'pointer', pointerEvents: 'stroke' }} />
              <path d={w.path} fill="none"
                stroke={selectedWireId === w.id ? '#ccfd01' : hoveredWireId === w.id ? '#ff453a' : w.color}
                strokeWidth={selectedWireId === w.id ? 3 : 2}
                opacity={selectedWireId === w.id || hoveredWireId === w.id ? 1 : 0.55}
                strokeLinecap="round"
                style={{ transition: 'stroke 0.15s, opacity 0.15s', pointerEvents: 'none' }}
              />
              {isRunning && (
                <circle r="3" fill={w.color} opacity="0.95" style={{ filter: `drop-shadow(0 0 4px ${w.color})` }}>
                  <animateMotion dur={`${Math.max(1.4, w.len / 160)}s`} repeatCount="indefinite" path={w.path} calcMode="linear" />
                </circle>
              )}
            </g>
          ))}
          {dragging && nodePositions[dragging.fromId] && (
            <path d={buildPath(getPortXY(nodePositions[dragging.fromId], dragging.fromSide), dragging.fromSide, { x: dragging.mx, y: dragging.my }, 'left')}
              fill="none" stroke={dark ? '#888' : '#aaa'} strokeWidth="2" strokeDasharray="5 4" style={{ pointerEvents: 'none' }} />
          )}
        </svg>

        {/* Wire delete buttons */}
        {wireData.map(w => w.active && (selectedWireId === w.id || hoveredWireId === w.id) && (
          <div key={`del-${w.id}`}
            onClick={(e) => { e.stopPropagation(); setWires(p => p.filter(wr => wr.id !== w.id)); setSelectedWireId(null); }}
            onMouseEnter={() => setHoveredWireId(w.id)}
            onMouseLeave={() => setHoveredWireId(null)}
            style={{ position: 'absolute', left: w.mx - 12, top: w.my - 12, width: 24, height: 24, borderRadius: 12, background: '#ff453a', color: '#fff', zIndex: 25, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(255,69,58,0.5)', pointerEvents: 'auto' }}>
            <Trash2 size={11} strokeWidth={2.5} />
          </div>
        ))}

        {/* Right-click context menu */}
        {contextMenu && (
          <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 1000, background: dark ? '#1e1e24' : '#fff', borderRadius: 10, border: `1px solid ${dark ? '#333' : '#e5e7eb'}`, boxShadow: dark ? '0 12px 32px rgba(0,0,0,0.55)' : '0 8px 24px rgba(0,0,0,0.13)', padding: '4px', minWidth: 148 }}
               onMouseDown={e => e.stopPropagation()}>
            <div onClick={() => { deleteNode(contextMenu.nodeId); setContextMenu(null); }}
                 onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,69,58,0.14)' : 'rgba(255,69,58,0.08)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                 style={{ padding: '8px 12px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 500, color: '#ff453a', transition: 'background 0.12s' }}>
              <Trash2 size={13} strokeWidth={2} /> Delete Node
            </div>
          </div>
        )}

        {/* Columns */}
        <div style={{ display: 'flex', position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', width: 'max-content', minWidth: '100%' }}>
          {STAGES.map((s, si) => (
            <div key={s.id} style={{ flex: 1, minWidth: 230, display: 'flex', flexDirection: 'column', borderRight: si < STAGES.length - 1 ? `1px dashed ${dark ? '#1c1c20' : '#eee'}` : 'none' }}>
              <div style={{ padding: '20px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                {s.label}
              </div>
              <div style={{ padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {nodes.filter(n => n.stageId === s.id).map(n => (
                  <div key={n.id} style={{ position: 'relative', overflow: 'visible', pointerEvents: 'auto' }}>
                    <Port nodeId={n.id} side="left"   color={s.color} active={wires.some(w => (w.to === n.id && w.toPort === 'left')   || (w.from === n.id && w.fromPort === 'left'))}   onStartDrag={onStartDrag} dark={dark} />
                    <Port nodeId={n.id} side="right"  color={s.color} active={wires.some(w => (w.to === n.id && w.toPort === 'right')  || (w.from === n.id && w.fromPort === 'right'))}  onStartDrag={onStartDrag} dark={dark} />
                    <Port nodeId={n.id} side="top"    color={s.color} active={wires.some(w => (w.to === n.id && w.toPort === 'top')    || (w.from === n.id && w.fromPort === 'top'))}    onStartDrag={onStartDrag} dark={dark} />
                    <Port nodeId={n.id} side="bottom" color={s.color} active={wires.some(w => (w.to === n.id && w.toPort === 'bottom') || (w.from === n.id && w.fromPort === 'bottom'))} onStartDrag={onStartDrag} dark={dark} />
                    <div
                      ref={el => { nodeRefs.current[n.id] = el; }}
                      onClick={(e) => { e.stopPropagation(); setSelectedNode(prev => prev === n.id ? null : n.id); setSelectedWireId(null); setContextMenu(null); setNodePicker(null); }}
                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ nodeId: n.id, x: e.clientX, y: e.clientY }); setSelectedNode(n.id); }}
                      style={{
                        background: dark ? `linear-gradient(135deg, ${s.color}11 0%, #1c1c22 40%)` : `linear-gradient(135deg, ${s.color}08 0%, #fff 60%)`,
                        borderRadius: 20,
                        border: selectedNode === n.id ? `1.5px solid ${s.color}` : `1px solid ${dark ? '#2d2d35' : '#e9ecef'}`,
                        padding: '16px', position: 'relative', overflow: 'hidden',
                        boxShadow: selectedNode === n.id ? `0 0 0 3px ${s.color}22, 0 6px 20px rgba(0,0,0,0.12)` : '0 4px 12px rgba(0,0,0,0.06)',
                        cursor: 'pointer', userSelect: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                    >
                      <div style={{ position: 'absolute', top: -30, left: -30, width: 100, height: 100, borderRadius: '50%', filter: 'blur(35px)', background: s.color, opacity: dark ? 0.08 : 0.05, pointerEvents: 'none' }} />
                      <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: dark ? 'rgba(255,255,255,0.04)' : '#f8f9fa', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${s.color}22`, flexShrink: 0 }}>
                          {ICON_MAP[n.icon] || <Zap size={14} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, letterSpacing: '-0.1px' }}>{n.label}</div>
                          <div style={{ fontSize: 11, color: t.sub, marginTop: 2, lineHeight: 1.35 }}>{n.desc}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Step button — opens node picker for this stage */}
                <button
                  className="workflow-add-btn"
                  onClick={(e) => { e.stopPropagation(); setNodePicker(nodePicker === s.id ? null : s.id); }}
                  style={{
                    padding: '13px', borderRadius: 20,
                    border: nodePicker === s.id ? `1.5px solid ${s.color}88` : `1.2px dashed ${dark ? '#333' : '#ccc'}`,
                    background: nodePicker === s.id ? `${s.color}11` : 'transparent',
                    color: nodePicker === s.id ? s.color : t.sub,
                    cursor: 'pointer', pointerEvents: 'auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                  }}
                >
                  <Plus size={15} /> Add Step
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Node picker panel — slides in from right edge of canvas */}
        {nodePicker && (
          <NodePickerPanel
            stageId={nodePicker}
            onAdd={(item) => addNodeFromPicker(nodePicker, item)}
            onClose={() => setNodePicker(null)}
            dark={dark}
            t={t}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeIn    { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes panelSlideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        .workflow-add-btn:hover { border-color: ${dark ? '#555' : '#aaa'} !important; }
      `}</style>
    </div>
  );
}
