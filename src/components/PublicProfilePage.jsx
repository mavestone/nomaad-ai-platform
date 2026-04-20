/**
 * PublicProfilePage.jsx
 * Rendered at username.nomaad.ai
 * Fetches and displays a creator's public profile + portfolio.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { APP_URL } from '../lib/hostname';
import { Mail, Calendar, ExternalLink } from 'lucide-react';

const VOLT  = '#ccfd01';
const VOLTD = '#b8e300';
const SHELL = '#08080a';
const FF    = "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',system-ui,sans-serif";

const CAT_COLORS = {
  photo:   { bg: 'rgba(90,200,250,0.1)',  border: 'rgba(90,200,250,0.2)',  text: '#5AC8FA' },
  video:   { bg: 'rgba(255,98,89,0.1)',   border: 'rgba(255,98,89,0.2)',   text: '#FF6259' },
  design:  { bg: 'rgba(191,90,242,0.1)',  border: 'rgba(191,90,242,0.2)',  text: '#BF5AF2' },
  edit:    { bg: 'rgba(255,179,64,0.1)',  border: 'rgba(255,179,64,0.2)',  text: '#FFB340' },
  create:  { bg: 'rgba(204,253,1,0.08)', border: 'rgba(204,253,1,0.18)', text: VOLT },
  produce: { bg: 'rgba(48,209,88,0.1)',   border: 'rgba(48,209,88,0.2)',   text: '#30D158' },
};

function catStyle(cat) {
  return CAT_COLORS[cat?.toLowerCase()] || CAT_COLORS.create;
}

function Avatar({ name, url, size = 112 }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <img
        src={url} alt={name}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: "0 auto", border: "4px solid #111115", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color: '#0a0a0a',
      margin: "0 auto", border: "4px solid #111115", boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function SocialLink({ href, label, icon }) {
  if (!href) return null;
  const full = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a href={full} target="_blank" rel="noreferrer" title={label} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      width: 44, height: 44, borderRadius: '50%',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      color: 'rgba(240,240,245,0.6)', fontSize: 18,
      textDecoration: 'none', transition: 'all 0.2s', fontFamily: FF,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,253,1,0.3)'; e.currentTarget.style.color = VOLT; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(240,240,245,0.6)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <span>{icon}</span>
    </a>
  );
}

function ProjectCard({ project }) {
  const cs = catStyle(project.category);
  const href = project.media_url && project.media_url.trim() !== "" ? project.media_url : null;
  const validHref = href ? (href.startsWith("http") ? href : `https://${href}`) : null;

  const CardWrapper = ({ children }) => validHref ? (
    <a href={validHref} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}>{children}</a>
  ) : <>{children}</>;

  return (
    <CardWrapper>
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'transform 0.3s cubic-bezier(.4,0,.2,1), border-color 0.3s',
        height: '100%', display: "flex", flexDirection: "column"
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
      >
        {/* Cover */}
        <div style={{
          width: '100%', aspectRatio: '16/10', overflow: 'hidden',
          background: 'rgba(255,255,255,0.03)', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {project.cover_url ? (
            <img src={project.cover_url} alt={project.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <span style={{ fontSize: 32, opacity: 0.3 }}>{project.media_type === "Video" ? "🎥" : "🎨"}</span>
          )}
          {project.media_type && project.media_type !== "Image" && (
             <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 8px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: 8, fontSize: 10, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
               {project.media_type === "YouTube" ? "▶" : "▶"} {project.media_type}
             </div>
          )}
        </div>

        <div style={{ padding: '16px 20px', flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            {project.category && (
              <div style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: 100,
                background: cs.bg, border: `1px solid ${cs.border}`,
                color: cs.text, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.04em',
              }}>{project.category}</div>
            )}
            {validHref && <ExternalLink size={14} color="rgba(255,255,255,0.3)" />}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', marginBottom: 6 }}>{project.title}</div>
          {project.year && <div style={{ fontSize: 12, color: 'rgba(240,240,245,0.4)', marginTop: "auto" }}>{project.year}</div>}
        </div>
      </div>
    </CardWrapper>
  );
}

function NotFound({ username }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: SHELL, fontFamily: FF, textAlign: 'center',
      padding: 24,
    }}>
      <div>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 900, color: '#0a0a0a',
          margin: '0 auto 24px', boxShadow: "0 8px 32px rgba(204,253,1,0.2)"
        }}>N</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f5', marginBottom: 8, letterSpacing: -0.5 }}>
          Not Found
        </div>
        <div style={{ fontSize: 15, color: 'rgba(240,240,245,0.4)', marginBottom: 32, maxWidth: 300, margin: "0 auto 32px" }}>
          The profile for "{username}" doesn't exist or hasn't been set up yet.
        </div>
        <a href={APP_URL} style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: 100,
          background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          color: '#0a0a0a', fontWeight: 700, fontSize: 15,
          textDecoration: 'none', fontFamily: FF, boxShadow: "0 4px 24px rgba(204,253,1,0.2)"
        }}>Claim your Nomaad page →</a>
      </div>
    </div>
  );
}

