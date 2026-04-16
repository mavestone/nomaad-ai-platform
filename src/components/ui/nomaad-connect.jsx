import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Search, X, UserPlus, Clock, Copy, Check, Users,
  Zap, Camera, Edit3, Briefcase, Film, Palette, Star,
} from "lucide-react";

// ─── Mock Nomaad community members ────────────────────────────────────────────
// In production these would come from Supabase `profiles` table
const MEMBERS = [
  { id:"m1",  name:"Ava Mitchell",    role:"Photographer",      type:"photo",   online:true,  status:"Online",    loc:"Sydney",       img:"https://i.pravatar.cc/150?img=47", tagline:"Capturing emotion through light" },
  { id:"m2",  name:"Luca Ferretti",   role:"Videographer",      type:"video",   online:true,  status:"Online",    loc:"Milan",        img:"https://i.pravatar.cc/150?img=11", tagline:"Director of commercial & editorial" },
  { id:"m3",  name:"Maya Patel",      role:"Graphic Designer",  type:"design",  online:true,  status:"Online",    loc:"London",       img:"https://i.pravatar.cc/150?img=48", tagline:"Brand identity & motion design" },
  { id:"m4",  name:"Noah Klein",      role:"Film Editor",       type:"edit",    online:false, status:"45m ago",   loc:"Berlin",       img:"https://i.pravatar.cc/150?img=12", tagline:"Post-production & colour grading" },
  { id:"m5",  name:"Sara Oduya",      role:"Content Creator",   type:"create",  online:false, status:"2h ago",    loc:"Lagos",        img:"https://i.pravatar.cc/150?img=49", tagline:"Social-first storytelling" },
  { id:"m6",  name:"James Whitfield", role:"Producer",          type:"produce", online:false, status:"3h ago",    loc:"Los Angeles",  img:"https://i.pravatar.cc/150?img=13", tagline:"Commercials & music videos" },
  { id:"m7",  name:"Cleo Dubois",     role:"Photographer",      type:"photo",   online:false, status:"Yesterday", loc:"Paris",        img:"https://i.pravatar.cc/150?img=44", tagline:"Editorial & fashion photography" },
  { id:"m8",  name:"Raj Sharma",      role:"Videographer",      type:"video",   online:false, status:"Yesterday", loc:"Mumbai",       img:"https://i.pravatar.cc/150?img=14", tagline:"Documentary & branded content" },
];

const ROLE_STYLES = {
  photo:   { color:"#ccfd01", bg:"rgba(204,253,1,0.12)",   icon:<Camera  size={10} strokeWidth={2.5}/> },
  video:   { color:"#5AC8FA", bg:"rgba(90,200,250,0.12)",  icon:<Film    size={10} strokeWidth={2.5}/> },
  design:  { color:"#FF6259", bg:"rgba(255,98,89,0.12)",   icon:<Palette size={10} strokeWidth={2.5}/> },
  edit:    { color:"#AF52DE", bg:"rgba(175,82,222,0.12)",  icon:<Edit3   size={10} strokeWidth={2.5}/> },
  create:  { color:"#FFB340", bg:"rgba(255,179,64,0.12)",  icon:<Star    size={10} strokeWidth={2.5}/> },
  produce: { color:"#34C759", bg:"rgba(52,199,89,0.12)",   icon:<Briefcase size={10} strokeWidth={2.5}/> },
};

const spring = { type:"spring", stiffness:420, damping:32 };
const sweepSpring = { type:"spring", stiffness:400, damping:35, mass:0.5 };

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ type, label, t }) {
  const s = ROLE_STYLES[type] || ROLE_STYLES.photo;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:20,
      background:s.bg, color:s.color, fontSize:11, fontWeight:600, flexShrink:0, border:`1px solid ${s.color}22` }}>
      {s.icon} {label}
    </div>
  );
}

