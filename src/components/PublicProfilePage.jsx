/**
 * PublicProfilePage.jsx
 * Rendered at username.nomaad.ai
 * Fetches and displays a creator's public profile + portfolio.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { APP_URL } from '../lib/hostname';

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

function Avatar({ name, url, size = 80 }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <img
        src={url} alt={name}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color: '#0a0a0a',
    }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function SocialLink({ href, label, icon }) {
  if (!href) return null;
  const full = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a href={full} target="_blank" rel="noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 100,
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      color: 'rgba(240,240,245,0.6)', fontSize: 13, fontWeight: 500,
      textDecoration: 'none', transition: 'all 0.2s', fontFamily: FF,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,253,1,0.3)'; e.currentTarget.style.color = VOLT; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(240,240,245,0.6)'; }}
    >
      <span>{icon}</span> {label}
    </a>
  );
}

function ProjectCard({ project }) {
  const cs = catStyle(project.category);
  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'transform 0.2s, border-color 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      {/* Cover */}
      <div style={{
        width: '100%', aspectRatio: '16/9', overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {project.cover_url ? (
          <img src={project.cover_url} alt={project.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <span style={{ fontSize: 32, opacity: 0.3 }}>🎨</span>
        )}
      </div>

      <div style={{ padding: '14px 16px' }}>
        {project.category && (
          <div style={{
            display: 'inline-block', padding: '2px 9px', borderRadius: 100,
            background: cs.bg, border: `1px solid ${cs.border}`,
            color: cs.text, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.04em', marginBottom: 8,
          }}>{project.category}</div>
        )}
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f5', marginBottom: 4 }}>{project.title}</div>
        {project.year && <div style={{ fontSize: 11, color: 'rgba(240,240,245,0.35)' }}>{project.year}</div>}
        {project.description && (
          <div style={{ fontSize: 12, color: 'rgba(240,240,245,0.45)', marginTop: 8, lineHeight: 1.55 }}>
            {project.description.slice(0, 100)}{project.description.length > 100 ? '…' : ''}
          </div>
        )}
      </div>
    </div>
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
          width: 64, height: 64, borderRadius: 18,
          background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, color: '#0a0a0a',
          margin: '0 auto 24px',
        }}>N</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f5', marginBottom: 8 }}>
          {username} isn't on Nomaad yet.
        </div>
        <div style={{ fontSize: 14, color: 'rgba(240,240,245,0.4)', marginBottom: 28 }}>
          This profile doesn't exist or hasn't been set up.
        </div>
        <a href={APP_URL} style={{
          display: 'inline-block', padding: '10px 24px', borderRadius: 100,
          background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          color: '#0a0a0a', fontWeight: 700, fontSize: 14,
          textDecoration: 'none', fontFamily: FF,
        }}>Create your Nomaad profile →</a>
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
          width: 48, height: 48, borderRadius: 14,
          background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 800, color: '#0a0a0a',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>N</div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
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
    <div style={{ background: SHELL, minHeight: '100vh', color: '#f0f0f5', fontFamily: FF, WebkitFontSmoothing: 'antialiased' }}>

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(8,8,10,0.85)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#0a0a0a',
          }}>N</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,245,0.5)' }}>nomaad.ai</span>
        </div>
        <a href={APP_URL} style={{
          padding: '6px 16px', borderRadius: 100,
          background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          color: '#0a0a0a', fontWeight: 700, fontSize: 12,
          textDecoration: 'none',
        }}>Create your profile →</a>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 80, padding: '100px 24px 60px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <Avatar name={name} url={profile.avatar_url} size={96} />

        <div style={{ marginTop: 20 }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.1 }}>
            {name}
          </h1>

          {profile.business_name && (
            <div style={{ fontSize: 15, color: 'rgba(240,240,245,0.5)', marginBottom: 8 }}>{profile.business_name}</div>
          )}

          {location && (
            <div style={{ fontSize: 13, color: 'rgba(240,240,245,0.35)', marginBottom: 16 }}>📍 {location}</div>
          )}

          {/* Availability badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 14px', borderRadius: 100,
            background: `${availInfo.color}15`, border: `1px solid ${availInfo.color}30`,
            marginBottom: 20,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: availInfo.color }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: availInfo.color }}>{availInfo.label}</span>
          </div>

          {bio && (
            <p style={{
              fontSize: 16, color: 'rgba(240,240,245,0.55)', lineHeight: 1.7,
              maxWidth: 520, margin: '0 auto 24px',
            }}>{bio}</p>
          )}

          {/* Social links */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {links.instagram && <SocialLink href={`https://instagram.com/${links.instagram.replace(/^@/, '')}`} label="Instagram" icon="📸" />}
            {links.linkedin  && <SocialLink href={links.linkedin}  label="LinkedIn"  icon="💼" />}
            {links.website   && <SocialLink href={links.website}   label="Website"   icon="🌐" />}
            {links.twitter   && <SocialLink href={`https://twitter.com/${links.twitter.replace(/^@/, '')}`} label="Twitter" icon="𝕏" />}
            {links.tiktok    && <SocialLink href={`https://tiktok.com/@${links.tiktok.replace(/^@/, '')}`} label="TikTok"  icon="🎵" />}
          </div>
        </div>
      </div>

      {/* Portfolio */}
      {projects.length > 0 && (
        <div style={{ padding: '0 24px 80px', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
            paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Portfolio</h2>
            <span style={{
              padding: '2px 10px', borderRadius: 100,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 12, color: 'rgba(240,240,245,0.4)', fontWeight: 600,
            }}>{projects.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.map((p, i) => <ProjectCard key={p.id || i} project={p} />)}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{
        padding: '60px 24px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ fontSize: 13, color: 'rgba(240,240,245,0.35)', marginBottom: 16 }}>
          {name} runs their business on
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#0a0a0a',
          }}>N</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f5' }}>Nomaad</span>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(240,240,245,0.4)', marginBottom: 20 }}>
          Run your freelance business in one place — clients, invoicing, projects, and your own profile page.
        </p>
        <a href={APP_URL} style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: 100,
          background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          color: '#0a0a0a', fontWeight: 700, fontSize: 15,
          textDecoration: 'none', boxShadow: '0 4px 24px rgba(204,253,1,0.2)',
        }}>Get your own nomaad.ai page →</a>
      </div>
    </div>
  );
}