export default function PublicProfilePage({ username }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) { setLoading(false); return; }
    supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single()
      .then(({ data, error }) => {
        if (data && !error) setProfile(data);
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: SHELL,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, color: '#0a0a0a',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>N</div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1; transform:scale(1)} 50%{opacity:0.6; transform:scale(0.95)} }`}</style>
      </div>
    );
  }

  if (!profile) return <NotFound username={username} />;

  const name     = profile.full_name || username;
  const bio      = profile.bio || '';
  const location = profile.location || '';
  const links    = profile.social_links || {};
  const projects = (profile.portfolio_projects || []).filter(p => p.title);
  const avail    = profile.availability;

  const availConfig = {
    available: { label: 'Available for work', color: '#30D158' },
    soon:      { label: 'Available soon',     color: '#FFB340' },
    away:      { label: 'Not taking on work', color: '#8b8fa3' },
  };
  const availInfo = availConfig[avail] || availConfig.away;

  return (
    <div style={{ background: SHELL, minHeight: '100vh', color: '#f0f0f5', fontFamily: FF, WebkitFontSmoothing: 'antialiased', position: "relative" }}>

      {/* Decorative Blur Backgrounds */}
      <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: "80%", maxWidth: 800, height: 400, background: `radial-gradient(ellipse at top, ${VOLT}1A 0%, transparent 60%)`, pointerEvents: "none", zIndex: 0 }} />

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', pointerEvents: "none"
      }}>
        <div style={{ pointerEvents: "auto", display: 'flex', alignItems: 'center', gap: 8, background: "rgba(8,8,10,0.6)", backdropFilter: "blur(12px)", padding: "10px 16px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6,
            background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#0a0a0a',
          }}>N</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Powered by Nomaad</span>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 10 }}>
        {/* Linktree style Hero */}
        <div style={{ paddingTop: 100, paddingBottom: 40, maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingLeft: 24, paddingRight: 24 }}>
          <Avatar name={name} url={profile.avatar_url} size={100} />

          <div style={{ marginTop: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px', lineHeight: 1.1 }}>
              {name}
            </h1>

            {profile.business_name && (
              <div style={{ fontSize: 16, fontWeight: 500, color: 'rgba(240,240,245,0.6)', marginBottom: 12 }}>{profile.business_name}</div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
               {location && (
                 <div style={{ fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: 20, color: 'rgba(240,240,245,0.6)' }}>📍 {location}</div>
               )}
               <div style={{
                 display: 'inline-flex', alignItems: 'center', gap: 6,
                 padding: '4px 12px', borderRadius: 20,
                 background: `${availInfo.color}15`, border: `1px solid ${availInfo.color}30`,
               }}>
                 <div style={{ width: 6, height: 6, borderRadius: '50%', background: availInfo.color }} />
                 <span style={{ fontSize: 12, fontWeight: 600, color: availInfo.color }}>{availInfo.label}</span>
               </div>
            </div>

            {bio && (
              <p style={{
                fontSize: 16, color: 'rgba(240,240,245,0.7)', lineHeight: 1.6,
                maxWidth: 480, margin: '0 auto 32px',
              }}>{bio}</p>
            )}

            {/* Social links */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
              {links.instagram && <SocialLink href={`https://instagram.com/${links.instagram.replace(/^@/, '')}`} label="Instagram" icon="📸" />}
              {links.linkedin  && <SocialLink href={links.linkedin}  label="LinkedIn"  icon="💼" />}
              {links.website   && <SocialLink href={links.website}   label="Website"   icon="🌐" />}
              {links.twitter   && <SocialLink href={`https://twitter.com/${links.twitter.replace(/^@/, '')}`} label="Twitter" icon="𝕏" />}
              {links.tiktok    && <SocialLink href={`https://tiktok.com/@${links.tiktok.replace(/^@/, '')}`} label="TikTok"  icon="🎵" />}
              {links.youtube   && <SocialLink href={links.youtube}   label="YouTube"   icon="▶️" />}
            </div>

            {/* Core CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400, margin: '0 auto' }}>
              {links.bookingUrl && (
                 <a href={links.bookingUrl.startsWith('http') ? links.bookingUrl : `https://${links.bookingUrl}`} target="_blank" rel="noreferrer" style={{
                   display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                   background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`, color: "#0a0a0a",
                   padding: "16px 24px", borderRadius: 16, textDecoration: "none",
                   fontWeight: 800, fontSize: 16, letterSpacing: "-0.01em",
                   boxShadow: "0 4px 20px rgba(204,253,1,0.25)", transition: "transform 0.2s"
                 }}
                   onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                   onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                 >
                   <Calendar size={20} strokeWidth={2.5} /> Book a Call
                 </a>
              )}
              {links.email && (
                 <a href={`mailto:${links.email}`} style={{
                   display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                   background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)",
                   padding: "16px 24px", borderRadius: 16, textDecoration: "none",
                   fontWeight: 700, fontSize: 16,
                   transition: "transform 0.2s, background 0.2s"
                 }}
                   onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                   onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                 >
                   <Mail size={20} /> Message Me
                 </a>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio */}
        {projects.length > 0 && (
          <div style={{ padding: '0 24px 100px', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32,
              paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: "#fff" }}>Portfolio</h2>
              <span style={{
                padding: '4px 12px', borderRadius: 100,
                background: 'rgba(204,253,1,0.15)', border: `1px solid ${VOLT}44`,
                fontSize: 12, color: VOLT, fontWeight: 700,
              }}>{projects.length}</span>
            </div>
            {/* Grid adapted nicely for various devices */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {projects.map((p, i) => <ProjectCard key={p.id || i} project={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
