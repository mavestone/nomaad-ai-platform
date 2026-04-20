/**
 * LandingPage.jsx — Nomaad
 * High-conversion, outcome-driven. No features. Just workflows and results.
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
      letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14, margin: '0 0 14px',
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
        padding: '0 16px' // give padding to prevent full stretch on very small screens
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
          .landing-nav-center {
            display: none;
          }
          .landing-brand-text {
            display: none;
          }
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
          <span style={{ fontSize: 12, fontWeight: 600, color: VOLT, letterSpacing: '0.04em' }}>NOW IN BETA · WAITLIST OPEN</span>
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

const PAINS = [
  {
    title: 'You copied a lead from Instagram into a spreadsheet. Again.',
    sub: 'Manual data entry is not a business system.',
  },
  {
    title: 'A client emailed 3 days ago. You still haven\'t replied.',
    sub: 'Buried in your inbox under 200 other things.',
  },
  {
    title: 'Your invoices are in one app, your notes in another, your tasks somewhere else.',
    sub: 'Nothing talks to anything. Every job starts with 20 minutes of admin.',
  },
  {
    title: 'You spent Sunday catching up on work that should\'ve taken 20 minutes.',
    sub: 'That\'s not a workload problem. That\'s a systems problem.',
  },
  {
    title: 'A £2,000 project went quiet. You forgot to follow up.',
    sub: 'Not because you didn\'t care. Because you had nothing reminding you.',
  },
  {
    title: 'You\'re paying for 5 tools that don\'t talk to each other.',
    sub: 'Notion. Sheets. Calendly. FreshBooks. Gmail. £150+/mo for chaos.',
  },
];

function ProblemSection() {
  return (
    <section style={{ padding: 'clamp(60px, 10vw, 100px) 20px', maxWidth: 1080, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 60 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {PAINS.map((p, i) => (
          <FadeUp key={i} delay={i * 0.05}>
            <div style={{
              padding: '22px 24px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              borderLeft: '2px solid rgba(255,98,89,0.3)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(240,240,245,0.75)', marginBottom: 6, lineHeight: 1.45 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,245,0.3)', lineHeight: 1.55 }}>{p.sub}</div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Workflow Section ─────────────────────────────────────────────────────────

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
    <section id="workflow" style={{ padding: 'clamp(60px, 10vw, 100px) 20px', maxWidth: 1080, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 2 }}>
        {WORKFLOW_STEPS.map((s, i) => (
          <FadeUp key={s.n} delay={i * 0.07}>
            <div style={{
              padding: '28px 26px',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.018)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 18, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${s.color}60, transparent)`,
              }} />
              <div style={{
                fontSize: 10, fontWeight: 800, color: s.color,
                letterSpacing: '0.12em', marginBottom: 14,
              }}>STEP {s.n}</div>
              <h3 style={{
                fontSize: 20, fontWeight: 700, color: '#f0f0f5',
                margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(240,240,245,0.4)', lineHeight: 1.65, margin: 0 }}>
                {s.body}
              </p>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp style={{ textAlign: 'center', marginTop: 48 }}>
        <div style={{
          display: 'inline-block', padding: '14px 28px', borderRadius: 16,
          background: 'rgba(204,253,1,0.05)', border: '1px solid rgba(204,253,1,0.15)',
          fontSize: 14, color: 'rgba(240,240,245,0.6)', lineHeight: 1.6,
        }}>
          This replaces <span style={{ color: VOLT, fontWeight: 700 }}>5 separate tools</span> and{' '}
          <span style={{ color: VOLT, fontWeight: 700 }}>hours of manual work</span> every week.
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Outcomes Section ─────────────────────────────────────────────────────────

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
    <section style={{ padding: 'clamp(60px, 10vw, 100px) 20px', maxWidth: 1080, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 60 }}>
        <Label text="What you get back" />
        <h2 style={{
          fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1,
        }}>
          Not features. <span style={{ color: VOLT }}>Results.</span>
        </h2>
      </FadeUp>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {OUTCOMES.map((o, i) => (
          <FadeUp key={i} delay={i * 0.05}>
            <div style={{
              padding: '26px 24px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, display: 'flex', gap: 16, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'rgba(204,253,1,0.07)', border: '1px solid rgba(204,253,1,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>{o.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', marginBottom: 6, lineHeight: 1.3 }}>{o.headline}</div>
                <div style={{ fontSize: 13, color: 'rgba(240,240,245,0.4)', lineHeight: 1.6 }}>{o.body}</div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Stack Section ────────────────────────────────────────────────────────────

const OLD_STACK = [
  { name: 'Notion',      purpose: 'Notes & tasks',       cost: '£16/mo', pain: "Can't invoice. Can't track leads. Just more tabs." },
  { name: 'FreshBooks',  purpose: 'Invoicing',           cost: '£29/mo', pain: "£29/mo for a PDF maker. Doesn't know who your clients are." },
  { name: 'Calendly',    purpose: 'Booking calls',       cost: '£12/mo', pain: 'Another login. Another app. Doesn\'t follow up automatically.' },
  { name: 'Gmail',       purpose: 'Client comms',        cost: 'Free',   pain: 'Follow-ups buried in threads. Leads going cold in your inbox.' },
  { name: 'Sheets',      purpose: 'Finance tracking',    cost: 'Free',   pain: 'Updated once a quarter. Usually wrong. Zero automation.' },
  { name: 'WhatsApp',    purpose: 'Client chat',         cost: 'Free',   pain: 'Revision requests at 11pm. Work and life fully merged.' },
];

function StackSection() {
  return (
    <section style={{ padding: 'clamp(60px, 10vw, 100px) 20px', maxWidth: 1080, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 56 }}>
        <Label text="Replace your stack" />
        <h2 style={{
          fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1,
        }}>
          Stop paying for 5 tools
          <br />
          <span style={{ color: 'rgba(240,240,245,0.3)' }}>that don't talk to each other.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(240,240,245,0.4)', maxWidth: 420, margin: '0 auto' }}>
          You're cobbling together a business from tools that were never designed to work together.
        </p>
      </FadeUp>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10, marginBottom: 32 }}>
        {OLD_STACK.map((t, i) => (
          <FadeUp key={t.name} delay={i * 0.04}>
            <div style={{
              padding: '18px 20px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                padding: '3px 8px', borderRadius: 8, flexShrink: 0,
                background: 'rgba(255,98,89,0.08)', border: '1px solid rgba(255,98,89,0.15)',
                fontSize: 11, fontWeight: 700, color: 'rgba(255,98,89,0.7)',
              }}>{t.cost}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,240,245,0.7)' }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(240,240,245,0.3)' }}>· {t.purpose}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(240,240,245,0.3)', lineHeight: 1.55 }}>{t.pain}</div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp>
        <div style={{
          padding: '28px 32px', borderRadius: 18,
          background: 'rgba(204,253,1,0.04)', border: '1px solid rgba(204,253,1,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(240,240,245,0.4)', marginBottom: 6 }}>All of that 👆</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f5' }}>
              £57–£100<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,240,245,0.4)' }}>/mo + 3 hours/day wasted</span>
            </div>
          </div>
          <div style={{ color: 'rgba(240,240,245,0.2)', fontSize: 28, fontWeight: 300 }}>→</div>
          <div>
            <div style={{ fontSize: 13, color: VOLT, marginBottom: 6, fontWeight: 600 }}>Replace it all with Nomaad</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f5' }}>
              £39<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,240,245,0.4)' }}>/mo + runs itself</span>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Avatar Section ───────────────────────────────────────────────────────────

const AVATARS = [
  'Freelance videographer',
  'Photographer',
  'Brand designer',
  'Copywriter',
  'Video editor',
  'Content creator',
  'Creative coach',
  'Social media manager',
];

function AvatarSection() {
  return (
    <section style={{ padding: 'clamp(60px, 10vw, 80px) 20px 100px', maxWidth: 860, margin: '0 auto', fontFamily: FF, textAlign: 'center' }}>
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
              background: 'rgba(204,253,1,0.06)', border: '1px solid rgba(204,253,1,0.15)',
              fontSize: 13, fontWeight: 600, color: VOLT,
              fontFamily: FF,
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

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "I had invoices lost in Gmail threads for months. First month on Nomaad I got paid 3 weeks faster — purely because everything was in one place.",
    name: 'Jake T.',
    role: 'Freelance Videographer · London',
    metric: 'Paid 3 weeks faster',
    color: VOLT,
  },
  {
    quote: "Cancelled Notion, Toggl, and FreshBooks in the same week. Saving £65/mo and actually understand my cash flow for the first time.",
    name: 'Priya S.',
    role: 'Brand Designer · Manchester',
    metric: '£65/mo saved, 3 tools gone',
    color: '#5AC8FA',
  },
  {
    quote: "My clients check the portal instead of WhatsApping me at 11pm. I can't overstate how much that changed my evenings.",
    name: 'Marcus R.',
    role: 'Photographer · Bristol',
    metric: 'Zero late-night messages',
    color: '#FFB340',
  },
];

function TestimonialsSection() {
  return (
    <section style={{ padding: 'clamp(40px, 10vw, 60px) 20px 80px', maxWidth: 1080, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 48 }}>
        <Label text="Beta users" />
        <h2 style={{
          fontSize: 'clamp(26px, 6vw, 46px)', fontWeight: 800,
          color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1,
        }}>
          Real people. Real results.
        </h2>
      </FadeUp>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {TESTIMONIALS.map((t, i) => (
          <FadeUp key={t.name} delay={i * 0.08}>
            <div style={{
              padding: '28px 26px', borderRadius: 20,
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', flexDirection: 'column', gap: 18,
              height: '100%', boxSizing: 'border-box',
            }}>
              <div style={{
                display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 100,
                background: `${t.color}15`, border: `1px solid ${t.color}25`,
                color: t.color, fontSize: 11, fontWeight: 700,
              }}>
                <span style={{ fontSize: 9 }}>✦</span>{t.metric}
              </div>
              <p style={{ fontSize: 14, color: 'rgba(240,240,245,0.6)', lineHeight: 1.75, margin: 0, flex: 1, fontStyle: 'italic' }}>
                "{t.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: `${t.color}20`, border: `1px solid ${t.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: t.color,
                }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,245,0.85)' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,240,245,0.3)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Founder Note ─────────────────────────────────────────────────────────────

function FounderNote() {
  return (
    <section style={{ padding: '20px 24px 80px', maxWidth: 680, margin: '0 auto', fontFamily: FF }}>
      <FadeUp>
        <div style={{
          padding: '36px 36px 32px', borderRadius: 22,
          background: 'rgba(204,253,1,0.03)', border: '1px solid rgba(204,253,1,0.1)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, rgba(204,253,1,0.3), transparent)`,
          }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(204,253,1,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            Why we built this
          </p>
          <p style={{ fontSize: 15, color: 'rgba(240,240,245,0.55)', lineHeight: 1.8, margin: '0 0 24px' }}>
            I spent more time updating spreadsheets and chasing invoices than actually doing the work I was hired for.
            Every tool I tried was built for a 10-person agency — not for one person trying to do everything.
            So I stopped looking and built the thing I needed.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(204,253,1,0.15)', border: '1px solid rgba(204,253,1,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: VOLT,
            }}>N</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f5' }}>Nomaad team</div>
              <div style={{ fontSize: 11, color: 'rgba(240,240,245,0.3)' }}>Freelancers who got tired of bad tooling</div>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Creator',
    price: '£39',
    period: '/mo',
    desc: 'Everything you need to run your solo business without the chaos.',
    featured: true,
    features: [
      'Client pipeline & CRM',
      'Automated follow-ups',
      'Projects & task tracking',
      'Invoicing & payment tracking',
      'Client portal',
      'Calendar & scheduling',
      'AI assistant',
    ],
  },
  {
    name: 'Studio',
    price: '£89',
    period: '/mo',
    desc: 'For small creative studios growing beyond one person.',
    featured: false,
    features: [
      'Everything in Creator',
      'Up to 5 team members',
      'Shared pipeline & projects',
      'Team calendar',
      'Priority support',
      'Custom branding',
    ],
  },
];

function PricingSection() {
  return (
    <section id="pricing" style={{ padding: '80px 24px 100px', maxWidth: 860, margin: '0 auto', fontFamily: FF }}>
      <FadeUp style={{ textAlign: 'center', marginBottom: 56 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, alignItems: 'start' }}>
        {PLANS.map((plan, i) => (
          <FadeUp key={plan.name} delay={i * 0.08}>
            <div style={{
              padding: '32px 28px', borderRadius: 22,
              background: plan.featured ? 'rgba(204,253,1,0.04)' : 'rgba(255,255,255,0.02)',
              border: plan.featured ? `1px solid rgba(204,253,1,0.2)` : '1px solid rgba(255,255,255,0.07)',
              position: 'relative', overflow: 'hidden',
              transform: plan.featured ? 'translateY(-8px)' : 'none',
              boxShadow: plan.featured ? `0 0 60px rgba(204,253,1,0.06)` : 'none',
            }}>
              {plan.featured && (
                <div style={{ position: 'absolute', top: 0, left: 28, right: 28, height: 2, background: `linear-gradient(90deg, transparent, ${VOLT}, transparent)` }} />
              )}
              {plan.featured && (
                <div style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 100,
                  background: 'rgba(204,253,1,0.12)', color: VOLT,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 16,
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
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                  background: plan.featured ? `linear-gradient(135deg, ${VOLT}, ${VOLTD})` : 'rgba(255,255,255,0.07)',
                  color: plan.featured ? '#0a0a0a' : 'rgba(240,240,245,0.7)',
                  fontWeight: 700, fontSize: 14, fontFamily: FF, cursor: 'pointer',
                  boxShadow: plan.featured ? `0 4px 24px rgba(204,253,1,0.2)` : 'none',
                }}
              >
                {plan.featured ? 'Join the waitlist' : 'Get early access'}
              </motion.button>
              {plan.featured && (
                <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(240,240,245,0.3)', margin: '10px 0 0', fontFamily: FF }}>
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
    <section style={{ padding: '80px 24px 120px', textAlign: 'center', fontFamily: FF, position: 'relative' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: VOLT, filter: 'blur(120px)', opacity: 0.04, pointerEvents: 'none',
      }} />
      <FadeUp style={{ maxWidth: 680, margin: '0 auto' }}>
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
