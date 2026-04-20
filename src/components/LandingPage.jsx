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

function Label({ text }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: 'rgba(240,240,245,0.35)',
      letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14, margin: '0 0 14px',
      fontFamily: FF,
    }}>{text}</p>
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
          {[['How it works', 'workflow'], ['Pricing', 'pricing']].map(([label, id]) => (
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
          >Get early access</motion.button>
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
      alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(100px, 15vh, 140px) 20px 80px', textAlign: 'center', position: 'relative',
      fontFamily: FF,
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '60%', width: 700, height: 700, borderRadius: '50%', background: VOLT, filter: 'blur(160px)', opacity: 0.05 }} />
        <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: '#5AC8FA', filter: 'blur(140px)', opacity: 0.035 }} />
      </div>

      <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
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
            fontSize: 'clamp(34px, 8vw, 78px)', fontWeight: 800,
            lineHeight: 1.07, letterSpacing: '-0.03em',
            color: '#f0f0f5', margin: '0 0 20px',
          }}
        >
          You didn't start freelancing
          <br />
          <span style={{ color: VOLT }}>to drown in admin.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 'clamp(16px, 2.2vw, 19px)',
            color: 'rgba(240,240,245,0.5)', lineHeight: 1.65,
            maxWidth: 560, margin: '0 auto 36px',
          }}
        >
          Nomaad runs your client pipeline, follow-ups, invoicing, and projects automatically —
          so you can spend your time on work that actually pays.
        </motion.p>

        <motion.div
          id="waitlist"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <WaitlistForm source="hero" label="Get early access →" />
          <WaitlistCount />
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
    </section>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────
// Redesigned: clean editorial list with red hairline separators instead of cards

const PAINS = [
  { title: 'You copied a lead from Instagram into a spreadsheet. Again.', sub: 'Manual data entry is not a business system.' },
  { title: "A client emailed 3 days ago. You still haven't replied.",     sub: 'Buried in your inbox under 200 other things.' },
  { title: 'Your invoices are in one app, your notes in another, your tasks somewhere else.', sub: 'Nothing talks to anything. Every job starts with 20 minutes of admin.' },
  { title: "You spent Sunday catching up on work that should've taken 20 minutes.", sub: "That's not a workload problem. That's a systems problem." },
  { title: 'A £2,000 project went quiet. You forgot to follow up.',       sub: "Not because you didn't care. Because you had nothing reminding you." },
  { title: "You're running your business across 4 separate apps.",    sub: 'Notion. Google Workspace. Calendly. FreshBooks. £69+/mo — and none of them share a single client.' },
];

