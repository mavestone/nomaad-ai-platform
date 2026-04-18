import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

const VOLT = '#ccfd01';
const VOLTD = '#b8e300';
const SHELL = '#08080a';
const FF = "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',system-ui,sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
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
      initial={{ opacity: 0, y: 28 }}
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
  const [state, setState] = useState('idle'); // idle | loading | success | error
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
          background: 'rgba(204,253,1,0.08)',
          border: `1px solid rgba(204,253,1,0.25)`,
          borderRadius: 100, color: VOLT,
          fontFamily: FF, fontSize: compact ? 13 : 14, fontWeight: 600,
        }}
      >
        <span style={{ fontSize: 16 }}>✓</span> You're on the list. We'll be in touch.
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: compact ? 'nowrap' : 'wrap', justifyContent: 'center' }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        style={{
          padding: compact ? '10px 16px' : '13px 18px',
          background: 'rgba(255,255,255,0.06)',
          border: state === 'error' ? '1px solid rgba(255,98,89,0.5)' : '1px solid rgba(255,255,255,0.12)',
          borderRadius: 100,
          color: '#f0f0f5',
          fontSize: compact ? 13 : 14,
          fontFamily: FF,
          outline: 'none',
          width: compact ? 220 : 260,
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(204,253,1,0.4)'; }}
        onBlur={(e) => { e.target.style.borderColor = state === 'error' ? 'rgba(255,98,89,0.5)' : 'rgba(255,255,255,0.12)'; }}
      />
      <motion.button
        type="submit"
        disabled={state === 'loading' || !email}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: compact ? '10px 20px' : '13px 24px',
          background: state === 'loading' || !email
            ? 'rgba(255,255,255,0.08)'
            : `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          color: state === 'loading' || !email ? 'rgba(255,255,255,0.3)' : '#0a0a0a',
          border: 'none', borderRadius: 100,
          fontWeight: 700, fontSize: compact ? 13 : 14,
          fontFamily: FF, cursor: state === 'loading' || !email ? 'not-allowed' : 'pointer',
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
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 999, display: 'flex', alignItems: 'center',
        gap: 32, padding: '10px 20px 10px 16px',
        background: scrolled ? 'rgba(8,8,10,0.88)' : 'rgba(8,8,10,0.6)',
        backdropFilter: 'blur(24px) saturate(1.8)',
        border: `1px solid ${scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 100,
        boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        fontFamily: FF,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0a0a0a', fontWeight: 800, fontSize: 13, flexShrink: 0,
        }}>N</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#f0f0f5', letterSpacing: -0.3 }}>Nomaad</span>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {[['Features', 'features'], ['Pricing', 'pricing']].map(([label, id]) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            style={{
              background: 'none', border: 'none', color: 'rgba(240,240,245,0.55)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FF,
              padding: 0, transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.color = '#f0f0f5'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(240,240,245,0.55)'}
          >
            {label}
          </button>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={onSignIn}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(240,240,245,0.6)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FF, padding: '6px 12px',
          }}
        >Sign in</button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => scrollTo('waitlist')}
          style={{
            padding: '7px 16px',
            background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
            color: '#0a0a0a', border: 'none', borderRadius: 100,
            fontWeight: 700, fontSize: 13, fontFamily: FF, cursor: 'pointer',
            boxShadow: `0 3px 16px rgba(204,253,1,0.25)`,
          }}
        >Get early access</motion.button>
      </div>
    </motion.nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ onSignIn }) {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '140px 24px 80px', textAlign: 'center', position: 'relative',
      fontFamily: FF,
    }}>
      {/* Aurora blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-15%', left: '55%', width: 700, height: 700,
          borderRadius: '50%', background: VOLT, filter: 'blur(160px)', opacity: 0.055,
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%', width: 600, height: 600,
          borderRadius: '50%', background: '#5AC8FA', filter: 'blur(140px)', opacity: 0.04,
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '40%', width: 500, height: 500,
          borderRadius: '50%', background: '#FFB340', filter: 'blur(160px)', opacity: 0.025,
        }} />
      </div>

      <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto' }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px 6px 10px',
            background: 'rgba(204,253,1,0.07)',
            border: '1px solid rgba(204,253,1,0.2)',
            borderRadius: 100, marginBottom: 32,
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: VOLT,
            boxShadow: `0 0 8px ${VOLT}`,
            animation: 'pulse 2s ease infinite',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: VOLT, letterSpacing: '0.04em' }}>
            NOW IN BETA · WAITLIST OPEN
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 'clamp(44px, 7vw, 80px)',
            fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em',
            color: '#f0f0f5', margin: '0 0 20px',
          }}
        >
          You're the creative.
          <br />
          <span style={{ color: VOLT }}>We'll run the business.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 'clamp(16px, 2.2vw, 20px)',
            color: 'rgba(240,240,245,0.5)', lineHeight: 1.6,
            maxWidth: 580, margin: '0 auto 40px',
          }}
        >
          CRM, projects, invoicing, content calendar — all in one place, built for one person.
          Stop juggling eight tools. Get back to the work only you can do.
        </motion.p>

        {/* Waitlist form */}
        <motion.div
          id="waitlist"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <WaitlistForm source="hero" label="Join the waitlist →" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          style={{ fontSize: 12, color: 'rgba(240,240,245,0.3)', marginTop: 16 }}
        >
          Already have an account?{' '}
          <button
            onClick={onSignIn}
            style={{ background: 'none', border: 'none', color: 'rgba(204,253,1,0.7)', fontFamily: FF, fontSize: 12, cursor: 'pointer', fontWeight: 600, padding: 0 }}
          >Sign in →</button>
        </motion.p>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginTop: 64, position: 'relative' }}
        >
          {/* Glow under mockup */}
          <div style={{
            position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)',
            width: '70%', height: 120, borderRadius: '50%',
            background: VOLT, filter: 'blur(60px)', opacity: 0.08, pointerEvents: 'none',
          }} />
          <AppMockup />
        </motion.div>
      </div>
    </section>
  );
}

