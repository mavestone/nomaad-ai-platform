import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Search, ArrowLeft, UserPlus, Check, MapPin,
  Camera, Edit3, Briefcase, Film, Palette, Star, Users, ExternalLink,
} from "lucide-react";

// ─── Mock community data ───────────────────────────────────────────────────────
const MEMBERS = [
  {
    id: "m1", name: "Ava Mitchell", role: "Photographer", type: "photo",
    online: true, status: "Online now", loc: "Sydney, AU",
    img: "https://i.pravatar.cc/150?img=47",
    bio: "Award-winning commercial photographer specialising in lifestyle and editorial. Clients include Vogue, Adidas, and Tourism Australia.",
    mutuals: ["Luca Ferretti", "Maya Patel"],
    connections: 284,
    projects: [
      { id: 1, title: "Adidas SS24 Campaign", cat: "Commercial", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", year: "2024" },
      { id: 2, title: "Vogue Australia Editorial", cat: "Editorial", img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80", year: "2024" },
      { id: 3, title: "Tourism AU Landscapes", cat: "Travel", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", year: "2023" },
      { id: 4, title: "Urban Portraits Series", cat: "Portrait", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80", year: "2023" },
    ],
  },
  {
    id: "m2", name: "Luca Ferretti", role: "Videographer", type: "video",
    online: true, status: "Online now", loc: "Milan, IT",
    img: "https://i.pravatar.cc/150?img=11",
    bio: "Director of photography and commercial videographer with 10+ years in automotive and luxury fashion. Collaborated with Ferrari, Valentino, and Prada.",
    mutuals: ["Ava Mitchell", "James Whitfield"],
    connections: 412,
    projects: [
      { id: 1, title: "Ferrari Purosangue Launch", cat: "Automotive", img: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400&q=80", year: "2024" },
      { id: 2, title: "Valentino FW24 Film", cat: "Fashion", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", year: "2024" },
      { id: 3, title: "Prada Linea Rossa", cat: "Commercial", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80", year: "2023" },
    ],
  },
  {
    id: "m3", name: "Maya Patel", role: "Graphic Designer", type: "design",
    online: true, status: "Online now", loc: "London, UK",
    img: "https://i.pravatar.cc/150?img=48",
    bio: "Brand identity and motion designer. Obsessed with typography and systems thinking. Previously at Pentagram, now freelance.",
    mutuals: ["Ava Mitchell", "Noah Klein"],
    connections: 198,
    projects: [
      { id: 1, title: "Oatly Rebrand", cat: "Branding", img: "https://images.unsplash.com/photo-1561069934-eee225952461?w=400&q=80", year: "2024" },
      { id: 2, title: "Notion Design System", cat: "UI/UX", img: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80", year: "2023" },
      { id: 3, title: "Motion Manifesto", cat: "Motion", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80", year: "2023" },
    ],
  },
  {
    id: "m4", name: "Noah Klein", role: "Film Editor", type: "edit",
    online: false, status: "45 min ago", loc: "Berlin, DE",
    img: "https://i.pravatar.cc/150?img=12",
    bio: "Post-production specialist. Colour grading and offline editing for commercials and feature films. DaVinci Resolve certified.",
    mutuals: ["Maya Patel"],
    connections: 156,
    projects: [
      { id: 1, title: "BMW i7 Global TVC", cat: "Automotive", img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80", year: "2024" },
      { id: 2, title: "Spotify Wrapped 2023", cat: "Digital", img: "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=400&q=80", year: "2023" },
    ],
  },
  {
    id: "m5", name: "Sara Oduya", role: "Content Creator", type: "create",
    online: false, status: "2 hrs ago", loc: "Lagos, NG",
    img: "https://i.pravatar.cc/150?img=49",
    bio: "Social-first storytelling with a Gen-Z lens. 2.4M across platforms. Brand partnerships with Nike, Spotify, and Apple.",
    mutuals: ["Ava Mitchell", "James Whitfield"],
    connections: 1820,
    projects: [
      { id: 1, title: "Nike x Africa Campaign", cat: "Social", img: "https://images.unsplash.com/photo-1552066344-2464c1135c32?w=400&q=80", year: "2024" },
      { id: 2, title: "Spotify Africa Unwrapped", cat: "Content", img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80", year: "2023" },
    ],
  },
  {
    id: "m6", name: "James Whitfield", role: "Producer", type: "produce",
    online: false, status: "3 hrs ago", loc: "Los Angeles, US",
    img: "https://i.pravatar.cc/150?img=13",
    bio: "Commercial and music video producer. Line producer for 200+ spots. Roster of top-tier directors. Always looking for fresh talent.",
    mutuals: ["Luca Ferretti", "Sara Oduya"],
    connections: 634,
    projects: [
      { id: 1, title: "Beyoncé 'Cowboy Carter' Visuals", cat: "Music Video", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80", year: "2024" },
      { id: 2, title: "Apple iPhone 16 Launch", cat: "Commercial", img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80", year: "2024" },
      { id: 3, title: "Mercedes EQS TVC", cat: "Automotive", img: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80", year: "2023" },
    ],
  },
  {
    id: "m7", name: "Cleo Dubois", role: "Photographer", type: "photo",
    online: false, status: "Yesterday", loc: "Paris, FR",
    img: "https://i.pravatar.cc/150?img=44",
    bio: "Editorial and fashion photographer based in Paris. Regular contributor to Vogue Paris, Harper's Bazaar, and Elle.",
    mutuals: ["Ava Mitchell"],
    connections: 347,
    projects: [
      { id: 1, title: "Dior Cruise Collection", cat: "Fashion", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80", year: "2024" },
      { id: 2, title: "Hermès Silk Stories", cat: "Editorial", img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80", year: "2023" },
    ],
  },
  {
    id: "m8", name: "Raj Sharma", role: "Videographer", type: "video",
    online: false, status: "Yesterday", loc: "Mumbai, IN",
    img: "https://i.pravatar.cc/150?img=14",
    bio: "Documentary and branded content director. 15 years telling South Asian stories for global brands. Sundance alumni.",
    mutuals: ["Luca Ferretti"],
    connections: 278,
    projects: [
      { id: 1, title: "Tata Motors Documentary", cat: "Documentary", img: "https://images.unsplash.com/photo-1449130275-c7f2e4ca23f1?w=400&q=80", year: "2024" },
      { id: 2, title: "Bollywood BTS Series", cat: "Behind-the-Scenes", img: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80", year: "2023" },
    ],
  },
];

const ROLE_STYLES = {
  photo:   { color: "#ccfd01", bg: "rgba(204,253,1,0.1)",   icon: <Camera   size={11} strokeWidth={2.5}/> },
  video:   { color: "#5AC8FA", bg: "rgba(90,200,250,0.1)",  icon: <Film     size={11} strokeWidth={2.5}/> },
  design:  { color: "#FF6259", bg: "rgba(255,98,89,0.1)",   icon: <Palette  size={11} strokeWidth={2.5}/> },
  edit:    { color: "#AF52DE", bg: "rgba(175,82,222,0.1)",  icon: <Edit3    size={11} strokeWidth={2.5}/> },
  create:  { color: "#FFB340", bg: "rgba(255,179,64,0.1)",  icon: <Star     size={11} strokeWidth={2.5}/> },
  produce: { color: "#34C759", bg: "rgba(52,199,89,0.1)",   icon: <Briefcase size={11} strokeWidth={2.5}/> },
};

const CATS = ["All", "photo", "video", "design", "edit", "create", "produce"];
const CAT_LABELS = { All: "All", photo: "Photography", video: "Video", design: "Design", edit: "Editing", create: "Content", produce: "Production" };

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ type, label }) {
  const s = ROLE_STYLES[type] || ROLE_STYLES.photo;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px",
      borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600,
      border: `1px solid ${s.color}33` }}>
      {s.icon} {label}
    </span>
  );
}

// ─── Member card (LinkedIn row style) ────────────────────────────────────────
function MemberCard({ member, onNameClick, onConnect, connected, t, dark, idx }) {
  const s = ROLE_STYLES[member.type] || ROLE_STYLES.photo;
  const ease = "all 0.2s ease";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, type: "spring", stiffness: 400, damping: 32 }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 16, padding: "20px 24px",
        borderBottom: `1px solid ${t.divider}`,
      }}
    >
      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }} onClick={() => onNameClick(member)} style={{ cursor: "pointer", position: "relative", flexShrink: 0 }}>
        <img src={member.img} alt={member.name}
          style={{ width: 56, height: 56, borderRadius: 28, objectFit: "cover",
            border: `2px solid ${member.online ? s.color : t.cardBorder}`,
            boxShadow: member.online ? `0 0 0 3px ${s.color}22` : "none",
            display: "block" }}
          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=333&color=fff`; }}
        />
        {member.online && (
          <div style={{ position: "absolute", bottom: 1, right: 1, width: 13, height: 13,
            borderRadius: "50%", background: "#34C759",
            border: `2px solid ${dark ? "#0d0d12" : "#fff"}` }}/>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name */}
            <button
              onClick={() => onNameClick(member)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: -0.2,
                textDecoration: "none", transition: ease }}
                onMouseEnter={e => e.target.style.color = s.color}
                onMouseLeave={e => e.target.style.color = t.text}>
                {member.name}
              </span>
            </button>

            {/* Role + location */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <RoleBadge type={member.type} label={member.role} />
              <span style={{ fontSize: 12, color: t.sub, display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={10} /> {member.loc}
              </span>
            </div>

            {/* Bio */}
            <p style={{ fontSize: 13, color: t.sub, margin: "8px 0 0", lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {member.bio}
            </p>

            {/* Mutual connections */}
            {member.mutuals.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                <div style={{ display: "flex" }}>
                  {member.mutuals.slice(0, 2).map((name, i) => {
                    const m = MEMBERS.find(x => x.name === name);
                    return m ? (
                      <img key={i} src={m.img} alt={name}
                        style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover",
                          border: `1.5px solid ${dark ? "#0d0d12" : "#fff"}`,
                          marginLeft: i === 0 ? 0 : -6 }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    ) : null;
                  })}
                </div>
                <span style={{ fontSize: 11, color: t.muted }}>
                  {member.mutuals[0]}{member.mutuals.length > 1 ? ` and ${member.mutuals.length - 1} other` : ""} · mutual connection{member.mutuals.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Connect button */}
          <button
            onClick={() => onConnect(member.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: connected ? "8px 16px" : "8px 18px",
              borderRadius: 20,
              border: connected ? `1px solid ${t.cardBorder}` : `1.5px solid ${s.color}`,
              background: connected ? t.input : s.bg,
              color: connected ? t.sub : s.color,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", flexShrink: 0,
              transition: "all 0.2s ease",
            }}>
            {connected ? <><Check size={14}/> Connected</> : <><UserPlus size={14}/> Connect</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Profile / Portfolio page ──────────────────────────────────────────────────
function ProfilePage({ member, onBack, onConnect, connected, t, dark }) {
  const s = ROLE_STYLES[member.type] || ROLE_STYLES.photo;
  const [hoveredProject, setHoveredProject] = useState(null);

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* Back */}
      <button onClick={onBack}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "none",
          border: "none", color: t.sub, fontSize: 13, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", padding: 0, alignSelf: "flex-start" }}>
        <ArrowLeft size={16} /> Back to Connect
      </button>

      {/* Hero card */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 24,
        boxShadow: t.cardShadow, backdropFilter: "blur(24px) saturate(1.6)", overflow: "hidden" }}>

        {/* Banner */}
        <div style={{ height: 120, background: `linear-gradient(135deg, ${s.color}22, ${s.color}06)`,
          borderBottom: `1px solid ${s.color}22`, position: "relative" }}>
          {/* Subtle pattern */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.15,
            backgroundImage: `radial-gradient(circle at 20% 50%, ${s.color} 0.5px, transparent 0.5px), radial-gradient(circle at 80% 20%, ${s.color} 0.5px, transparent 0.5px)`,
            backgroundSize: "24px 24px" }}/>
        </div>

        <div style={{ padding: "0 28px 28px" }}>
          {/* Avatar (overlapping banner) */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: -36 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 88, height: 88, borderRadius: 22, overflow: "hidden",
                border: `3px solid ${dark ? "#0d0d12" : "#f5f5f0"}`,
                boxShadow: `0 0 0 3px ${s.color}44, 0 8px 32px rgba(0,0,0,0.3)` }}>
                <img src={member.img} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=333&color=fff`; }}
                />
              </div>
              {member.online && (
                <div style={{ position: "absolute", bottom: 4, right: 4, width: 16, height: 16,
                  borderRadius: "50%", background: "#34C759",
                  border: `2.5px solid ${dark ? "#0d0d12" : "#f5f5f0"}` }}/>
              )}
            </div>

            {/* Connect button */}
            <button onClick={() => onConnect(member.id)}
              style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "10px 22px", borderRadius: 20,
                border: connected ? `1px solid ${t.cardBorder}` : "none",
                background: connected ? t.input : s.color === "#ccfd01" ? "#ccfd01" : s.bg,
                color: connected ? t.sub : s.color === "#ccfd01" ? "#0a0a0a" : s.color,
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                boxShadow: connected ? "none" : `0 4px 20px ${s.color}44`, transition: "all 0.25s" }}>
              {connected ? <><Check size={15}/> Connected</> : <><UserPlus size={15}/> Connect</>}
            </button>
          </div>

          {/* Identity */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: -0.5, margin: 0 }}>
                {member.name}
              </h2>
              <RoleBadge type={member.type} label={member.role} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
              <span style={{ fontSize: 13, color: t.sub, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} /> {member.loc}
              </span>
              <span style={{ fontSize: 13, color: t.sub, display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={12} /> {member.connections.toLocaleString()} connections
              </span>
              {member.online
                ? <span style={{ fontSize: 12, color: "#34C759", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34C759", display: "inline-block" }}/> Online now
                  </span>
                : <span style={{ fontSize: 12, color: t.muted }}>{member.status}</span>
              }
            </div>

            <p style={{ fontSize: 14, color: t.sub, marginTop: 12, lineHeight: 1.65, maxWidth: 560 }}>
              {member.bio}
            </p>

            {/* Mutuals */}
            {member.mutuals.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12,
                padding: "8px 12px", borderRadius: 12, background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${t.divider}`, alignSelf: "flex-start", width: "fit-content" }}>
                <div style={{ display: "flex" }}>
                  {member.mutuals.slice(0, 3).map((name, i) => {
                    const m = MEMBERS.find(x => x.name === name);
                    return m ? (
                      <img key={i} src={m.img} alt={name}
                        style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover",
                          border: `2px solid ${dark ? "#0d0d12" : "#fff"}`, marginLeft: i === 0 ? 0 : -8 }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    ) : null;
                  })}
                </div>
                <span style={{ fontSize: 12, color: t.sub }}>
                  {member.mutuals.join(", ")} · mutual connection{member.mutuals.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects on Nomaad */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 24,
        boxShadow: t.cardShadow, backdropFilter: "blur(24px) saturate(1.6)", padding: 24 }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text, letterSpacing: -0.3, margin: 0 }}>Portfolio</h3>
            <p style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>{member.projects.length} projects completed on Nomaad</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
          {member.projects.map((proj, i) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 32 }}
              onMouseEnter={() => setHoveredProject(proj.id)}
              onMouseLeave={() => setHoveredProject(null)}
              style={{ borderRadius: 16, overflow: "hidden", cursor: "pointer",
                border: `1px solid ${hoveredProject === proj.id ? s.color + "55" : t.cardBorder}`,
                boxShadow: hoveredProject === proj.id ? `0 8px 32px ${s.color}22` : "none",
                transition: "all 0.25s ease" }}
            >
              {/* Project image */}
              <div style={{ position: "relative", height: 130, overflow: "hidden" }}>
                <img src={proj.img} alt={proj.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover",
                    transform: hoveredProject === proj.id ? "scale(1.06)" : "scale(1)",
                    transition: "transform 0.4s ease" }}
                  onError={e => { e.target.style.background = "#333"; e.target.style.display = "none"; }}
                />
                <div style={{ position: "absolute", inset: 0,
                  background: hoveredProject === proj.id
                    ? `linear-gradient(to top, rgba(0,0,0,0.6), transparent)`
                    : "linear-gradient(to top, rgba(0,0,0,0.35), transparent)" }}/>
                {/* Category badge on image */}
                <div style={{ position: "absolute", top: 8, left: 8, padding: "2px 8px",
                  borderRadius: 8, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                  fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 0.3 }}>
                  {proj.cat}
                </div>
              </div>

              {/* Project info */}
              <div style={{ padding: "12px 14px",
                background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, lineHeight: 1.3,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {proj.title}
                </div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>{proj.year}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function NomaadConnect({ t, dark, mobile }) {
  const { user } = useAuth();
  const [query, setQuery]             = useState("");
  const [catFilter, setCatFilter]     = useState("All");
  const [connected, setConnected]     = useState(new Set());
  const [profileMember, setProfileMember] = useState(null);

  const filtered = useMemo(() => {
    return MEMBERS.filter(m => {
      if (catFilter !== "All" && m.type !== catFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.loc.toLowerCase().includes(q);
      }
      return true;
    });
  }, [query, catFilter]);

  const toggleConnect = (id) => {
    setConnected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const online = MEMBERS.filter(m => m.online).length;

  const cardStyle = {
    background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 24,
    boxShadow: t.cardShadow, backdropFilter: "blur(24px) saturate(1.6)",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <AnimatePresence mode="wait">
        {profileMember ? (
          <ProfilePage
            key="profile"
            member={profileMember}
            onBack={() => setProfileMember(null)}
            onConnect={toggleConnect}
            connected={connected.has(profileMember.id)}
            t={t} dark={dark}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}
          >
            {/* Header */}
            <div style={{ ...cardStyle, padding: "20px 24px", display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 16, flexShrink: 0 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: t.text, margin: 0 }}>Connect</h1>
                <p style={{ fontSize: 13, color: t.sub, marginTop: 3, margin: "3px 0 0" }}>
                  Discover and collaborate with Nomaad creatives
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Online pill */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                  borderRadius: 20, background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.3)" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34C759",
                    animation: "ncPulse 2s infinite" }}/>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#34C759" }}>{online} online</span>
                </div>

                {/* Search */}
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: t.muted, pointerEvents: "none" }}/>
                  <input
                    value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search people…"
                    style={{ padding: "8px 12px 8px 32px", borderRadius: 12, border: `1px solid ${t.inputBorder}`,
                      background: t.input, color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit", width: 200 }}
                  />
                </div>
              </div>
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0, overflowX: "auto", paddingBottom: 2 }}>
              {CATS.map(cat => {
                const active = catFilter === cat;
                const s = cat === "All" ? null : ROLE_STYLES[cat];
                return (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    style={{ flexShrink: 0, padding: "6px 16px", borderRadius: 20, fontFamily: "inherit",
                      border: `1px solid ${active ? (s ? s.color : "#ccfd01") : t.cardBorder}`,
                      background: active ? (s ? s.bg : "rgba(204,253,1,0.1)") : t.input,
                      color: active ? (s ? s.color : "#ccfd01") : t.sub,
                      fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                    {CAT_LABELS[cat]}
                  </button>
                );
              })}
            </div>

            {/* Member list */}
            <div style={{ ...cardStyle, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* List header */}
              <div style={{ padding: "14px 24px", borderBottom: `1px solid ${t.divider}`,
                fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: 0.7,
                textTransform: "uppercase", flexShrink: 0 }}>
                {filtered.length} {catFilter === "All" ? "creators" : CAT_LABELS[catFilter].toLowerCase() + "s"} on Nomaad
              </div>

              <div style={{ overflowY: "auto", flex: 1 }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: t.muted, fontSize: 14 }}>
                    No members found
                  </div>
                ) : (
                  filtered.map((member, idx) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      idx={idx}
                      onNameClick={setProfileMember}
                      onConnect={toggleConnect}
                      connected={connected.has(member.id)}
                      t={t} dark={dark}
                    />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes ncPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