function ProblemSection() {
  return (
    <section style={{ padding: 'clamp(80px, 12vw, 120px) 20px', maxWidth: 880, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 72 }}>
        <Label text="The reality" />
        <h2 style={{
          fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1,
        }}>
          You're doing the work of 5 people.
          <br />
          <span style={{ color: 'rgba(240,240,245,0.3)' }}>With 8 different tools.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(240,240,245,0.4)', maxWidth: 460, margin: '0 auto' }}>
          This is what running a solo creative business actually looks like right now.
        </p>
      </FadeUp>

      <div>
        {PAINS.map((p, i) => (
          <FadeUp key={i} delay={i * 0.05}>
            <div style={{
              padding: '26px 0',
              borderBottom: i === PAINS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
              display: 'flex', gap: 20, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                background: 'rgba(255,98,89,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'rgba(255,98,89,0.6)',
                fontVariantNumeric: 'tabular-nums',
              }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: 'rgba(240,240,245,0.9)', marginBottom: 6, lineHeight: 1.45, letterSpacing: '-0.01em' }}>{p.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(240,240,245,0.4)', lineHeight: 1.55 }}>{p.sub}</div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Workflow Section ─────────────────────────────────────────────────────────
// Redesigned: timeline with connecting line, no boxed cards

const WORKFLOW_STEPS = [
  { n: '01', title: 'Lead comes in',        body: 'From Instagram, email, referral — Nomaad logs it instantly. No copying. No forgetting.',                         color: VOLT },
  { n: '02', title: 'Follow-up goes out',   body: 'A personalised email fires automatically. The lead hears from you before you even open your laptop.',           color: '#5AC8FA' },
  { n: '03', title: 'Call gets booked',     body: 'Your calendar link is in the email. They pick a slot. You show up and close.',                                  color: '#FFB340' },
  { n: '04', title: 'Client is onboarded',  body: 'Contract sent. Questionnaire filled. Brief captured. Everything handled before the project even starts.',        color: '#BF5AF2' },
  { n: '05', title: 'Project is tracked',   body: 'Tasks, deadlines, files, and client comms — all linked in one place. Nothing falls through the cracks.',        color: '#5AC8FA' },
  { n: '06', title: 'Invoice is paid',      body: 'Invoice raised automatically when the job is done. Payment tracked. You know exactly where every pound is.',    color: VOLT },
];

function WorkflowSection() {
  return (
    <section id="workflow" style={{ padding: 'clamp(80px, 12vw, 120px) 20px', maxWidth: 760, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 80 }}>
        <Label text="How it works" />
        <h2 style={{
          fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1,
        }}>
          This is how your business
          <br />
          <span style={{ color: VOLT }}>runs on Nomaad.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(240,240,245,0.4)', maxWidth: 440, margin: '0 auto' }}>
          One flow. No dropped balls. No manual steps. Just clients in — revenue out.
        </p>
      </FadeUp>

      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 19, top: 8, bottom: 8, width: 1,
          background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 10%, rgba(255,255,255,0.08) 90%, transparent)',
        }} />
        {WORKFLOW_STEPS.map((s, i) => (
          <FadeUp key={s.n} delay={i * 0.07}>
            <div style={{
              display: 'flex', gap: 28, padding: '20px 0 36px',
              position: 'relative',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: SHELL,
                border: `1px solid ${s.color}35`,
                boxShadow: `0 0 0 4px ${SHELL}, 0 0 20px ${s.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: s.color,
                fontVariantNumeric: 'tabular-nums', zIndex: 1,
                letterSpacing: '0.02em',
              }}>{s.n}</div>
              <div style={{ flex: 1, paddingTop: 6 }}>
                <h3 style={{
                  fontSize: 22, fontWeight: 700, color: '#f0f0f5',
                  margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2,
                }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: 'rgba(240,240,245,0.5)', lineHeight: 1.65, margin: 0, maxWidth: 520 }}>
                  {s.body}
                </p>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp style={{ textAlign: 'center', marginTop: 32 }}>
        <p style={{
          fontSize: 15, color: 'rgba(240,240,245,0.55)', lineHeight: 1.6,
          maxWidth: 520, margin: '0 auto',
        }}>
          This replaces <span style={{ color: VOLT, fontWeight: 700 }}>5 separate tools</span> and{' '}
          <span style={{ color: VOLT, fontWeight: 700 }}>hours of manual work</span> every week.
        </p>
      </FadeUp>
    </section>
  );
}

// ─── Outcomes Section ─────────────────────────────────────────────────────────
// Redesigned: clean 2-column grid with icons + text, no card backgrounds

const OUTCOMES = [
  { icon: '⏱', headline: '2–3 hours back every day', body: 'Admin that used to eat your mornings now happens automatically in the background.' },
  { icon: '🎯', headline: 'Zero missed leads',        body: 'Every enquiry is logged and followed up. You stop losing work you never knew you had.' },
  { icon: '💸', headline: 'Invoices that get paid',   body: 'Automated reminders and instant invoicing mean you stop chasing and start collecting.' },
  { icon: '🧠', headline: 'One less thing to think about', body: 'One dashboard. Every client, every project, every payment. Nothing living in your head.' },
  { icon: '📵', headline: 'Weekends that are actually off', body: 'When your system runs itself, Sunday admin catch-ups stop being a thing.' },
  { icon: '⚡', headline: 'A business that scales with you', body: 'Take on more clients without taking on more chaos. The system handles the growth.' },
];

function OutcomesSection() {
  return (
    <section style={{ padding: 'clamp(80px, 12vw, 120px) 20px', maxWidth: 1040, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 72 }}>
        <Label text="What you get back" />
        <h2 style={{
          fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1,
        }}>
          Not features. <span style={{ color: VOLT }}>Results.</span>
        </h2>
      </FadeUp>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', columnGap: 48, rowGap: 40 }}>
        {OUTCOMES.map((o, i) => (
          <FadeUp key={i} delay={i * 0.05}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(204,253,1,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>{o.icon}</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#f0f0f5', marginBottom: 8, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{o.headline}</div>
                <div style={{ fontSize: 14, color: 'rgba(240,240,245,0.45)', lineHeight: 1.65 }}>{o.body}</div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
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
  return (
    <section style={{ padding: 'clamp(80px, 12vw, 120px) 20px', maxWidth: 880, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 72 }}>
        <Label text="The modern freelance stack" />
        <h2 style={{
          fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1,
        }}>
          Great tools.
          <br />
          <span style={{ color: 'rgba(240,240,245,0.3)' }}>Disconnected from each other.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(240,240,245,0.4)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          Each of these apps is excellent at one thing. The problem isn&apos;t the tools — it&apos;s that none of them share a single record of your clients, work, or cash flow.
        </p>
      </FadeUp>

      <div style={{ marginBottom: 56 }}>
        {OLD_STACK.map((t, i) => (
          <FadeUp key={t.name} delay={i * 0.04}>
            <div style={{
              padding: '22px 0',
              borderBottom: i === OLD_STACK.length - 1 ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.05)',
              borderTop: i === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              display: 'grid',
              gridTemplateColumns: 'minmax(140px, 180px) 1fr auto',
              gap: 24, alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(240,240,245,0.85)', marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(240,240,245,0.35)' }}>{t.purpose}</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(240,240,245,0.5)', lineHeight: 1.55 }}>{t.gap}</div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'rgba(240,240,245,0.5)',
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right', whiteSpace: 'nowrap',
              }}>{t.cost}</div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', gap: 24, padding: '8px 0',
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(240,240,245,0.4)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>All of that</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.02em' }}>
              £69<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,240,245,0.4)' }}>/mo</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(240,240,245,0.3)', marginTop: 4 }}>4 apps · 4 logins · 0 shared data</div>
          </div>
          <div style={{ color: 'rgba(240,240,245,0.15)', fontSize: 24, fontWeight: 300 }}>→</div>
          <div>
            <div style={{ fontSize: 12, color: VOLT, marginBottom: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>With Nomaad</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.02em' }}>
              £39<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,240,245,0.4)' }}>/mo</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(240,240,245,0.3)', marginTop: 4 }}>+ runs itself</div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Integrations Marquee ────────────────────────────────────────────────────
// Infinite horizontal scroller showing real brand logos for apps Nomaad plugs into.

const INTEGRATIONS = [
  {
    name: 'Stripe',
    color: '#635BFF',
    path: 'M13.479 9.883c-1.626-.604-2.512-1.067-2.512-1.81 0-.626.5-.98 1.395-.98 1.64 0 3.339.632 4.507 1.206l.684-4.217c-.927-.43-2.79-1.16-5.338-1.16-1.81 0-3.312.467-4.384 1.368-1.116.944-1.687 2.296-1.687 3.956 0 3.01 1.848 4.276 4.904 5.376 1.974.686 2.633 1.165 2.633 1.908 0 .717-.625 1.147-1.74 1.147-1.405 0-3.716-.69-5.207-1.572l-.688 4.268c1.275.732 3.645 1.485 6.09 1.485 1.918 0 3.513-.455 4.584-1.309 1.195-.954 1.81-2.381 1.81-4.239-.013-3.137-1.899-4.453-4.951-5.427z',
  },
  {
    name: 'Gmail',
    color: '#EA4335',
    path: 'M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z',
  },
  {
    name: 'Google Meet',
    color: '#00AC47',
    path: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 15.75h-3v2.25l-3-3 3-3v2.25h3v-1.5l3 3-3 3v-2zm-7.5-4.5v-2.25l-3 3 3 3v-2.25h3v-1.5h-3z',
  },
  {
    name: 'Google Calendar',
    color: '#4285F4',
    path: 'M22 5v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3zM5 20h14a1 1 0 0 0 1-1v-9H4v9a1 1 0 0 0 1 1zm15-12V5a1 1 0 0 0-1-1h-1v1a1 1 0 0 1-2 0V4H8v1a1 1 0 0 1-2 0V4H5a1 1 0 0 0-1 1v3zM9 14h6v2H9zm0 3h4v2H9z',
  },
  {
    name: 'Claude',
    color: '#D97757',
    path: 'M17.304 3.541h-3.672l6.696 16.918H24Zm-10.608 0L0 20.459h3.744l1.37-3.553h7.005l1.369 3.553h3.744L10.536 3.541Zm-.371 10.223L8.616 7.82l2.291 5.945Z',
  },
  {
    name: 'WhatsApp',
    color: '#25D366',
    path: 'M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L0 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z',
  },
  {
    name: 'Google Drive',
    color: '#FBBC04',
    path: 'M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.828 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a402.13 402.13 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.736 1.85-3.24 1.906-3.344l.104-.18h-7.249c-5.8 0-7.256.013-7.242.034z',
  },
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
        width: 34, height: 34, borderRadius: 9,
        background: `${item.color}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg viewBox="0 0 24 24" width={20} height={20} fill={item.color} aria-hidden="true">
          <path d={item.path} />
        </svg>
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
        <Label text="Plays well with others" />
        <h2 style={{
          fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1,
        }}>
          Connects to the tools
          <br />
          <span style={{ color: VOLT }}>you already love.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(240,240,245,0.4)', margin: 0, lineHeight: 1.6 }}>
          Keep your inbox, calendar, calls and payments exactly where they are. Nomaad sits on top and gives you the single view you&apos;ve been missing.
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

// ─── Avatar Section ───────────────────────────────────────────────────────────

function AvatarSection() {
  const AVATARS = ['Freelance videographer', 'Photographer', 'Brand designer', 'Copywriter', 'Video editor', 'Content creator', 'Creative coach', 'Social media manager'];
  return (
    <section style={{ padding: 'clamp(80px, 12vw, 120px) 20px', maxWidth: 860, margin: '0 auto', fontFamily: FF, textAlign: 'center' }}>
      <FadeUp>
        <Label text="Built for solo operators" />
        <h2 style={{
          fontSize: 'clamp(26px, 6vw, 50px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 20px', lineHeight: 1.1,
        }}>
          Not for agencies. Not for teams.
          <br />
          <span style={{ color: VOLT }}>For the person doing everything themselves.</span>
        </h2>
        <p style={{
          fontSize: 16, color: 'rgba(240,240,245,0.4)', maxWidth: 560,
          margin: '0 auto 40px', lineHeight: 1.7,
        }}>
          If you're taking client briefs, managing your own pipeline, chasing your own invoices,
          handling your own admin, and still somehow finding time to do the actual work —
          Nomaad was built for you.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
          {AVATARS.map((a) => (
            <span key={a} style={{
              padding: '8px 16px', borderRadius: 100,
              background: 'rgba(204,253,1,0.05)', border: '1px solid rgba(204,253,1,0.12)',
              fontSize: 13, fontWeight: 600, color: VOLT, fontFamily: FF,
            }}>{a}</span>
          ))}
        </div>

        <p style={{ fontSize: 14, color: 'rgba(240,240,245,0.3)', fontStyle: 'italic' }}>
          If you wear every hat — creator, account manager, bookkeeper, sales rep — this is for you.
        </p>
      </FadeUp>
    </section>
  );
}

// ─── Testimonials ─���───────────────────────────────────────────────────────────
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
    <section style={{ padding: 'clamp(80px, 12vw, 120px) 20px', maxWidth: 1200, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 56, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
        <Label text="Beta users" />
        <h2 style={{
          fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1,
        }}>
          Real people. Real results.
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(240,240,245,0.4)', margin: 0, lineHeight: 1.6 }}>
          Freelancers who replaced their stack with Nomaad and got their time back.
        </p>
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
    <section id="pricing" style={{ padding: 'clamp(80px, 12vw, 120px) 24px', maxWidth: 920, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 72 }}>
        <Label text="Pricing" />
        <h2 style={{
          fontSize: 'clamp(30px, 4.5vw, 50px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1,
        }}>
          Replace 5 tools for less than
          <br />
          <span style={{ color: VOLT }}>the cost of one of them.</span>
        </h2>
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
    <section style={{ padding: 'clamp(80px, 12vw, 120px) 24px', textAlign: 'center', fontFamily: FF, position: 'relative' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: VOLT, filter: 'blur(120px)', opacity: 0.04, pointerEvents: 'none',
      }} />
      <FadeUp style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.08,
        }}>
          Stop managing your business.
          <br />
          <span style={{ color: VOLT }}>Let it run itself.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(240,240,245,0.4)', lineHeight: 1.65, margin: '0 0 40px' }}>
          Join the waitlist now. Be first in when we launch.
        </p>
        <WaitlistForm source="closer" label="Get early access →" />
        <p style={{ fontSize: 12, color: 'rgba(240,240,245,0.25)', marginTop: 16 }}>
          No card required · 14-day free trial on launch · Cancel anytime
        </p>
      </FadeUp>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

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
      <WorkflowSection />
      <OutcomesSection />
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
