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

const SOCIAL_DISPLAY = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin',  label: 'LinkedIn' },
  { key: 'tiktok',    label: 'TikTok' },
  { key: 'x',         label: 'X' },
  { key: 'youtube',   label: 'YouTube' },
  { key: 'vimeo',     label: 'Vimeo' },
  { key: 'website',   label: 'Website' },
];

function normalizeSocialUrl(value, platform) {
  if (!value || !value.trim()) return null;
  const v = value.trim();
  if (v.startsWith('http')) return v;
  if (platform === 'linkedin') return `https://linkedin.com/in/${v.replace(/^\//, '')}`;
  if (platform === 'youtube') return `https://youtube.com/${v}`;
  if (platform === 'vimeo') return `https://vimeo.com/${v}`;
  if (['instagram', 'tiktok', 'x'].includes(platform)) return `https://${platform}.com/${v.replace(/^@/, '')}`;
  return `https://${v}`;
}

function SocialIcon({ platform }) {
  const p = { width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (platform === 'instagram') return <svg {...p} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
  if (platform === 'linkedin') return <svg {...p} viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
  if (platform === 'tiktok') return <svg {...p} viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>;
  if (platform === 'x') return <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (platform === 'youtube') return <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
  if (platform === 'vimeo') return <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M22.396 7.164c-.093 2.026-1.507 4.799-4.245 8.318C15.16 19.24 13.18 21 11.18 21c-1.214 0-2.25-1.12-3.108-3.36-.622-2.08-1.274-4.16-1.959-6.24-.749-2.22-1.553-3.36-2.414-3.36-.156 0-.7.327-1.634.98L1 7.732c1.022-.903 2.028-1.805 3.018-2.707 1.371-1.17 2.404-1.79 3.098-1.858 1.61-.156 2.596.944 2.957 3.3.385 2.52.665 4.08.84 4.68.515 2.08.998 3.12 1.448 3.12.406 0 1.012-.64 1.813-1.91.801-1.27 1.224-2.24 1.268-2.907.094-1.22-.354-1.837-1.346-1.837-.485 0-.99.11-1.513.33.998-3.28 2.902-4.896 5.716-4.843 2.068.048 3.045 1.37 2.928 3.96z"/></svg>;
  if (platform === 'website') return <svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
  return null;
}

function SocialLink({ href, label, platform }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" title={label} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 44, height: 44, borderRadius: '50%',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      color: 'rgba(240,240,245,0.5)', fontSize: 18,
      textDecoration: 'none', transition: 'all 0.2s', fontFamily: FF,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,253,1,0.3)'; e.currentTarget.style.color = VOLT; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(240,240,245,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <SocialIcon platform={platform} />
    </a>
  );
}