// ─── Member list row ──────────────────────────────────────────────────────────
function MemberRow({ member, onClick, t, dark }) {
  return (
    <motion.div
      variants={{ hidden:{opacity:0,x:10,y:12}, visible:{opacity:1,x:0,y:0} }}
      transition={sweepSpring}
      onClick={() => onClick(member)}
      style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
        borderBottom:`1px solid ${t.divider}`, cursor:"pointer", transition:"background 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
    >
      {/* Avatar + online dot */}
      <div style={{ position:"relative", flexShrink:0 }}>
        <img src={member.img} alt={member.name}
          style={{ width:44, height:44, borderRadius:22, objectFit:"cover", border:`2px solid ${t.cardBorder}` }}
          onError={e => { e.target.style.display="none"; }}
        />
        {member.online && (
          <div style={{ position:"absolute", bottom:0, right:0, width:13, height:13, borderRadius:"50%",
            background:t.card, display:"flex", alignItems:"center", justifyContent:"center", border:`1.5px solid ${t.card}` }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#34C759" }}/>
          </div>
        )}
      </div>

      {/* Name + status */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:t.text, lineHeight:1.2 }}>{member.name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
          {member.online && <div style={{ width:6, height:6, borderRadius:"50%", background:"#34C759", flexShrink:0 }}/>}
          <span style={{ fontSize:12, color:member.online?"#34C759":t.sub }}>{member.status}</span>
          <span style={{ fontSize:11, color:t.muted }}>· {member.loc}</span>
        </div>
      </div>

      {/* Role badge */}
      <RoleBadge type={member.type} label={member.role} t={t}/>
    </motion.div>
  );
}

// ─── Profile card popup ───────────────────────────────────────────────────────
function ProfileCard({ member, pos, onClose, onConnect, connected, t, dark }) {
  const [copied, setCopied] = useState(false);
  const VOLT = "#ccfd01";
  const now = new Date();
  const h = ((now.getHours() + 11) % 12) + 1;
  const m = now.getMinutes().toString().padStart(2,"0");
  const ampm = now.getHours() >= 12 ? "PM" : "AM";
  const timeText = `${h}:${m} ${ampm}`;
  const s = ROLE_STYLES[member.type] || ROLE_STYLES.photo;

  const PW = 300, PH = 390;
  let left = pos ? pos.x - PW - 16 : window.innerWidth/2 - PW/2;
  let top  = pos ? pos.y - PH/2 : window.innerHeight/2 - PH/2;
  if (pos) {
    if (left < 16) left = pos.x + 16;
    if (left + PW > window.innerWidth - 16) left = window.innerWidth - PW - 16;
    if (top < 16) top = 16;
    if (top + PH > window.innerHeight - 16) top = window.innerHeight - PH - 16;
  }

  return (
    <>
      <div style={{ position:"fixed",inset:0,zIndex:498 }} onClick={onClose}/>
      <motion.div
        initial={{ opacity:0, scale:0.92, y:8 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.92, y:8 }}
        transition={spring}
        style={{ position:"fixed", left, top, width:PW, zIndex:500, fontFamily:"inherit" }}
        onClick={e=>e.stopPropagation()}
      >
        {/* Volt glow beneath card */}
        <div style={{ position:"absolute", bottom:-20, left:"10%", right:"10%", height:40,
          background:s.color, filter:"blur(28px)", opacity:0.55, borderRadius:"50%", zIndex:0, pointerEvents:"none" }}/>

        {/* Tagline below card */}
        <div style={{ position:"absolute", bottom:-38, left:0, right:0, textAlign:"center",
          fontSize:12, fontWeight:600, color:dark?"rgba(255,255,255,0.6)":"rgba(0,0,0,0.5)",
          display:"flex", alignItems:"center", justifyContent:"center", gap:5, zIndex:1 }}>
          <Zap size={12} style={{ color:s.color }}/> {member.tagline}
        </div>

        {/* Main card */}
        <div style={{ position:"relative", zIndex:2,
          background: dark ? "rgba(22,22,26,0.92)" : "rgba(255,255,255,0.88)",
          backdropFilter:"blur(40px) saturate(2)",
          border:`1px solid ${dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.1)"}`,
          borderRadius:22, overflow:"hidden",
          boxShadow: dark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 24px 64px rgba(0,0,0,0.15)" }}>

          {/* Status bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 16px 10px", borderBottom:`1px solid ${dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)"}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ width:9,height:9,borderRadius:"50%",background:member.online?"#34C759":"#8E8E93",display:"inline-block",animation:member.online?"pulse 2s infinite":undefined }}/>
              <span style={{ fontSize:12,fontWeight:500,color:member.online?"#34C759":t.sub }}>{member.status}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, color:t.sub, fontSize:12 }}>
              <Clock size={12}/> {timeText}
            </div>
          </div>

          {/* Avatar + name */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 16px 16px" }}>
            <div style={{ width:100,height:100,borderRadius:20,overflow:"hidden",
              border:`2px solid ${dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.08)"}`,
              marginBottom:12, boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>
              <img src={member.img} alt={member.name} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
            </div>
            <div style={{ fontSize:20,fontWeight:700,color:t.text,letterSpacing:-0.4,marginBottom:4 }}>{member.name}</div>
            <div style={{ fontSize:13,color:t.sub }}>{member.role} · {member.loc}</div>
          </div>

          {/* Actions */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"0 16px 16px" }}>
            <button onClick={onConnect}
              style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:7,
                padding:"10px 0",borderRadius:12,border:"none",fontFamily:"inherit",
                background:connected?"rgba(52,199,89,0.12)":s.bg,
                color:connected?"#34C759":s.color,
                fontSize:13,fontWeight:600,cursor:"pointer", transition:"all 0.2s" }}>
              {connected ? <><Check size={14}/> Connected</> : <><UserPlus size={14}/> Connect</>}
            </button>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(`${member.name.split(" ")[0].toLowerCase()}@nomaad.app`).catch(()=>{});
                setCopied(true); setTimeout(()=>setCopied(false),1500);
              }}
              style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:7,
                padding:"10px 0",borderRadius:12,
                border:`1px solid ${dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"}`,
                background:dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.03)",
                color:t.sub,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
              {copied ? <><Check size={14} style={{color:"#34C759"}}/> Copied</> : <><Copy size={14}/> Copy</>}
            </button>
          </div>
        </div>

        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </motion.div>
    </>
  );
}