// ─── App Mockup ───────────────────────────────────────────────────────────────

function AppMockup() {
  const clients = [
    { name: 'Anchor Studio', tag: 'Active', tagColor: VOLT, tagBg: 'rgba(204,253,1,0.12)', val: '£4,200', stage: 'Production' },
    { name: 'Volta Creative', tag: 'Proposal', tagColor: '#5AC8FA', tagBg: 'rgba(90,200,250,0.12)', val: '£2,800', stage: 'Review' },
    { name: 'Nori Films', tag: 'New lead', tagColor: '#FFB340', tagBg: 'rgba(255,179,64,0.12)', val: '£6,500', stage: 'Briefing' },
  ];
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      textAlign: 'left',
      fontFamily: FF,
      maxWidth: 760, margin: '0 auto',
    }}>
      {/* Window chrome */}
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.9 }} />
        ))}
        <div style={{
          flex: 1, height: 20, borderRadius: 6,
          background: 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: 'rgba(255,255,255,0.2)', marginLeft: 8,
        }}>
          app.nomaad.ai
        </div>
      </div>

      {/* App shell */}
      <div style={{ display: 'flex', height: 340 }}>
        {/* Sidebar */}
        <div style={{
          width: 180, borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4,
          background: 'rgba(255,255,255,0.015)', flexShrink: 0,
        }}>
          {[
            { label: 'Dashboard', active: false, icon: '⊞' },
            { label: 'CRM', active: true, icon: '◎' },
            { label: 'Projects', active: false, icon: '▤' },
            { label: 'Calendar', active: false, icon: '⊡' },
            { label: 'Financials', active: false, icon: '◈' },
          ].map(({ label, active, icon }) => (
            <div key={label} style={{
              padding: '7px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
              background: active ? 'rgba(204,253,1,0.1)' : 'transparent',
              color: active ? VOLT : 'rgba(255,255,255,0.35)',
              fontSize: 12, fontWeight: active ? 600 : 400,
            }}>
              <span style={{ fontSize: 10 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '20px 20px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f5' }}>CRM Pipeline</span>
            <div style={{
              padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
              background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`, color: '#0a0a0a',
            }}>+ Add client</div>
          </div>

          {/* Client cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clients.map((c) => (
              <div key={c.name} style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                }}>{c.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f5', marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.stage}</div>
                </div>
                <div style={{
                  padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600,
                  background: c.tagBg, color: c.tagColor,
                }}>{c.tag}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f5', minWidth: 48, textAlign: 'right' }}>{c.val}</div>
              </div>
            ))}
          </div>

          {/* Pipeline strip */}
          <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
            {['Briefing', 'Production', 'Review', 'Delivered', 'Invoiced'].map((s, i) => (
              <div key={s} style={{
                flex: 1, padding: '5px 0', borderRadius: 6, textAlign: 'center',
                fontSize: 9, fontWeight: 600,
                background: i === 1 ? 'rgba(204,253,1,0.12)' : 'rgba(255,255,255,0.03)',
                color: i === 1 ? VOLT : 'rgba(255,255,255,0.25)',
                border: i === 1 ? `1px solid rgba(204,253,1,0.2)` : '1px solid rgba(255,255,255,0.05)',
              }}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  'CRM', 'Invoicing', 'Projects', 'Calendar', 'Client Portal',
  'Automations', 'Documents', 'Pipeline', 'Time Tracking', 'Proposals',
];

function Marquee() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{
      padding: '28px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        display: 'flex', gap: 48, width: 'max-content',
        animation: 'marquee 30s linear infinite',
        fontFamily: FF,
      }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span style={{ color: VOLT, fontSize: 10, opacity: 0.6 }}>✦</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,245,0.35)', whiteSpace: 'nowrap' }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Villain Section ──────────────────────────────────────────────────────────

const PAINS = [
  { emoji: '📋', title: 'Notion for notes & tasks', sub: "But it can't invoice." },
  { emoji: '📊', title: 'Sheets for finances', sub: 'Updated once a quarter, usually wrong.' },
  { emoji: '📅', title: 'Calendly for scheduling', sub: 'Another login, another tab.' },
  { emoji: '📧', title: 'Gmail for client comms', sub: 'Follow-ups lost in the abyss.' },
  { emoji: '🧾', title: 'FreshBooks for invoices', sub: '£30/mo for a glorified PDF.' },
  { emoji: '💬', title: 'WhatsApp for clients', sub: 'Revision requests in voice notes.' },
];

function VillainSection() {
  const [ref, visible] = useInView(0.1);
  return (
    <section ref={ref} style={{ padding: '100px 24px', maxWidth: 1080, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 56 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,240,245,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
          The reality
        </p>
        <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1 }}>
          You're running a business
          <br />
          <span style={{ color: 'rgba(240,240,245,0.35)' }}>with 8 different apps.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(240,240,245,0.4)', maxWidth: 480, margin: '0 auto' }}>
          The average solo creative wastes 3–4 hours a day on admin that shouldn't exist.
        </p>
      </FadeUp>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {PAINS.map((p, i) => (
          <FadeUp key={p.title} delay={i * 0.04}>
            <div style={{
              padding: '20px 22px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(240,240,245,0.7)', marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(240,240,245,0.3)' }}>{p.sub}</div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Plan Section ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    title: 'Bring your clients in',
    body: 'Import contacts or add them as they come in. Track deals through your pipeline — Briefing to Invoiced.',
    color: VOLT,
  },
  {
    num: '02',
    title: 'Run every job from one place',
    body: 'Projects, tasks, calendars, files, and client comms — all linked. No copy-pasting between apps.',
    color: '#5AC8FA',
  },
  {
    num: '03',
    title: 'Get paid without chasing',
    body: "Create invoices in seconds, track what's unpaid, and know exactly where your money is going.",
    color: '#FFB340',
  },
];

function PlanSection() {
  return (
    <section id="features" style={{ padding: '100px 24px', maxWidth: 1080, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,240,245,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
          How it works
        </p>
        <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
          One tool.{' '}
          <span style={{ color: VOLT }}>End to end.</span>
        </h2>
      </FadeUp>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {STEPS.map((s, i) => (
          <FadeUp key={s.num} delay={i * 0.08}>
            <div style={{
              padding: '32px 28px', borderRadius: 20,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              height: '100%', boxSizing: 'border-box',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 800, color: s.color, marginBottom: 20,
                fontVariantNumeric: 'tabular-nums', letterSpacing: '0.1em',
              }}>{s.num}</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f5', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(240,240,245,0.4)', lineHeight: 1.65, margin: 0 }}>
                {s.body}
              </p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Bento Section ────────────────────────────────────────────────────────────

function BentoSection() {
  const features = [
    {
      title: 'CRM & Pipeline',
      body: 'Track every client from first hello to final payment. Kanban pipeline, profile cards, notes, and tags.',
      icon: '◎',
      color: VOLT,
      span: 4,
    },
    {
      title: 'Financials',
      body: 'Invoices, transactions, and cash flow in one view.',
      icon: '◈',
      color: '#FFB340',
      span: 2,
    },
    {
      title: 'Projects & Tasks',
      body: 'Kanban boards per project. Tasks linked to clients and deadlines.',
      icon: '▤',
      color: '#5AC8FA',
      span: 2,
    },
    {
      title: 'Calendar',
      body: 'Week/month view with drag-and-drop, NLP event creation, and Google Calendar sync.',
      icon: '⊡',
      color: '#BF5AF2',
      span: 4,
    },
  ];

  return (
    <section style={{ padding: '40px 24px 100px', maxWidth: 1080, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
          Everything you need,
          <br />
          <span style={{ color: 'rgba(240,240,245,0.35)' }}>nothing you don't.</span>
        </h2>
      </FadeUp>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {features.map((f, i) => (
          <FadeUp key={f.title} delay={i * 0.06} style={{ gridColumn: `span ${f.span}` }}>
            <div style={{
              padding: '28px 26px', borderRadius: 18,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              height: '100%', boxSizing: 'border-box',
              minHeight: 160,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, marginBottom: 16,
                background: `${f.color}18`, border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: f.color,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f5', margin: '0 0 8px', letterSpacing: '-0.02em' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(240,240,245,0.4)', lineHeight: 1.6, margin: 0 }}>{f.body}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Creator',
    price: '£39',
    period: '/mo',
    desc: 'Everything you need to run your freelance business solo.',
    featured: true,
    features: ['CRM & pipeline (unlimited clients)', 'Projects & kanban tasks', 'Invoicing & transactions', 'Calendar + Google sync', 'Client portal', 'AI assistant'],
  },
  {
    name: 'Studio',
    price: '£89',
    period: '/mo',
    desc: 'For small creative studios with multiple team members.',
    featured: false,
    features: ['Everything in Creator', 'Up to 5 team members', 'Shared projects & pipeline', 'Team calendar + scheduling', 'Priority support', 'Custom branding'],
  },
];

function PricingSection() {
  return (
    <section id="pricing" style={{ padding: '80px 24px 100px', maxWidth: 860, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 56 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,240,245,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
          Pricing
        </p>
        <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
          Replace 8 tools for less than{' '}
          <span style={{ color: VOLT }}>one of them.</span>
        </h2>
      </FadeUp>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, alignItems: 'start' }}>
        {PLANS.map((plan, i) => (
          <FadeUp key={plan.name} delay={i * 0.08}>
            <div style={{
              padding: '32px 28px', borderRadius: 22,
              background: plan.featured
                ? 'rgba(204,253,1,0.04)'
                : 'rgba(255,255,255,0.02)',
              border: plan.featured
                ? `1px solid rgba(204,253,1,0.2)`
                : '1px solid rgba(255,255,255,0.07)',
              position: 'relative', overflow: 'hidden',
              transform: plan.featured ? 'translateY(-8px)' : 'none',
              boxShadow: plan.featured ? `0 0 60px rgba(204,253,1,0.06)` : 'none',
            }}>
              {plan.featured && (
                <div style={{
                  position: 'absolute', top: 0, left: 28, right: 28, height: 2,
                  background: `linear-gradient(90deg, transparent, ${VOLT}, transparent)`,
                }} />
              )}
              {plan.featured && (
                <div style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 100,
                  background: 'rgba(204,253,1,0.12)', color: VOLT,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  marginBottom: 16,
                }}>MOST POPULAR</div>
              )}
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(240,240,245,0.55)' }}>{plan.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em' }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: 'rgba(240,240,245,0.4)' }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(240,240,245,0.4)', margin: '0 0 28px', lineHeight: 1.5 }}>{plan.desc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: VOLT, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'rgba(240,240,245,0.6)', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                  background: plan.featured
                    ? `linear-gradient(135deg, ${VOLT}, ${VOLTD})`
                    : 'rgba(255,255,255,0.07)',
                  color: plan.featured ? '#0a0a0a' : 'rgba(240,240,245,0.7)',
                  fontWeight: 700, fontSize: 14, fontFamily: FF, cursor: 'pointer',
                  boxShadow: plan.featured ? `0 4px 24px rgba(204,253,1,0.2)` : 'none',
                }}
              >
                {plan.featured ? 'Join the waitlist' : 'Get early access'}
              </motion.button>
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
    <section style={{ padding: '80px 24px 100px', textAlign: 'center', fontFamily: FF, position: 'relative' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: VOLT, filter: 'blur(120px)', opacity: 0.045, pointerEvents: 'none',
      }} />
      <FadeUp style={{ maxWidth: 680, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 20px', lineHeight: 1.08 }}>
          Your evenings are worth more
          <br />
          <span style={{ color: VOLT }}>than your toolstack.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(240,240,245,0.4)', lineHeight: 1.65, margin: '0 0 40px' }}>
          Join the waitlist and be first to get access when we launch.
        </p>
        <WaitlistForm source="closer" label="Reserve my spot →" />
      </FadeUp>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{
      padding: '28px 40px', borderTop: '1px solid rgba(255,255,255,0.05)',
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
        © {new Date().getFullYear()} Nomaad. Built for solo creatives.
      </span>
    </footer>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted }) {
  return (
    <div style={{
      background: SHELL, minHeight: '100vh', color: '#f0f0f5',
      fontFamily: FF, WebkitFontSmoothing: 'antialiased',
      overflowX: 'hidden',
    }}>
      <Nav onSignIn={onGetStarted} />
      <Hero onSignIn={onGetStarted} />
      <Marquee />
      <VillainSection />
      <PlanSection />
      <BentoSection />
      <PricingSection />
      <CloserSection />
      <Footer />

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        input::placeholder { color: rgba(240,240,245,0.25); }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
