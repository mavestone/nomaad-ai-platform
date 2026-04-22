/**
 * LandingPage.jsx — Nomaad
 * High-conversion, outcome-driven. No features. Just workflows and results.
 * Editorial redesign: less boxes, more typography, more whitespace.
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

const VOLT  = '#ccfd01';
const VOLTD = '#b8e300';
const SHELL = '#08080a';
const FF    = "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',system-ui,sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeUp({ children, delay = 0, style }) {
  const [ref, visible] = useInView();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Waitlist Form ────────────────────────────────────────────────────────────

function WaitlistForm({ source = 'landing', label = 'Get early access →', compact = false }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    try {
      const { error } = await supabase.from('waitlist_signups').insert({ email: email.trim(), source });
      if (error && error.code !== '23505') throw error;
      setState('success');
    } catch (err) {
      setErrMsg(err.message || 'Something went wrong.');
      setState('error');
      setTimeout(() => setState('idle'), 3500);
    }
  };

  if (state === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: compact ? '10px 20px' : '14px 24px',
          background: 'rgba(204,253,1,0.08)', border: `1px solid rgba(204,253,1,0.25)`,
          borderRadius: 100, color: VOLT, fontFamily: FF,
          fontSize: compact ? 13 : 14, fontWeight: 600,
        }}
      >
        <span style={{ fontSize: 16 }}>✓</span> You're on the list. We'll be in touch.
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
      <input
        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com" required
        style={{
          padding: compact ? '10px 16px' : '13px 18px',
          background: 'rgba(255,255,255,0.06)',
          border: state === 'error' ? '1px solid rgba(255,98,89,0.5)' : '1px solid rgba(255,255,255,0.12)',
          borderRadius: 100, color: '#f0f0f5', fontSize: compact ? 13 : 14,
          fontFamily: FF, outline: 'none', width: compact ? 220 : 260, transition: 'border-color 0.2s',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(204,253,1,0.4)'; }}
        onBlur={(e) => { e.target.style.borderColor = state === 'error' ? 'rgba(255,98,89,0.5)' : 'rgba(255,255,255,0.12)'; }}
      />
      <motion.button
        type="submit" disabled={state === 'loading' || !email}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        style={{
          padding: compact ? '10px 20px' : '13px 24px',
          background: state === 'loading' || !email
            ? 'rgba(255,255,255,0.08)'
            : `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          color: state === 'loading' || !email ? 'rgba(255,255,255,0.3)' : '#0a0a0a',
          border: 'none', borderRadius: 100, fontWeight: 700,
          fontSize: compact ? 13 : 14, fontFamily: FF,
          cursor: state === 'loading' || !email ? 'not-allowed' : 'pointer',
          boxShadow: state === 'loading' || !email ? 'none' : `0 4px 24px rgba(204,253,1,0.25)`,
          transition: 'all 0.2s ease', whiteSpace: 'nowrap',
        }}
      >
        {state === 'loading' ? 'Joining…' : label}
      </motion.button>
      {state === 'error' && (
        <p style={{ width: '100%', textAlign: 'center', fontSize: 12, color: '#FF6259', margin: '4px 0 0' }}>
          {errMsg}
        </p>
      )}
    </form>
  );
}

// ─── Waitlist Count ───────────────────────────────────────────────────────────

function WaitlistCount() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    supabase
      .from('waitlist_signups')
      .select('*', { count: 'exact', head: true })
      .then(({ count: c }) => setCount(c));
  }, []);
  const display = count ? Math.max(count + 40, 80) : 80;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 14, marginTop: 20, flexWrap: 'wrap', fontFamily: FF,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {['#FF6259', '#5AC8FA', '#FFB340', VOLT, '#BF5AF2'].map((c, i) => (
          <div key={i} style={{
            width: 26, height: 26, borderRadius: '50%',
            background: `${c}28`, border: `2px solid #08080a`,
            marginLeft: i === 0 ? 0 : -8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: c,
          }}>{['J','P','M','S','A'][i]}</div>
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'rgba(240,240,245,0.4)' }}>
        <span style={{ color: 'rgba(240,240,245,0.75)', fontWeight: 600 }}>{display}+ solo creators</span> already waiting
      </span>
      <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>·</span>
      <span style={{ fontSize: 12, color: 'rgba(240,240,245,0.3)' }}>No card required</span>
    </motion.div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ onSignIn }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', top: 16, left: 0, right: 0,
        zIndex: 999,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        pointerEvents: 'none', fontFamily: FF,
        padding: '0 16px'
      }}
    >
      <style>{`
        .landing-nav {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 10px 20px 10px 16px;
          border-radius: 100px;
          min-width: 460px;
          width: auto;
          pointer-events: auto;
          transition: all 0.3s ease;
        }
        .landing-nav-center {
          display: flex;
          gap: 24px;
          align-items: center;
          padding: 0 32px;
        }
        @media (max-width: 600px) {
          .landing-nav {
            min-width: 0;
            width: 100%;
            grid-template-columns: auto auto;
            justify-content: space-between;
            padding: 10px 12px 10px 16px;
          }
          .landing-nav-center { display: none; }
          .landing-brand-text { display: none; }
        }
      `}</style>
      <div 
        className="landing-nav"
        style={{
          background: scrolled ? 'rgba(8,8,10,0.9)' : 'rgba(8,8,10,0.65)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          border: `1px solid ${scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)'}`,
          boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0a0a0a', fontWeight: 800, fontSize: 13, flexShrink: 0,
          }}>N</div>
          <span className="landing-brand-text" style={{ fontWeight: 700, fontSize: 15, color: '#f0f0f5', letterSpacing: -0.3 }}>Nomaad</span>
        </div>

        <div className="landing-nav-center">
          {[['How it works', 'how-it-works'], ['Pricing', 'pricing']].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: 'none', border: 'none', color: 'rgba(240,240,245,0.55)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FF,
              padding: 0, transition: 'color 0.2s',
            }}
              onMouseEnter={(e) => e.target.style.color = '#f0f0f5'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(240,240,245,0.55)'}
            >{label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          <button onClick={onSignIn} style={{
            background: 'none', border: 'none', color: 'rgba(240,240,245,0.6)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FF, padding: '6px 12px',
          }}>Sign in</button>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => scrollTo('waitlist')}
            style={{
              padding: '7px 16px', background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
              color: '#0a0a0a', border: 'none', borderRadius: 100,
              fontWeight: 700, fontSize: 13, fontFamily: FF, cursor: 'pointer',
              boxShadow: `0 3px 16px rgba(204,253,1,0.25)`, whiteSpace: "nowrap"
            }}
          >Join the waitlist</motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ onSignIn }) {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center',
      padding: 'clamp(100px, 15vh, 140px) 20px 80px', position: 'relative',
      fontFamily: FF,
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '60%', width: 700, height: 700, borderRadius: '50%', background: VOLT, filter: 'blur(160px)', opacity: 0.05 }} />
        <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: '#5AC8FA', filter: 'blur(140px)', opacity: 0.035 }} />
      </div>

      <div
        className="nomaad-hero-grid"
        style={{
          position: 'relative',
          width: '100%', maxWidth: 1200, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
          alignItems: 'center',
          gap: 'clamp(32px, 6vw, 80px)',
        }}
      >
        {/* ─── Left column: copy ─── */}
        <div style={{ minWidth: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px 6px 10px',
              background: 'rgba(204,253,1,0.07)', border: '1px solid rgba(204,253,1,0.2)',
              borderRadius: 100, marginBottom: 32,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: VOLT, boxShadow: `0 0 8px ${VOLT}`, animation: 'pulse 2s ease infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: VOLT, letterSpacing: '0.04em' }}>WAITLIST OPEN</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 'clamp(34px, 6.2vw, 68px)', fontWeight: 800,
              lineHeight: 1.05, letterSpacing: '-0.035em',
              color: '#f0f0f5', margin: '0 0 20px',
            }}
          >
            Your entire creative workflow.
            {' '}
            <span style={{ color: VOLT }}>Finally in one place.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 'clamp(16px, 1.6vw, 19px)',
              color: 'rgba(240,240,245,0.55)', lineHeight: 1.6,
              maxWidth: 540, margin: '0 0 16px',
            }}
          >
            Find clients, manage projects, deliver work, and hire collaborators — without juggling 5 different tools.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.20, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 14,
              color: 'rgba(240,240,245,0.35)', lineHeight: 1.55,
              maxWidth: 520, margin: '0 0 36px',
            }}
          >
            Built for solo creatives who are done with messy workflows and scattered systems.
          </motion.p>

          <motion.div
            id="waitlist"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <WaitlistForm source="hero" label="Join the waitlist →" />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              marginTop: 14, flexWrap: 'wrap',
            }}>
              <WaitlistCount />
              <a href="#how-it-works" style={{
                fontSize: 13, fontWeight: 600, color: 'rgba(240,240,245,0.5)',
                textDecoration: 'none', letterSpacing: '-0.01em',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                See how it works
                <span aria-hidden="true" style={{ opacity: 0.6 }}>→</span>
              </a>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.52 }}
            style={{ fontSize: 12, color: 'rgba(240,240,245,0.3)', marginTop: 20 }}
          >
            Already have an account?{' '}
            <button onClick={onSignIn} style={{
              background: 'none', border: 'none', color: 'rgba(204,253,1,0.7)',
              fontFamily: FF, fontSize: 12, cursor: 'pointer', fontWeight: 600, padding: 0,
            }}>Sign in →</button>
          </motion.p>
        </div>

        {/* ─── Right column: product UI mock ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="nomaad-hero-mock"
          style={{ position: 'relative', minWidth: 0 }}
        >
          <HeroDashboardMock />
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 920px) {
          .nomaad-hero-grid {
            grid-template-columns: 1fr !important;
            text-align: left;
          }
          .nomaad-hero-mock {
            margin-top: 24px;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Hero Dashboard Mock ──────────────────────────────────────────────────────

function HeroDashboardMock() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      borderRadius: 18,
      background: 'linear-gradient(180deg, rgba(22,22,26,0.9) 0%, rgba(14,14,18,0.9) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.02) inset',
      overflow: 'hidden',
      fontFamily: FF,
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.015)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57','#ffbd2e','#28c840'].map(c => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.75 }} />
          ))}
        </div>
        <div style={{
          flex: 1, textAlign: 'center',
          fontSize: 10, color: 'rgba(255,255,255,0.35)',
          fontWeight: 600, letterSpacing: '0.04em',
        }}>
          app.nomaad.ai / dashboard
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', minHeight: 360 }}>
        {/* Sidebar */}
        <div style={{
          borderRight: '1px solid rgba(255,255,255,0.04)',
          padding: '14px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.012)',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: VOLT, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.04em',
            marginBottom: 6,
          }}>N</div>
          {[
            { active: true,  glyph: '◨' },
            { active: false, glyph: '◩' },
            { active: false, glyph: '◧' },
            { active: false, glyph: '◐' },
          ].map((item, i) => (
            <div key={i} style={{
              width: 30, height: 30, borderRadius: 8,
              background: item.active ? 'rgba(204,253,1,0.1)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
              color: item.active ? VOLT : 'rgba(255,255,255,0.3)',
            }}>{item.glyph}</div>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Pipeline
              </div>
              <div style={{ fontSize: 15, color: '#f0f0f5', fontWeight: 700, marginTop: 2, letterSpacing: '-0.01em' }}>
                This week
              </div>
            </div>
            <div style={{
              padding: '4px 9px', borderRadius: 6,
              fontSize: 10, fontWeight: 700, color: VOLT,
              background: 'rgba(204,253,1,0.08)',
              border: '1px solid rgba(204,253,1,0.18)',
              letterSpacing: '0.02em',
            }}>+£4,200</div>
          </div>

          {/* Kanban */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {[
              { stage: 'LEAD',     count: 4, color: '#5AC8FA', items: [{ name: 'Ana · Brand film', value: '£1.2k' }, { name: 'Moss Studio',   value: '£800' }] },
              { stage: 'PROPOSAL', count: 2, color: '#FFB340', items: [{ name: 'Ridgeway × 2',      value: '£2.4k' }, { name: 'Luma coffee',   value: '£600' }] },
              { stage: 'BOOKED',   count: 3, color: VOLT,      items: [{ name: 'Soren weddings',    value: '£3.5k' }, { name: 'Halo / launch', value: '£1.8k' }] },
            ].map((col) => (
              <div key={col.stage} style={{
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 10,
                padding: 8,
                display: 'flex', flexDirection: 'column', gap: 6,
                minWidth: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px 4px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, color: col.color, letterSpacing: '0.06em' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: col.color }} />
                    {col.stage}
                  </span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{col.count}</span>
                </div>
                {col.items.map((it, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 7, padding: '7px 8px',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <div style={{ fontSize: 10, color: 'rgba(240,240,245,0.85)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{it.value}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Active project row */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: 12,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 5,
                  background: 'linear-gradient(135deg, #5AC8FA, #0f7ad6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: '#fff',
                }}>SW</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.01em' }}>Soren weddings — highlight reel</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Due Fri · Client portal live</div>
                </div>
              </div>
              <span style={{
                padding: '3px 7px', borderRadius: 5,
                fontSize: 9, fontWeight: 700, color: VOLT,
                background: 'rgba(204,253,1,0.08)', letterSpacing: '0.04em',
              }}>IN REVIEW</span>
            </div>
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ width: '72%', height: '100%', background: `linear-gradient(90deg, ${VOLT}, ${VOLTD})`, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>72%</span>
            </div>
            {/* Quick avatars */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex' }}>
                {['#FFB340', '#BF5AF2', '#5AC8FA'].map((c, i) => (
                  <span key={i} style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: c, border: '2px solid #101014',
                    marginLeft: i === 0 ? 0 : -6,
                    fontSize: 9, fontWeight: 700, color: '#0a0a0a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{['A','M','L'][i]}</span>
                ))}
              </div>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                3 collaborators · 2 new comments
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────
// Redesigned: clean editorial list with red hairline separators instead of cards

const PAINS = [
  { title: 'Leads in one place, messages in another',           sub: 'DMs, inbox, spreadsheet — pick whichever one you forgot to check.' },
  { title: 'Projects scattered across half a dozen tools',      sub: 'Notes here, files there, tasks in a third app. Nothing stays in sync.' },
  { title: 'Clients constantly asking "any updates?"',          sub: 'Because there\u2019s nowhere for them to see the answer themselves.' },
  { title: 'Feedback buried in emails and DMs',                 sub: 'Every round of revisions turns into a treasure hunt through threads.' },
  { title: 'Hiring people is slow and messy',                   sub: 'Chasing editors on Instagram. Contracts over email. Briefs in a doc they never find.' },
];

function ProblemSection() {
  return (
    <section style={{ padding: 'clamp(100px, 14vw, 160px) 20px', maxWidth: 800, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.15,
        }}>
          Sound familiar?
        </h2>
      </FadeUp>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {PAINS.map((p, i) => (
          <FadeUp key={i} delay={i * 0.05}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 600,
                color: 'rgba(240,240,245,0.9)', marginBottom: 8, lineHeight: 1.4,
                letterSpacing: '-0.015em',
              }}>
                {p.title}
              </div>
              <div style={{
                fontSize: 15, color: 'rgba(240,240,245,0.4)', lineHeight: 1.6,
              }}>
                {p.sub}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp style={{ textAlign: 'center', marginTop: 72 }}>
        <p style={{
          fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700,
          color: '#f0f0f5', lineHeight: 1.25, letterSpacing: '-0.025em',
          margin: 0,
        }}>
          It&apos;s not you.{' '}
          <span style={{ color: VOLT }}>Your system is broken.</span>
        </p>
      </FadeUp>
    </section>
  );
}

// ─── Product Flow Section ─────────────────────────────────────────────────────
// 3-step horizontal flow: FIND → MANAGE → DELIVER

const FLOW_STEPS = [
  {
    n: '01', title: 'Find',
    body: 'Discover and capture leads instantly.',
    color: VOLT,
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    n: '02', title: 'Manage',
    body: 'Track deals, projects, and communication in one system.',
    color: '#5AC8FA',
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="7" height="16" rx="1.5" />
        <rect x="14" y="4" width="7" height="9" rx="1.5" />
        <path d="M14 17h7" />
      </svg>
    ),
  },
  {
    n: '03', title: 'Deliver',
    body: 'Share progress, collect feedback, and complete projects cleanly.',
    color: '#BF5AF2',
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
      </svg>
    ),
  },
];

function ProductFlowSection() {
  return (
    <section id="how-it-works" style={{ padding: 'clamp(100px, 14vw, 160px) 20px', maxWidth: 1200, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 80 }}>
        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700,
          color: '#f0f0f5', letterSpacing: '-0.035em', margin: 0, lineHeight: 1.1,
        }}>
          How it works
        </h2>
        <p style={{
          fontSize: 18, color: 'rgba(240,240,245,0.45)', marginTop: 16, lineHeight: 1.6,
          maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
        }}>
          Three steps. One system. No more juggling.
        </p>
      </FadeUp>

      <div
        className="nomaad-flow-grid"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 0,
        }}
      >
        {FLOW_STEPS.map((s, i) => (
          <FadeUp key={s.n} delay={i * 0.1} style={{ flex: '1 1 0', maxWidth: 360, position: 'relative' }}>
            <div style={{
              padding: '0 clamp(20px, 4vw, 48px)',
              textAlign: 'center',
            }}>
              {/* Step number */}
              <div style={{
                fontSize: 13, fontWeight: 700, color: s.color,
                letterSpacing: '0.08em', marginBottom: 20,
              }}>
                {s.n}
              </div>

              {/* Icon */}
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `${s.color}10`,
                color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                {s.icon}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700,
                color: '#f0f0f5', margin: '0 0 12px',
                letterSpacing: '-0.025em', lineHeight: 1.15,
              }}>
                {s.title}
              </h3>

              {/* Body */}
              <p style={{
                fontSize: 15, color: 'rgba(240,240,245,0.5)',
                lineHeight: 1.65, margin: 0,
              }}>
                {s.body}
              </p>
            </div>

            {/* Connecting line (not on last item) */}
            {i < FLOW_STEPS.length - 1 && (
              <div aria-hidden="true" className="nomaad-flow-line" style={{
                position: 'absolute',
                top: 70,
                right: 0,
                width: '50%',
                height: 1,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 100%)',
              }} />
            )}
          </FadeUp>
        ))}
      </div>

      <style>{`
        @media (max-width: 720px) {
          .nomaad-flow-grid {
            flex-direction: column !important;
            gap: 56px !important;
          }
          .nomaad-flow-line {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Core Value Feature Mocks ─────────────────────────────────────────────────

const UI_BASE = {
  borderRadius: 16,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.07)',
  background: '#0f0f13',
  fontFamily: FF,
};

/* ── 1. FIND: AI lead discovery ── */
function FindMock() {
  const leads = [
    { name: 'Zara Fitness', handle: '@zarafitness', match: 94, badge: 'Hot', badgeColor: '#FF6259' },
    { name: 'Blossom & Co', handle: '@blossomco', match: 88, badge: 'New', badgeColor: VOLT },
    { name: 'Peaks Media', handle: '@peaksmedia', match: 81, badge: null, badgeColor: null },
    { name: 'Drift Studio', handle: '@driftstudio', match: 76, badge: null, badgeColor: null },
  ];
  return (
    <div style={{ ...UI_BASE, padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.01em' }}>AI Prospecting</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>4 new matches today</div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
          background: 'rgba(204,253,1,0.1)', color: VOLT, border: `1px solid rgba(204,253,1,0.2)`,
        }}>
          AI
        </div>
      </div>
      {/* Lead rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {leads.map((l) => (
          <div key={l.name} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: `rgba(255,255,255,0.06)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0,
            }}>
              {l.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f5', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 6 }}>
                {l.name}
                {l.badge && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: l.badgeColor, background: `${l.badgeColor}14`, padding: '2px 6px', borderRadius: 100 }}>
                    {l.badge}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{l.handle}</div>
            </div>
            {/* Match bar */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: l.match > 85 ? VOLT : 'rgba(255,255,255,0.55)' }}>{l.match}%</div>
              <div style={{ marginTop: 3, width: 40, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: `${l.match}%`, height: '100%', borderRadius: 99, background: l.match > 85 ? VOLT : 'rgba(255,255,255,0.25)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 2. TRACK: Pipeline kanban ── */
function TrackMock() {
  const cols = [
    { label: 'Leads', count: 3, color: 'rgba(255,255,255,0.3)', cards: ['Urban Café', 'Nova Yoga'] },
    { label: 'Proposal', count: 2, color: '#5AC8FA', cards: ['Drift Studio'] },
    { label: 'Active', count: 4, color: VOLT, cards: ['Blossom & Co', 'Zara Fitness'] },
    { label: 'Done', count: 1, color: '#4CAF50', cards: ['Peaks Media'] },
  ];
  return (
    <div style={{ ...UI_BASE, padding: '18px 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f5', marginBottom: 14, letterSpacing: '-0.01em' }}>Pipeline</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {cols.map((col) => (
          <div key={col.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{col.label}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>{col.count}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {col.cards.map((c) => (
                <div key={c} style={{
                  padding: '8px 9px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.4,
                }}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Mini progress summary */}
      <div style={{
        marginTop: 14, padding: '10px 12px', borderRadius: 10,
        background: 'rgba(204,253,1,0.04)', border: '1px solid rgba(204,253,1,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>This month</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: VOLT }}>£4,200 pipeline</span>
      </div>
    </div>
  );
}

/* ── 3. DELIVER: Project checklist ── */
function DeliverMock() {
  const steps = [
    { label: 'Brief received', done: true },
    { label: 'First draft delivered', done: true },
    { label: 'Client review', done: true },
    { label: 'Revisions applied', done: false, active: true },
    { label: 'Final delivery', done: false },
    { label: 'Invoice sent', done: false },
  ];
  return (
    <div style={{ ...UI_BASE, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.01em' }}>Blossom &amp; Co — Brand video</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Step 4 of 6</div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
          background: 'rgba(90,200,250,0.1)', color: '#5AC8FA', border: '1px solid rgba(90,200,250,0.2)',
        }}>
          In review
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }}>
        <div style={{ width: '58%', height: '100%', borderRadius: 99, background: VOLT }} />
      </div>
      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {steps.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: s.done ? VOLT : s.active ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: s.done ? 'none' : s.active ? `1.5px solid rgba(255,255,255,0.3)` : '1.5px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {s.done && (
                <svg viewBox="0 0 24 24" width={10} height={10} fill="none" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              {s.active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f0f0f5' }} />}
            </div>
            <span style={{
              fontSize: 12, fontWeight: s.active ? 600 : 500,
              color: s.done ? 'rgba(255,255,255,0.35)' : s.active ? '#f0f0f5' : 'rgba(255,255,255,0.3)',
              textDecoration: s.done ? 'line-through' : 'none',
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 4. CLIENT PORTAL: client-facing view ── */
function FeaturePortalMock() {
  return (
    <div style={{ ...UI_BASE, border: '1px solid rgba(204,253,1,0.12)', padding: '18px 20px' }}>
      {/* Browser-like header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
        padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.15)'].map((c, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, textAlign: 'center', fontSize: 9,
          color: 'rgba(255,255,255,0.25)', letterSpacing: '0.02em',
        }}>
          portal.nomaad.ai/blossom
        </div>
      </div>
      {/* Client header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'rgba(204,253,1,0.12)', border: '1px solid rgba(204,253,1,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: VOLT,
        }}>B</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.01em' }}>Blossom &amp; Co</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Brand video · Due in 5 days</div>
        </div>
      </div>
      {/* Milestone dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14 }}>
        {['Brief', 'Draft', 'Review', 'Revisions', 'Final'].map((m, i) => (
          <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: i < 3 ? VOLT : i === 3 ? 'rgba(204,253,1,0.15)' : 'rgba(255,255,255,0.05)',
              border: i === 3 ? `1.5px solid ${VOLT}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {i < 3 && (
                <svg viewBox="0 0 24 24" width={9} height={9} fill="none" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 8, color: i < 3 ? 'rgba(255,255,255,0.5)' : i === 3 ? VOLT : 'rgba(255,255,255,0.2)' }}>{m}</span>
          </div>
        ))}
      </div>
      {/* Latest file card */}
      <div style={{
        padding: '10px 12px', borderRadius: 10,
        background: 'rgba(204,253,1,0.05)', border: '1px solid rgba(204,253,1,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f0f0f5' }}>Draft v2.mp4</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Ready to review</div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '5px 12px', borderRadius: 100,
          background: VOLT, color: '#0a0a0a', cursor: 'pointer',
        }}>
          Review
        </div>
      </div>
    </div>
  );
}

/* ── 5. HIRE: creator marketplace ── */
function HireMock() {
  const creators = [
    { name: 'Alex R.', role: 'Video editor', rate: '£45/hr', rating: 4.9, avail: true },
    { name: 'Priya S.', role: 'Brand designer', rate: '£55/hr', rating: 5.0, avail: true },
    { name: 'Tom W.', role: 'Photographer', rate: '£40/hr', rating: 4.8, avail: false },
  ];
  return (
    <div style={{ ...UI_BASE, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.01em' }}>Hire a Creator</div>
        <div style={{
          fontSize: 10, color: 'rgba(255,255,255,0.35)',
          padding: '4px 10px', borderRadius: 100,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          47 available
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {creators.map((c) => (
          <div key={c.name} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0,
            }}>
              {c.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f5', letterSpacing: '-0.01em' }}>{c.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{c.role}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{c.rate}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 9, color: VOLT }}>★</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{c.rating}</span>
                {c.avail && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4CAF50', marginLeft: 4 }} />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Core Value Section ───────────────────────────────────────────────────────

const CORE_VALUES = [
  {
    tag: 'Find clients',
    headline: 'AI-powered prospecting that actually finds real leads.',
    body: 'Surface the right opportunities — without endless searching, scraping, or paying for 3 different tools.',
    featured: false,
    mock: <FindMock />,
    icon: (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    tag: 'Track everything',
    headline: 'Know exactly where every lead, project, and client stands.',
    body: 'A single pipeline across prospects, proposals, and active jobs — at a glance, not buried in tabs.',
    featured: false,
    mock: <TrackMock />,
    icon: (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-8" /><path d="M22 20H2" />
      </svg>
    ),
  },
  {
    tag: 'Deliver without chaos',
    headline: 'Structured project workflows so nothing gets missed.',
    body: 'Briefs, files, milestones, payments — one place, tied to one client, moving in one direction.',
    featured: false,
    mock: <DeliverMock />,
    icon: (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
      </svg>
    ),
  },
  {
    tag: 'Client portal',
    headline: 'Give clients one place to track, review, and request changes.',
    body: 'No more chasing messages across email, DMs and WhatsApp. They log in — everything they need is there.',
    featured: true,
    mock: <FeaturePortalMock />,
    icon: (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 8h18" /><circle cx="7" cy="6" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    tag: 'Hire & collaborate',
    headline: 'Find and hire other creators inside Nomaad.',
    body: 'Editors, designers, shooters — vetted, bookable, and ready to plug straight into your projects.',
    featured: false,
    mock: <HireMock />,
    icon: (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3.4" /><path d="M2 20c0-3.4 3.1-6 7-6s7 2.6 7 6" />
        <circle cx="17.5" cy="9.5" r="2.4" /><path d="M17.5 14c2.8 0 4.5 1.8 4.5 4" />
      </svg>
    ),
  },
];

function CoreValueSection() {
  return (
    <section style={{ padding: 'clamp(100px, 14vw, 160px) 20px', maxWidth: 1200, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 100 }}>
        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700,
          color: '#f0f0f5', letterSpacing: '-0.035em', margin: 0, lineHeight: 1.1,
        }}>
          Everything you need.
          {' '}
          <span style={{ color: 'rgba(240,240,245,0.35)' }}>Nothing you don&apos;t.</span>
        </h2>
      </FadeUp>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(80px, 12vw, 120px)' }}>
        {CORE_VALUES.map((v, i) => (
          <FadeUp key={v.tag} delay={0.05}>
            <div
              className="nomaad-feature-row"
              style={{
                display: 'grid',
                gridTemplateColumns: i % 2 === 0 ? '1fr 1.2fr' : '1.2fr 1fr',
                alignItems: 'center',
                gap: 'clamp(40px, 8vw, 100px)',
              }}
            >
              {/* Text side */}
              <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: v.featured ? VOLT : 'rgba(240,240,245,0.4)',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: v.featured ? 'rgba(204,253,1,0.12)' : 'rgba(255,255,255,0.04)',
                    color: v.featured ? VOLT : 'rgba(240,240,245,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{v.icon}</span>
                  {v.tag}
                </div>

                <h3 style={{
                  fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700,
                  color: '#f0f0f5', margin: '0 0 16px',
                  letterSpacing: '-0.025em', lineHeight: 1.2,
                }}>
                  {v.headline}
                </h3>

                <p style={{
                  fontSize: 16, color: 'rgba(240,240,245,0.5)',
                  lineHeight: 1.7, margin: 0, maxWidth: 400,
                }}>
                  {v.body}
                </p>
              </div>

              {/* Mock UI side */}
              <div style={{ order: i % 2 === 0 ? 2 : 1 }}>
                {v.mock}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      <style>{`
        @media (max-width: 820px) {
          .nomaad-feature-row {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .nomaad-feature-row > * {
            order: unset !important;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Stack Section ────────────────────────────────────────────────────────────
// Redesigned: clean list of old tools with dividers, keep comparison as single accent block

const OLD_STACK = [
  { name: 'Notion',           purpose: 'Notes & tasks',            cost: '£16/mo', gap: 'Great for docs. Not built for clients, leads or invoices.' },
  { name: 'FreshBooks',       purpose: 'Invoicing',                cost: '£29/mo', gap: 'Solid invoicing. Disconnected from your tasks and pipeline.' },
  { name: 'Calendly',         purpose: 'Booking calls',            cost: '£12/mo', gap: 'Clean bookings. Ends right where the client work begins.' },
  { name: 'Google Workspace', purpose: 'Email, Docs, Sheets, Meet', cost: '£12/mo', gap: 'Essential day-to-day. Nothing links it to your business.' },
];

function StackSection() {
  const totalCost = OLD_STACK.reduce((sum, t) => {
    const num = parseInt(t.cost.replace(/[^0-9]/g, ''), 10);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <section style={{ padding: 'clamp(100px, 14vw, 160px) 20px', maxWidth: 960, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 80 }}>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 20px', lineHeight: 1.15,
        }}>
          The modern creative stack
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(240,240,245,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
          Great tools — none of them talking to each other.
        </p>
      </FadeUp>

      <div style={{ marginBottom: 48 }}>
        {OLD_STACK.map((t, i) => (
          <FadeUp key={t.name} delay={i * 0.04}>
            <div
              className="nomaad-stack-row"
              style={{
                padding: '24px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'baseline', gap: 24,
              }}
            >
              <div style={{ width: 140, flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(240,240,245,0.85)' }}>{t.name}</span>
              </div>
              <div style={{ flex: 1, fontSize: 14, color: 'rgba(240,240,245,0.45)', lineHeight: 1.6 }}>
                {t.gap}
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'rgba(240,240,245,0.4)',
                fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
              }}>
                {t.cost}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      {/* Summary row */}
      <FadeUp>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '28px 0',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div>
            <div style={{ fontSize: 15, color: 'rgba(240,240,245,0.5)', marginBottom: 4 }}>
              4 apps. 4 logins. 0 shared data.
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.02em' }}>
              £{totalCost}<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>/mo</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, color: VOLT, marginBottom: 4, fontWeight: 600 }}>
              With Nomaad
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.02em' }}>
              £39<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>/mo</span>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Integrations Marquee ────────────────────────────────────────────────────
// Infinite horizontal scroller showing real brand logos for apps Nomaad plugs into.

const INTEGRATIONS = [
  { name: 'Stripe',          src: '/integrations/stripe.svg' },
  { name: 'Gmail',           src: '/integrations/gmail.svg' },
  { name: 'Google Meet',     src: '/integrations/google-meet.svg' },
  { name: 'Google Calendar', src: '/integrations/google-calendar.svg' },
  { name: 'Claude',          src: '/integrations/claude.svg' },
  { name: 'WhatsApp',        src: '/integrations/whatsapp.svg' },
  { name: 'Google Drive',    src: '/integrations/google-drive.svg' },
];

function IntegrationTile({ item }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 14,
      padding: '18px 28px',
      borderRadius: 16,
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
      height: 72,
      boxSizing: 'border-box',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img
          src={item.src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={22}
          height={22}
          style={{ width: 22, height: 22, objectFit: 'contain', display: 'block' }}
        />
      </div>
      <span style={{
        fontSize: 15, fontWeight: 600, color: 'rgba(240,240,245,0.85)',
        whiteSpace: 'nowrap', letterSpacing: '-0.01em',
      }}>{item.name}</span>
    </div>
  );
}

function IntegrationsSection() {
  // Duplicate the list so the marquee can loop seamlessly
  const track = [...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS];

  return (
    <section style={{
      padding: 'clamp(80px, 12vw, 120px) 0',
      fontFamily: FF,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <FadeUp style={{
        textAlign: 'center', marginBottom: 64, padding: '0 20px',
        maxWidth: 720, marginLeft: 'auto', marginRight: 'auto',
      }}>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.15,
        }}>
          Connects to everything you use
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(240,240,245,0.45)', margin: 0, lineHeight: 1.65 }}>
          Gmail, Calendar, Stripe, Drive — all synced. One view.
        </p>
      </FadeUp>

      {/* Marquee track */}
      <div style={{
        position: 'relative',
        maskImage: 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)',
      }}>
        <div
          className="nomaad-marquee"
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            width: 'max-content',
            animation: 'nomaad-marquee 40s linear infinite',
          }}
        >
          {track.map((item, i) => (
            <IntegrationTile key={`${item.name}-${i}`} item={item} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes nomaad-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-100% / 3)); }
        }
        .nomaad-marquee:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .nomaad-marquee { animation: none; }
        }
      `}</style>
    </section>
  );
}

// ─── Client Portal Showcase ───────────────────────────────────────────────────

const PORTAL_BULLETS = [
  { title: 'Clients log in anytime',        body: 'A single link. No app to install. Bookmarkable.' },
  { title: 'See project progress instantly', body: 'Status, milestones, next step — visible without asking.' },
  { title: 'Review edits in one place',     body: 'Drafts, cuts and references all queued for feedback.' },
  { title: 'Submit change requests clearly', body: 'Timestamped notes, not 20-message Slack threads.' },
  { title: 'No more messy email threads',   body: 'Everything said, shared or sent lives alongside the project.' },
];

function ClientPortalShowcase() {
  return (
    <section style={{ padding: 'clamp(100px, 14vw, 160px) 20px', maxWidth: 1200, margin: '0 auto', fontFamily: FF }}>
      <div
        className="nomaad-portal-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          alignItems: 'center',
          gap: 'clamp(48px, 8vw, 100px)',
        }}
      >
        {/* Text side */}
        <FadeUp>
          <div style={{
            fontSize: 11, fontWeight: 700, color: VOLT,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Client Portal
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
            color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 20px', lineHeight: 1.15,
          }}>
            No more &ldquo;any updates?&rdquo; messages.
          </h2>

          <p style={{
            fontSize: 17, color: 'rgba(240,240,245,0.5)', lineHeight: 1.7,
            margin: '0 0 32px', maxWidth: 440,
          }}>
            Give clients a single place to track progress, review edits, and request changes — without chasing you.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PORTAL_BULLETS.slice(0, 3).map((b, i) => (
              <li key={i} style={{
                fontSize: 15, color: 'rgba(240,240,245,0.6)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ color: VOLT, fontSize: 14 }}>✓</span>
                {b.title}
              </li>
            ))}
          </ul>
        </FadeUp>

        {/* Visual side */}
        <FadeUp delay={0.1}>
          <ClientPortalMock />
        </FadeUp>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .nomaad-portal-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}

function ClientPortalMock() {
  return (
    <div style={{
      borderRadius: 18,
      background: 'linear-gradient(180deg, rgba(22,22,26,0.95) 0%, rgba(14,14,18,0.95) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.015)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57','#ffbd2e','#28c840'].map(c => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.75 }} />
          ))}
        </div>
        <div style={{
          flex: 1, textAlign: 'center',
          fontSize: 11, color: 'rgba(255,255,255,0.4)',
          fontWeight: 600, letterSpacing: '0.02em',
        }}>
          portal.nomaad.ai/soren-weddings
        </div>
      </div>

      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Soren Weddings
            </div>
            <div style={{ fontSize: 18, color: '#f0f0f5', fontWeight: 700, marginTop: 3, letterSpacing: '-0.015em' }}>
              Highlight reel · Autumn 2026
            </div>
          </div>
          <span style={{
            padding: '5px 10px', borderRadius: 6,
            fontSize: 10, fontWeight: 700, color: VOLT,
            background: 'rgba(204,253,1,0.08)',
            border: '1px solid rgba(204,253,1,0.18)',
            letterSpacing: '0.04em',
          }}>IN REVIEW</span>
        </div>

        {/* Milestones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {[
            { label: 'Brief',    done: true  },
            { label: 'Shoot',    done: true  },
            { label: 'Rough cut', done: true },
            { label: 'Review',   done: false, active: true },
            { label: 'Final',    done: false },
          ].map((m, i, arr) => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', flex: i === arr.length - 1 ? '0 0 auto' : 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: m.done ? VOLT : m.active ? 'rgba(204,253,1,0.15)' : 'rgba(255,255,255,0.06)',
                  border: m.active ? `2px solid ${VOLT}` : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.done && (
                    <svg viewBox="0 0 24 24" width={10} height={10} fill="none" stroke="#0a0a0a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 600,
                  color: m.active ? VOLT : m.done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.02em',
                }}>{m.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{
                  flex: 1, height: 2, marginTop: -18,
                  background: m.done ? VOLT : 'rgba(255,255,255,0.06)',
                  opacity: m.done ? 0.5 : 1,
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Latest draft card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 14,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <div style={{
            width: 56, height: 40, borderRadius: 8,
            background: 'linear-gradient(135deg, #5AC8FA, #0f7ad6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="#fff" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.01em' }}>Rough cut · v3.mp4</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Uploaded 2h ago · 3:42 runtime</div>
          </div>
          <button style={{
            padding: '6px 10px', borderRadius: 7,
            background: VOLT, color: '#0a0a0a',
            fontSize: 10, fontWeight: 800, letterSpacing: '0.02em',
            border: 'none', cursor: 'pointer', fontFamily: FF,
          }}>Review</button>
        </div>

        {/* Latest request */}
        <div style={{
          background: 'rgba(255,179,64,0.06)',
          border: '1px solid rgba(255,179,64,0.18)',
          borderRadius: 12,
          padding: 12,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#FFB340',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#0a0a0a',
            flexShrink: 0,
          }}>A</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f0f5' }}>
              Ana left a note on <span style={{ color: '#FFB340' }}>01:24</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.45 }}>
              &ldquo;Can we soften the audio here and hold the shot slightly longer before the cut?&rdquo;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Collaboration Section ────────────────────────────────────────────────────

const COLLAB_BULLETS = [
  { title: 'Find vetted creators',           body: 'Editors, shooters, designers, strategists — with real portfolios.' },
  { title: 'Plug them in instantly',         body: 'Add them to a project in one click. No onboarding cycle.' },
  { title: 'Keep everything in one system',  body: 'Briefs, files, comments — shared, not scattered.' },
  { title: 'Manage team and client together', body: 'Same workspace. Different permissions. No confusion.' },
];

function CollaborationSection() {
  return (
    <section style={{ padding: 'clamp(100px, 14vw, 160px) 20px', maxWidth: 1200, margin: '0 auto', fontFamily: FF }}>
      <div
        className="nomaad-collab-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          alignItems: 'center',
          gap: 'clamp(48px, 8vw, 100px)',
        }}
      >
        {/* Visual side */}
        <FadeUp>
          <CollabMock />
        </FadeUp>

        {/* Text side */}
        <FadeUp delay={0.1}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'rgba(240,240,245,0.4)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Collaboration
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
            color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 20px', lineHeight: 1.15,
          }}>
            Need help? Hire inside Nomaad.
          </h2>

          <p style={{
            fontSize: 17, color: 'rgba(240,240,245,0.5)', lineHeight: 1.7,
            margin: '0 0 32px', maxWidth: 440,
          }}>
            Find vetted editors, designers, and shooters — and plug them straight into your projects.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {COLLAB_BULLETS.slice(0, 3).map((b, i) => (
              <li key={i} style={{
                fontSize: 15, color: 'rgba(240,240,245,0.6)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ color: VOLT, fontSize: 14 }}>✓</span>
                {b.title}
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .nomaad-collab-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}

function CollabMock() {
  const roster = [
    { name: 'Ana Ríos',    role: 'Editor',       rate: '£65/hr', avatar: 'A', color: '#FFB340', rating: '4.9', status: 'Available' },
    { name: 'Marcus Lee',  role: 'Colourist',    rate: '£90/hr', avatar: 'M', color: '#BF5AF2', rating: '5.0', status: 'Booked · Fri' },
    { name: 'Halo Studio', role: 'Motion',       rate: '£110/hr', avatar: 'H', color: '#5AC8FA', rating: '4.8', status: 'Available' },
  ];

  return (
    <div style={{
      borderRadius: 18,
      background: 'linear-gradient(180deg, rgba(22,22,26,0.95) 0%, rgba(14,14,18,0.95) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.015)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Hire
          </div>
          <div style={{ fontSize: 14, color: '#f0f0f5', fontWeight: 700, marginTop: 2 }}>
            Creators for your project
          </div>
        </div>
        <span style={{
          padding: '5px 10px', borderRadius: 999,
          fontSize: 10, fontWeight: 700, color: VOLT,
          background: 'rgba(204,253,1,0.08)', letterSpacing: '0.04em',
        }}>3 matches</span>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {roster.map(p => (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: p.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#0a0a0a',
              flexShrink: 0,
            }}>{p.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.01em' }}>{p.name}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 10, color: '#FFB340', fontWeight: 700,
                }}>
                  <svg viewBox="0 0 24 24" width={10} height={10} fill="currentColor" aria-hidden="true">
                    <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z" />
                  </svg>
                  {p.rating}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                {p.role} · {p.rate} · {p.status}
              </div>
            </div>
            <button style={{
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(204,253,1,0.1)',
              border: '1px solid rgba(204,253,1,0.25)',
              color: VOLT,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
              cursor: 'pointer', fontFamily: FF,
            }}>Add</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Avatar Section ───────────────────────────────────────────────────────────

function AvatarSection() {
  const AVATARS = ['Videographers', 'Photographers', 'Designers', 'Copywriters', 'Editors', 'Creators', 'Coaches', 'Social managers'];
  return (
    <section style={{ padding: 'clamp(100px, 14vw, 160px) 20px', maxWidth: 900, margin: '0 auto', fontFamily: FF, textAlign: 'center' }}>
      <FadeUp>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 24px', lineHeight: 1.15,
        }}>
          Built for solo operators
        </h2>
        <p style={{
          fontSize: 17, color: 'rgba(240,240,245,0.45)', maxWidth: 520,
          margin: '0 auto 48px', lineHeight: 1.7,
        }}>
          Not agencies. Not teams. For the person doing everything themselves.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {AVATARS.map((a) => (
            <span key={a} style={{
              padding: '10px 20px', borderRadius: 100,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 14, fontWeight: 500, color: 'rgba(240,240,245,0.6)', fontFamily: FF,
            }}>{a}</span>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Testimonials ─���──────────────────────────────────────────────��────────────
// Redesigned: transparent quotes with left accent line, no boxed cards

const TESTIMONIALS = [
  {
    quote: "I had invoices lost in Gmail threads for months. First month on Nomaad I got paid 3 weeks faster — purely because everything was in one place.",
    name: 'Jake T.',
    role: 'Freelance Videographer · London',
    metric: 'Paid 3 weeks faster',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&auto=format&fit=crop',
    variant: 'volt',
  },
  {
    quote: "Cancelled Notion, Toggl, and FreshBooks in the same week. Saving £65/mo and actually understanding my cash flow for the first time.",
    name: 'Priya S.',
    role: 'Brand Designer · Manchester',
    metric: '£65/mo saved · 3 tools gone',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    variant: 'blue',
  },
  {
    quote: "My clients check the portal instead of WhatsApping me at 11pm. I can't overstate how much that changed my evenings.",
    name: 'Marcus R.',
    role: 'Photographer · Bristol',
    metric: 'Zero late-night messages',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    variant: 'dark',
  },
];

function TestimonialCard({ t, featured }) {
  const isVolt = t.variant === 'volt';
  const isBlue = t.variant === 'blue';
  const isDark = t.variant === 'dark';

  const bg = isVolt
    ? 'linear-gradient(135deg, #d4ff4a 0%, #ccfd01 100%)'
    : isBlue
      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
      : 'linear-gradient(135deg, #18181b 0%, #0f0f12 100%)';

  const textColor = isVolt ? '#0a0a0a' : '#f0f0f5';
  const mutedColor = isVolt ? 'rgba(10,10,10,0.6)' : 'rgba(240,240,245,0.55)';
  const metricBg = isVolt ? 'rgba(10,10,10,0.08)' : 'rgba(255,255,255,0.1)';
  const metricColor = isVolt ? '#0a0a0a' : '#f0f0f5';
  const border = isDark ? '1px solid rgba(255,255,255,0.08)' : 'none';

  return (
    <div style={{
      background: bg,
      borderRadius: 20,
      padding: featured ? 36 : 28,
      display: 'flex', flexDirection: 'column',
      gap: 24,
      height: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      border,
      boxShadow: isVolt ? '0 20px 60px -20px rgba(204,253,1,0.25)' : isBlue ? '0 20px 60px -20px rgba(37,99,235,0.35)' : '0 20px 40px -20px rgba(0,0,0,0.6)',
    }}>
      {/* Subtle grid for featured */}
      {isVolt && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 90%)',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ position: 'relative', display: 'inline-flex', alignSelf: 'flex-start' }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '6px 12px', borderRadius: 999,
          background: metricBg, color: metricColor,
        }}>
          {t.metric}
        </span>
      </div>

      <p style={{
        position: 'relative',
        fontSize: featured ? 20 : 16,
        lineHeight: 1.5,
        color: textColor,
        fontWeight: featured ? 500 : 400,
        margin: 0,
        letterSpacing: '-0.01em',
        flex: 1,
      }}>
        &ldquo;{t.quote}&rdquo;
      </p>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: textColor, letterSpacing: '-0.01em' }}>
            {t.name}
          </div>
          <div style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
            {t.role}
          </div>
        </div>
        <img
          src={t.avatar}
          alt={t.name}
          loading="lazy"
          style={{
            width: 56, height: 56, borderRadius: 14,
            objectFit: 'cover', flexShrink: 0,
            border: isVolt ? '2px solid rgba(10,10,10,0.12)' : '2px solid rgba(255,255,255,0.1)',
          }}
        />
      </div>
    </div>
  );
}

function TestimonialsSection() {
  return (
    <section style={{ padding: 'clamp(100px, 14vw, 160px) 20px', maxWidth: 1200, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 72 }}>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.15,
        }}>
          What early users are saying
        </h2>
      </FadeUp>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {TESTIMONIALS.map((t, i) => (
          <FadeUp key={t.name} delay={i * 0.08} style={{ display: 'flex' }}>
            <div style={{ width: '100%', display: 'flex' }}>
              <TestimonialCard t={t} featured={t.variant === 'volt'} />
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Founder Note ─────────────────────────────────────────────────────────────
// Redesigned: unboxed quote-style with left accent

function FounderNote() {
  return (
    <section style={{ padding: 'clamp(60px, 10vw, 80px) 24px', maxWidth: 680, margin: '0 auto', fontFamily: FF }}>
      <FadeUp>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(204,253,1,0.6)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>
          Why we built this
        </p>
        <p style={{
          fontSize: 'clamp(18px, 2.5vw, 22px)',
          color: 'rgba(240,240,245,0.75)', lineHeight: 1.6,
          margin: '0 0 32px', letterSpacing: '-0.01em', fontWeight: 400,
        }}>
          I spent more time updating spreadsheets and chasing invoices than actually doing the work I was hired for.
          Every tool I tried was built for a 10-person agency — not for one person trying to do everything.
          So I stopped looking and built the thing I needed.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(204,253,1,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: VOLT,
          }}>N</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f5' }}>Nomaad team</div>
            <div style={{ fontSize: 12, color: 'rgba(240,240,245,0.35)' }}>Freelancers who got tired of bad tooling</div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
// Kept as cards — pricing cards carry meaning, but reduced visual weight on non-featured

const PLANS = [
  {
    name: 'Creator',
    price: '£39',
    period: '/mo',
    desc: 'Everything you need to run your solo business without the chaos.',
    featured: true,
    features: ['Client pipeline & CRM', 'Automated follow-ups', 'Projects & task tracking', 'Invoicing & payment tracking', 'Client portal', 'Calendar & scheduling', 'AI assistant'],
  },
  {
    name: 'Studio',
    price: '£89',
    period: '/mo',
    desc: 'For small creative studios growing beyond one person.',
    featured: false,
    features: ['Everything in Creator', 'Up to 5 team members', 'Shared pipeline & projects', 'Team calendar', 'Priority support', 'Custom branding'],
  },
];

function PricingSection() {
  return (
    <section id="pricing" style={{ padding: 'clamp(100px, 14vw, 160px) 24px', maxWidth: 920, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 72 }}>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.15,
        }}>
          Simple pricing
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(240,240,245,0.45)', margin: 0, lineHeight: 1.65 }}>
          Replace 5 tools for less than the cost of one.
        </p>
      </FadeUp>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, alignItems: 'stretch' }}>
        {PLANS.map((plan, i) => (
          <FadeUp key={plan.name} delay={i * 0.08}>
            <div style={{
              padding: '36px 32px', borderRadius: 24,
              background: plan.featured ? 'rgba(204,253,1,0.035)' : 'transparent',
              border: plan.featured ? `1px solid rgba(204,253,1,0.22)` : '1px solid rgba(255,255,255,0.07)',
              position: 'relative', overflow: 'hidden', height: '100%', boxSizing: 'border-box',
              boxShadow: plan.featured ? `0 0 80px rgba(204,253,1,0.05)` : 'none',
            }}>
              {plan.featured && (
                <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 1, background: `linear-gradient(90deg, transparent, ${VOLT}80, transparent)` }} />
              )}
              {plan.featured && (
                <div style={{
                  display: 'inline-block', padding: '4px 12px', borderRadius: 100,
                  background: 'rgba(204,253,1,0.12)', color: VOLT,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 20,
                }}>MOST POPULAR</div>
              )}
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(240,240,245,0.55)' }}>{plan.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 10 }}>
                <span style={{ fontSize: 52, fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em' }}>{plan.price}</span>
                <span style={{ fontSize: 15, color: 'rgba(240,240,245,0.4)' }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(240,240,245,0.45)', margin: '0 0 32px', lineHeight: 1.55 }}>{plan.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: VOLT, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 14, color: 'rgba(240,240,245,0.7)', lineHeight: 1.45 }}>{f}</span>
                  </div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 100, border: 'none',
                  background: plan.featured ? `linear-gradient(135deg, ${VOLT}, ${VOLTD})` : 'rgba(255,255,255,0.06)',
                  color: plan.featured ? '#0a0a0a' : 'rgba(240,240,245,0.8)',
                  fontWeight: 700, fontSize: 14, fontFamily: FF, cursor: 'pointer',
                  boxShadow: plan.featured ? `0 4px 24px rgba(204,253,1,0.2)` : 'none',
                }}
              >
                {plan.featured ? 'Join the waitlist' : 'Get early access'}
              </motion.button>
              {plan.featured && (
                <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(240,240,245,0.3)', margin: '12px 0 0', fontFamily: FF }}>
                  14-day free trial on launch · No card required · Cancel anytime
                </p>
              )}
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Closer ───────────────────────────────────────────────────────────────────

function CloserSection() {
  return (
    <section style={{ padding: 'clamp(120px, 16vw, 200px) 24px', textAlign: 'center', fontFamily: FF }}>
      <FadeUp style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 24px', lineHeight: 1.1,
        }}>
          Ready to simplify?
        </h2>
        <p style={{ fontSize: 18, color: 'rgba(240,240,245,0.45)', lineHeight: 1.7, margin: '0 0 48px' }}>
          Join creators who stopped juggling tools and started running their business.
        </p>
        <WaitlistForm source="closer" label="Join the waitlist" />
        <p style={{ fontSize: 13, color: 'rgba(240,240,245,0.3)', marginTop: 20 }}>
          Free trial on launch. No card required.
        </p>
      </FadeUp>
    </section>
  );
}

// ─── Footer ─────────���─────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{
      padding: '32px 40px', borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      fontFamily: FF, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0a0a0a', fontWeight: 800, fontSize: 10,
        }}>N</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,245,0.5)' }}>Nomaad</span>
      </div>
      <span style={{ fontSize: 12, color: 'rgba(240,240,245,0.25)' }}>
        © {new Date().getFullYear()} Nomaad. Built for solo creators.
      </span>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted }) {
  return (
    <div style={{
      background: SHELL, minHeight: '100vh', color: '#f0f0f5',
      fontFamily: FF, WebkitFontSmoothing: 'antialiased', overflowX: 'hidden',
    }}>
      <Nav onSignIn={onGetStarted} />
      <Hero onSignIn={onGetStarted} />
      <ProblemSection />
      <CoreValueSection />
      <ProductFlowSection />
      <ClientPortalShowcase />
      <CollaborationSection />
      <StackSection />
      <IntegrationsSection />
      <AvatarSection />
      <TestimonialsSection />
      <FounderNote />
      <PricingSection />
      <CloserSection />
      <Footer />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        input::placeholder { color: rgba(240,240,245,0.25); }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