function Avatar({ name, url, size = 112 }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <img src={url} alt={name} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: "block", margin: "0 auto", border: "4px solid #111115", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
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

function ProjectCard({ project }) {
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
        <div style={{
          width: '100%', aspectRatio: '16/10', overflow: 'hidden',
          background: 'rgba(255,255,255,0.03)', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {project.cover_url ? (
            <img src={project.cover_url} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: "block" }} />
          ) : (
            <span style={{ fontSize: 32, opacity: 0.3 }}>{project.media_type === "Video" ? "🎥" : "🎨"}</span>
          )}
          {project.media_type && project.media_type !== "Image" && (
             <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 8px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: 8, fontSize: 10, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
               ▶ {project.media_type}
             </div>
          )}
        </div>
        <div style={{ padding: '16px 20px', flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            {project.category && (
              <div style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 100, background: 'rgba(204,253,1,0.08)', border: '1px solid rgba(204,253,1,0.18)', color: VOLT, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>{project.category}</div>
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: SHELL, fontFamily: FF, textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#0a0a0a', margin: '0 auto 24px', boxShadow: "0 8px 32px rgba(204,253,1,0.2)" }}>N</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f5', marginBottom: 8, letterSpacing: -0.5 }}>Not Found</div>
        <div style={{ fontSize: 15, color: 'rgba(240,240,245,0.4)', marginBottom: 32, maxWidth: 300, margin: "0 auto 32px" }}>The profile for "{username}" doesn't exist or hasn't been set up yet.</div>
        <a href={APP_URL} style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 100, background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`, color: '#0a0a0a', fontWeight: 700, fontSize: 15, textDecoration: 'none', fontFamily: FF, boxShadow: "0 4px 24px rgba(204,253,1,0.2)" }}>Claim your Nomaad page →</a>
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
      .then(({ data }) => {
        if (data) setProfile(data);
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: SHELL }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#0a0a0a', animation: 'pulse 1.5s ease-in-out infinite' }}>N</div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1; transform:scale(1)} 50%{opacity:0.6; transform:scale(0.95)} }`}</style>
      </div>
    );
  }

  if (!profile) return <NotFound username={username} />;

  const name      = profile.full_name || username;
  const bio       = profile.bio || '';
  const location  = profile.location || '';
  const links     = profile.social_links || {};
  const projects  = (profile.portfolio_projects || []).filter(p => p.title);

  return (
    <div style={{ background: SHELL, minHeight: '100vh', color: '#f0f0f5', fontFamily: FF, WebkitFontSmoothing: 'antialiased', position: "relative" }}>
      <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: "80%", maxWidth: 800, height: 400, background: `radial-gradient(ellipse at top, ${VOLT}1A 0%, transparent 60%)`, pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", display: 'flex', alignItems: 'center', gap: 8, background: "rgba(8,8,10,0.6)", backdropFilter: "blur(12px)", padding: "10px 16px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#0a0a0a' }}>N</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Powered by Nomaad</span>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 10 }}>
        <div style={{ paddingTop: 100, paddingBottom: 40, maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingLeft: 24, paddingRight: 24 }}>
          <Avatar name={name} url={profile?.avatar_url} size={100} />

          <div style={{ marginTop: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px', lineHeight: 1.1 }}>{name}</h1>

            {profile.business_name && (
              <div style={{ fontSize: 16, fontWeight: 500, color: 'rgba(240,240,245,0.6)', marginBottom: 12 }}>{profile.business_name}</div>
            )}

            {location && (
              <div style={{ fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: 20, color: 'rgba(240,240,245,0.6)', display: 'inline-block', marginBottom: 20 }}>📍 {location}</div>
            )}

            {bio && (
              <p style={{ fontSize: 16, color: 'rgba(240,240,245,0.7)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 32px' }}>{bio}</p>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
              {SOCIAL_DISPLAY.map(({ key, label }) => {
                const url = links[key];
                if (!url) return null;
                const href = normalizeSocialUrl(url, key);
                if (!href) return null;
                return <SocialLink key={key} href={href} label={label} platform={key} />;
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400, margin: '0 auto' }}>
              {links.bookingUrl && (
                 <a href={links.bookingUrl.startsWith('http') ? links.bookingUrl : `https://${links.bookingUrl}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`, color: "#0a0a0a", padding: "16px 24px", borderRadius: 16, textDecoration: "none", fontWeight: 800, fontSize: 16, letterSpacing: "-0.01em", boxShadow: "0 4px 20px rgba(204,253,1,0.25)", transition: "transform 0.2s" }}
                   onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                   onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                 >
                   <Calendar size={20} strokeWidth={2.5} /> Book a Call
                 </a>
              )}
              {links.email && (
                 <a href={`mailto:${links.email}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px", borderRadius: 16, textDecoration: "none", fontWeight: 700, fontSize: 16, transition: "transform 0.2s, background 0.2s" }}
                   onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                   onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                 >
                   <Mail size={20} /> Message Me
                 </a>
              )}
            </div>
          </div>
        </div>

        {projects.length > 0 && (
          <div style={{ padding: '0 24px 100px', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: "#fff" }}>Portfolio</h2>
              <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(204,253,1,0.15)', border: `1px solid ${VOLT}44`, fontSize: 12, color: VOLT, fontWeight: 700 }}>{projects.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {projects.map((p, i) => <ProjectCard key={p.id || i} project={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}