// ─── Expanding member directory drawer ────────────────────────────────────────
function MemberDirectoryDrawer({ members, t, dark, onMemberClick }) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const VOLT = "#ccfd01";

  const filtered = useMemo(() => {
    if (!query) return members;
    const q = query.toLowerCase();
    return members.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
  }, [members, query]);

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        height:    expanded ? "calc(100% - 16px)" : 68,
        width:     expanded ? "calc(100% - 16px)" : "calc(100% - 40px)",
        bottom:    expanded ? 8  : 16,
        left:      expanded ? 8  : 20,
        borderRadius: expanded ? 24 : 20,
      }}
      transition={{ type:"spring", stiffness:240, damping:30, mass:0.8 }}
      style={{ position:"absolute", zIndex:50, overflow:"hidden",
        background: dark ? "rgba(22,22,26,0.95)" : "rgba(252,251,249,0.97)",
        border:`1px solid ${dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"}`,
        backdropFilter:"blur(32px)",
        boxShadow: dark?"0 -8px 40px rgba(0,0,0,0.4)":"0 -8px 40px rgba(0,0,0,0.1)",
        cursor: expanded ? "default" : "pointer",
        display:"flex", flexDirection:"column" }}
      onClick={() => !expanded && setExpanded(true)}
    >
      {/* Drawer handle row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 14px", height:68, flexShrink:0,
        borderBottom: expanded ? `1px solid ${t.divider}` : "none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:40,height:40,borderRadius:12,
            background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            border:`1px solid ${t.cardBorder}`,
            display:"flex",alignItems:"center",justifyContent:"center",color:t.sub }}>
            <Users size={18} strokeWidth={1.8}/>
          </div>
          <div>
            <div style={{ fontSize:14,fontWeight:600,color:t.text,lineHeight:1.2 }}>Member Directory</div>
            <div style={{ fontSize:11,color:t.sub,marginTop:1 }}>{members.length} Nomaad members</div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Stacked avatars when collapsed */}
          {!expanded && (
            <div style={{ display:"flex", alignItems:"center" }}>
              <div style={{ display:"flex" }}>
                {members.slice(0,3).map((m,i) => (
                  <img key={m.id} src={m.img} alt={m.name}
                    style={{ width:34,height:34,borderRadius:17,objectFit:"cover",
                      border:`2px solid ${dark?"rgba(22,22,26,0.95)":"rgba(252,251,249,0.97)"}`,
                      marginLeft:i===0?0:-10,zIndex:3-i }}/>
                ))}
                <div style={{ width:34,height:34,borderRadius:17,
                  background:t.input,border:`2px solid ${dark?"rgba(22,22,26,0.95)":"rgba(252,251,249,0.97)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,fontWeight:600,color:t.sub,marginLeft:-10 }}>
                  +{members.length - 3}
                </div>
              </div>
            </div>
          )}

          {expanded && (
            <button onClick={e=>{ e.stopPropagation(); setExpanded(false); setQuery(""); }}
              style={{ width:32,height:32,borderRadius:10,border:`1px solid ${t.inputBorder}`,
                background:t.input,color:t.sub,display:"flex",alignItems:"center",
                justifyContent:"center",cursor:"pointer" }}>
              <X size={14}/>
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity:0, y:-8 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }}
            style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}
          >
            {/* Search */}
            <div style={{ padding:"10px 14px", borderBottom:`1px solid ${t.divider}`, flexShrink:0 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 10px",
                borderRadius:10,background:t.input,border:`1px solid ${t.inputBorder}` }}>
                <Search size={13} style={{ color:t.muted,flexShrink:0 }}/>
                <input autoFocus value={query} onChange={e=>setQuery(e.target.value)}
                  placeholder="Search members…"
                  style={{ background:"transparent",border:"none",color:t.text,fontSize:13,outline:"none",fontFamily:"inherit",width:"100%" }}/>
              </div>
            </div>

            {/* List */}
            <div style={{ flex:1,overflowY:"auto" }}>
              <motion.div initial="hidden" animate="visible"
                variants={{ visible:{ transition:{ staggerChildren:0.03, delayChildren:0.05 }} }}>
                {filtered.map(m => (
                  <MemberRow key={`dir-${m.id}`} member={m} t={t} dark={dark}
                    onClick={member=>{ onMemberClick(member); setExpanded(false); }}/>
                ))}
                {filtered.length===0 && (
                  <div style={{ padding:24,textAlign:"center",fontSize:13,color:t.muted }}>No members found</div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function NomaadConnect({ t, dark, mobile }) {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState(null);
  const [clickPos,       setClickPos]       = useState(null);
  const [connected,      setConnected]      = useState(new Set());
  const VOLT = "#ccfd01";

  const online  = MEMBERS.filter(m => m.online);
  const offline = MEMBERS.filter(m => !m.online);
  const card = (ex={}) => ({
    background:t.card, border:`1px solid ${t.cardBorder}`,
    borderRadius:20, boxShadow:t.cardShadow,
    backdropFilter:"blur(24px) saturate(1.6)", ...ex
  });

  const handleMemberClick = (member, e) => {
    setSelectedMember(member);
    setClickPos(e ? { x:e.clientX, y:e.clientY } : null);
  };

  const toggleConnect = () => {
    setConnected(prev => {
      const next = new Set(prev);
      if (next.has(selectedMember.id)) next.delete(selectedMember.id);
      else next.add(selectedMember.id);
      return next;
    });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:16, position:"relative" }}>

      {/* ── Header ── */}
      <div style={{ ...card(), padding:"20px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h1 style={{ fontSize:24,fontWeight:700,letterSpacing:-0.5,color:t.text,margin:0 }}>Connect</h1>
            <p style={{ fontSize:13,color:t.sub,marginTop:4 }}>Discover and collaborate with Nomaad creatives</p>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 14px",borderRadius:20,
            background:`rgba(${VOLT.slice(1).match(/../g).map(x=>parseInt(x,16)).join(",")},0.08)`,
            border:`1px solid ${VOLT}33` }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:"#34C759",animation:"pulse 2s infinite" }}/>
            <span style={{ fontSize:12,fontWeight:600,color:t.text }}>{online.length} online now</span>
          </div>
        </div>
      </div>

      {/* ── Online now ── */}
      <div style={{ ...card(), padding:"20px 24px", flexShrink:0 }}>
        <div style={{ fontSize:11,fontWeight:700,color:t.muted,letterSpacing:0.7,textTransform:"uppercase",marginBottom:14 }}>
          Online Now
        </div>
        <div style={{ display:"flex", gap:14, overflowX:"auto", paddingBottom:4 }}>
          {online.map(m => {
            const s = ROLE_STYLES[m.type] || ROLE_STYLES.photo;
            return (
              <div key={m.id}
                onClick={e => handleMemberClick(m, e)}
                style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                  cursor:"pointer",flexShrink:0,userSelect:"none" }}
              >
                <div style={{ position:"relative" }}>
                  <div style={{ width:64,height:64,borderRadius:32,overflow:"hidden",
                    border:`2.5px solid ${s.color}`,
                    boxShadow:`0 0 0 4px ${s.color}18` }}>
                    <img src={m.img} alt={m.name} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                  </div>
                  <div style={{ position:"absolute",bottom:1,right:1,width:14,height:14,borderRadius:7,
                    background:t.card,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <div style={{ width:9,height:9,borderRadius:"50%",background:"#34C759" }}/>
                  </div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:12,fontWeight:600,color:t.text,whiteSpace:"nowrap" }}>{m.name.split(" ")[0]}</div>
                  <div style={{ fontSize:10,color:s.color,marginTop:1 }}>{m.role}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recently active list ── */}
      <div style={{ ...card(), flex:1, overflow:"hidden", position:"relative" }}>
        <div style={{ padding:"14px 16px 10px", borderBottom:`1px solid ${t.divider}`, fontSize:11, fontWeight:700,
          color:t.muted, letterSpacing:0.7, textTransform:"uppercase" }}>
          Recently Active
        </div>
        <div style={{ overflowY:"auto", height:"calc(100% - 120px)" }}>
          <motion.div initial="hidden" animate="visible"
            variants={{ visible:{ transition:{ staggerChildren:0.04, delayChildren:0.05 }} }}>
            {offline.map(m => (
              <MemberRow key={m.id} member={m} t={t} dark={dark}
                onClick={(member) => handleMemberClick(member)}/>
            ))}
          </motion.div>
        </div>

        {/* Bottom expanding drawer */}
        <MemberDirectoryDrawer members={MEMBERS} t={t} dark={dark}
          onMemberClick={(m) => handleMemberClick(m)}/>
      </div>

      {/* ── Profile card popup ── */}
      <AnimatePresence>
        {selectedMember && (
          <ProfileCard
            member={selectedMember}
            pos={clickPos}
            onClose={() => { setSelectedMember(null); setClickPos(null); }}
            onConnect={toggleConnect}
            connected={connected.has(selectedMember.id)}
            t={t} dark={dark}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
