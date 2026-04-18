/**
 * prospecting-view.jsx
 *
 * Tab 0 — Find Clients    Explorium-powered prospect search
 * Tab 1 — Find Creators   Nomaad community, LinkedIn-style + portfolio
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Plus, Briefcase, MapPin, Building2, X, Sparkles, Users,
  Check, Loader, AlertCircle, ArrowLeft, UserPlus, Camera, Edit3,
  Film, Palette, Star, Target, Mail, ExternalLink, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const ease = 'all 0.26s cubic-bezier(.4,0,.2,1)';

// ─── Shared helpers ────────────────────────────────────────────────────────

function selSt(t) {
  return { width: '100%', padding: '7px 9px', borderRadius: 9, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 11, fontWeight: 500, outline: 'none', cursor: 'pointer', boxSizing: 'border-box', fontFamily: 'inherit' };
}
function inpSt(t) {
  return { width: '100%', padding: '7px 9px', borderRadius: 9, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
}
function FilterLabel({ t, text, mt = 10 }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5, marginTop: mt }}>{text}</div>;
}
function Chip({ active, label, onClick, t, dark }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? (dark ? '#CCFD01' : '#84cc16') : t.inputBorder}`, background: active ? (dark ? 'rgba(204,253,1,0.13)' : 'rgba(132,204,22,0.12)') : t.input, color: active ? (dark ? '#CCFD01' : '#365314') : t.sub, transition: ease, whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}
function Toggle({ on, onToggle, label, t, dark }) {
  return (
    <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0', fontFamily: 'inherit' }}>
      <div style={{ width: 28, height: 16, borderRadius: 8, background: on ? (dark ? '#CCFD01' : '#84cc16') : t.inputBorder, position: 'relative', transition: ease, flexShrink: 0 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: on ? 14 : 2, transition: ease, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <span style={{ fontSize: 11, color: on ? (dark ? '#CCFD01' : '#365314') : t.sub, fontWeight: on ? 600 : 400 }}>{label}</span>
    </button>
  );
}

function SkeletonRows({ t, n = 8 }) {
  return Array.from({ length: n }).map((_, i) => (
    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: `1px solid ${t.divider}` }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ width: '40%', height: 11, borderRadius: 6, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite 0.08s' }} />
        <div style={{ width: '62%', height: 9,  borderRadius: 6, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite 0.16s' }} />
      </div>
      <div style={{ width: 56, height: 9, borderRadius: 6, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: 30, height: 30, borderRadius: 8, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite' }} />
    </div>
  ));
}

function SetupBanner({ t, dark }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: dark ? 'rgba(204,253,1,0.08)' : 'rgba(132,204,22,0.08)', border: `1px solid ${dark ? 'rgba(204,253,1,0.15)' : 'rgba(132,204,22,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <Sparkles size={22} color={dark ? '#CCFD01' : '#4d7c0f'} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 8 }}>Connect Vibe Prospecting</div>
      <div style={{ fontSize: 12, color: t.sub, lineHeight: 1.65, maxWidth: 280, margin: '0 auto 18px' }}>
        Add <strong style={{ color: t.text }}>EXPLORIUM_API_KEY</strong> to Vercel environment variables.
      </div>
      <div style={{ background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 11, padding: '11px 14px', textAlign: 'left', fontFamily: 'monospace', fontSize: 11, color: t.sub, lineHeight: 2, maxWidth: 300, margin: '0 auto' }}>
        <div>1. Vercel → Project → Settings</div>
        <div>2. Environment Variables → Add New</div>
        <div>3. <span style={{ color: dark ? '#CCFD01' : '#365314', fontWeight: 700 }}>EXPLORIUM_API_KEY</span> = your key</div>
        <div>4. Redeploy</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 0 — Find Clients
// ─────────────────────────────────────────────────────────────────────────────

const JOB_LEVELS = [
  { id: 'cxo',      label: 'C-Suite'  },
  { id: 'vp',       label: 'VP'       },
  { id: 'director', label: 'Director' },
  { id: 'manager',  label: 'Manager'  },
  { id: 'owner',    label: 'Owner'    },
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'];

const COUNTRIES = [
  { code: '',   label: 'Anywhere'        },
  { code: 'US', label: 'United States'   },
  { code: 'GB', label: 'United Kingdom'  },
  { code: 'CA', label: 'Canada'          },
  { code: 'AU', label: 'Australia'       },
  { code: 'IE', label: 'Ireland'         },
  { code: 'DE', label: 'Germany'         },
  { code: 'FR', label: 'France'          },
  { code: 'NL', label: 'Netherlands'     },
  { code: 'SE', label: 'Sweden'          },
  { code: 'SG', label: 'Singapore'       },
  { code: 'AE', label: 'UAE'             },
  { code: 'NZ', label: 'New Zealand'     },
];

// Smart autocomplete hook — queries /api/prospect/autocomplete
function useAutocomplete(field, delay = 350) {
  const [query, setQuery]       = useState('');
  const [options, setOptions]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const timerRef                = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2) { setOptions([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/prospect/autocomplete?field=${field}&query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setOptions(Array.isArray(data) ? data.slice(0, 8) : []);
        }
      } catch {}
      finally { setLoading(false); }
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [query, field, delay]);

  return { query, setQuery, options, setOptions, loading };
}

// Autocomplete input component
function AutocompleteInput({ field, placeholder, onSelect, selected, onClear, t, dark }) {
  const { query, setQuery, options, setOptions, loading } = useAutocomplete(field);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (selected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 9, border: `1px solid ${dark ? '#CCFD01' : '#84cc16'}`, background: dark ? 'rgba(204,253,1,0.1)' : 'rgba(132,204,22,0.1)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: dark ? '#CCFD01' : '#365314', flex: 1 }}>{selected}</span>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: dark ? '#CCFD01' : '#365314', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={11} /></button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{ ...inpSt(t) }}
        />
        {loading && <Loader size={11} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: t.muted, animation: 'nomSpin 1s linear infinite' }} />}
      </div>
      {open && options.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: dark ? '#1c1c22' : '#ffffff', border: `1px solid ${t.cardBorder}`, borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.28)', zIndex: 200, overflow: 'hidden' }}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => { onSelect(opt.label); setQuery(''); setOptions([]); setOpen(false); }}
              style={{ padding: '9px 12px', fontSize: 12, color: dark ? '#e8e8e8' : '#1a1a1f', cursor: 'pointer', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`, transition: ease, background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.07)' : '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Normalise any Explorium linkedin field shape → full https URL */
function toLinkedInUrl(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (s.startsWith('https://')) return s;
  if (s.startsWith('http://'))  return s.replace('http://', 'https://');
  if (s.startsWith('www.linkedin.com')) return `https://${s}`;
  if (s.startsWith('linkedin.com'))     return `https://www.${s}`;
  if (s.startsWith('/in/'))             return `https://www.linkedin.com${s}`;
  if (s.includes('linkedin.com'))       return `https://${s.replace(/^https?:\/\//, '')}`;
  // bare username — wrap it
  return `https://www.linkedin.com/in/${s}`;
}

function ProspectDetail({ p, isAdded, adding, onClose, onAdd, t, dark, compact }) {
  const initials = (p.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const linkedInHref = toLinkedInUrl(p.linkedin_url);
  const infoRows = [
    { icon: <Building2 size={13} />, label: 'Company',    val: p.company_name },
    { icon: <Briefcase size={13} />, label: 'Department', val: p.job_department },
    { icon: <MapPin size={13} />,    label: 'Location',   val: p.location },
    { icon: <Users size={13} />,     label: 'Company size', val: p.company_size },
  ].filter(r => r.val);

  // On compact/mobile: overlay the results panel absolutely
  const panelStyle = compact
    ? { position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', zIndex: 50, background: dark ? '#14141a' : '#ffffff', border: `1px solid ${t.cardBorder}`, borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.4)', backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'nomSlide 0.22s cubic-bezier(.4,0,.2,1)' }
    : { width: 290, flexShrink: 0, background: dark ? '#14141a' : '#ffffff', border: `1px solid ${t.cardBorder}`, borderRadius: 18, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'nomSlide 0.22s cubic-bezier(.4,0,.2,1)' };

  return (
    <div style={panelStyle}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dark ? 'rgba(204,253,1,0.03)' : 'rgba(132,204,22,0.04)' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>Prospect Details</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.muted, cursor: 'pointer', display: 'flex', padding: 3, borderRadius: 5 }}><X size={14} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: t.accentText, flexShrink: 0, boxShadow: t.accentGlow }}>{initials}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{p.full_name}</div>
            <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>{p.job_title}</div>
            {linkedInHref && (
              <a href={linkedInHref} target="_blank" rel="noreferrer"
                style={{ fontSize: 10, color: '#0A66C2', display: 'flex', alignItems: 'center', gap: 3, marginTop: 3, textDecoration: 'none' }}>
                <ExternalLink size={9} /> View LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* Info rows */}
        {infoRows.map(row => (
          <div key={row.label} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: t.input, border: `1px solid ${t.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted, flexShrink: 0 }}>{row.icon}</div>
            <div>
              <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{row.label}</div>
              <div style={{ fontSize: 12, color: t.text, fontWeight: 500, marginTop: 1 }}>{row.val}</div>
            </div>
          </div>
        ))}

        {/* Availability badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, background: p.has_email ? (dark ? 'rgba(52,199,89,0.1)' : '#f0fdf4') : t.input, border: `1px solid ${p.has_email ? (dark ? 'rgba(52,199,89,0.3)' : '#bbf7d0') : t.inputBorder}`, fontSize: 10, fontWeight: 600, color: p.has_email ? '#34C759' : t.muted }}>
            <Mail size={9} /> {p.has_email ? 'Email available' : 'No email'}
          </div>
        </div>

        {/* Skills */}
        {p.skills?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {p.skills.slice(0, 6).map(skill => (
                <span key={skill} style={{ padding: '3px 7px', borderRadius: 6, background: t.input, border: `1px solid ${t.inputBorder}`, fontSize: 10, color: t.sub }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>Experience</div>
            {p.experience.slice(0, 3).map((exp, i) => (
              <div key={i} style={{ fontSize: 11, color: t.sub, marginBottom: 4, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: t.text }}>{exp.title || exp.job_title || ''}</span>
                {exp.company_name ? ` · ${exp.company_name}` : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.divider}` }}>
        {isAdded ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 11, background: dark ? 'rgba(52,199,89,0.1)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(52,199,89,0.25)' : '#bbf7d0'}`, color: '#34C759', fontSize: 13, fontWeight: 700 }}>
            <Check size={14} /> Added to Pipeline
          </div>
        ) : (
          <button onClick={onAdd} disabled={adding} style={{ width: '100%', padding: '10px', borderRadius: 11, border: 'none', background: t.accentGrad, color: t.accentText, fontSize: 13, fontWeight: 700, cursor: adding ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: t.accentGlow, opacity: adding ? 0.6 : 1, transition: ease }}>
            {adding ? <><Loader size={13} style={{ animation: 'nomSpin 1s linear infinite' }} /> Adding…</> : <><Plus size={13} /> Add to Pipeline</>}
          </button>
        )}
      </div>
    </div>
  );
}

function FindClientsTab({ t, dark, compact }) {
  const { user } = useAuth();

  // Filters
  const [industry, setIndustry]       = useState('');
  const [levels, setLevels]           = useState([]);
  const [jobTitle, setJobTitle]       = useState('');
  const [relatedTitles, setRelated]   = useState(true);
  const [country, setCountry]         = useState('');
  const [sizes, setSizes]             = useState([]);
  const [hasEmail, setHasEmail]       = useState(false);
  const [limit, setLimit]             = useState(25);

  // Results
  const [results, setResults]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [searched, setSearched] = useState(false);

  // Detail
  const [selected, setSelected] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const [adding, setAdding]     = useState(false);

  const toggleLevel = id => setLevels(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  const toggleSize  = s  => setSizes( prev => prev.includes(s)  ? prev.filter(x => x !== s)  : [...prev, s]);

  const runSearch = useCallback(async (pg = 1) => {
    setLoading(true); setError(null); setSearched(true); setSelected(null);
    if (pg === 1) setResults([]);

    const filters = {};
    if (industry)       filters.linkedin_category = [industry];
    if (levels.length)  filters.job_level = levels;
    if (jobTitle)       { filters.job_title = jobTitle; filters.include_related = relatedTitles; }
    if (country)        filters.country_code = country;
    if (sizes.length)   filters.company_size = sizes;
    if (hasEmail)       filters.has_email = true;

    try {
      const res  = await fetch('/api/prospect/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filters, limit, page: pg }) });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) setError({ type: 'credits', msg: data.error });
        else setError({ type: data.setup_required ? 'setup' : 'api', msg: data.error });
        return;
      }
      setResults(data.prospects || []);
      setTotal(data.total || 0);
      setPages(data.total_pages || 1);
      setPage(pg);
    } catch (e) { setError({ type: 'network', msg: e.message }); }
    finally { setLoading(false); }
  }, [industry, levels, jobTitle, relatedTitles, country, sizes, hasEmail, limit]);

  const handleAdd = useCallback(async (prospect) => {
    if (!user || adding) return;
    setAdding(true);
    try {
      const { error: err } = await supabase.from('prospects').insert([{
        user_id:  user.id,
        name:     prospect.full_name,
        company:  prospect.company_name,
        role:     prospect.job_title,
        location: prospect.location,
        notes:    `Sourced via Vibe Prospecting.${prospect.skills?.length ? ' Skills: ' + prospect.skills.join(', ') + '.' : ''}`,
        source:   'vibe-prospecting',
        stage:    'lead',
        value:    0,
      }]);
      if (!err) setAddedIds(prev => new Set([...prev, prospect.id]));
    } finally { setAdding(false); }
  }, [user, adding]);

  const selId = selected?.id;

  return (
    <div style={{ display: 'flex', flex: 1, gap: 14, minHeight: 0 }}>

      {/* ── Filter sidebar ─────────────────────────────────────────────── */}
      <div style={{ width: compact ? 210 : 250, flexShrink: 0, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, padding: '16px 14px', boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: 0 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: t.accentGlow }}>
            <Target size={13} color={t.accentText} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>Find Clients</div>
        </div>

        <FilterLabel t={t} text="Industry" mt={0} />
        <AutocompleteInput
          field="linkedin_category"
          placeholder="Search industries…"
          selected={industry}
          onSelect={setIndustry}
          onClear={() => setIndustry('')}
          t={t} dark={dark}
        />

        <FilterLabel t={t} text="Job Title" />
        <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch(1)} placeholder="e.g. Creative Director" style={{ ...inpSt(t), marginBottom: 5 }} />
        {jobTitle && <Toggle on={relatedTitles} onToggle={() => setRelated(v => !v)} label="Include related titles" t={t} dark={dark} />}

        <FilterLabel t={t} text="Seniority" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {JOB_LEVELS.map(l => <Chip key={l.id} active={levels.includes(l.id)} label={l.label} onClick={() => toggleLevel(l.id)} t={t} dark={dark} />)}
        </div>

        <FilterLabel t={t} text="Country" />
        <select value={country} onChange={e => setCountry(e.target.value)} style={selSt(t)}>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>

        <FilterLabel t={t} text="Company Size" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {COMPANY_SIZES.map(s => <Chip key={s} active={sizes.includes(s)} label={s} onClick={() => toggleSize(s)} t={t} dark={dark} />)}
        </div>

        <FilterLabel t={t} text="Contact Info" />
        <Toggle on={hasEmail} onToggle={() => setHasEmail(v => !v)} label="Has email available" t={t} dark={dark} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: t.sub, fontWeight: 600 }}>Results</span>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: 7, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 11, outline: 'none', cursor: 'pointer' }}>
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <button onClick={() => runSearch(1)} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: 12, border: 'none', background: loading ? t.input : t.accentGrad, color: loading ? t.sub : t.accentText, fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: loading ? 'none' : t.accentGlow, transition: ease }}>
          {loading ? <><Loader size={13} style={{ animation: 'nomSpin 1s linear infinite' }} /> Searching…</> : <><Search size={13} /> Search</>}
        </button>

        <div style={{ textAlign: 'center', fontSize: 10, color: t.muted, marginTop: 10 }}>
          Powered by <span style={{ fontWeight: 600 }}>Vibe Prospecting</span>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: ease, position: 'relative' }}>

        {/* Header */}
        <div style={{ padding: '13px 18px', borderBottom: `1px solid ${t.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Prospects</div>
            <div style={{ fontSize: 11, color: t.sub, marginTop: 1 }}>
              {!searched ? 'Set your filters and search' : loading ? 'Searching database…' : `${total.toLocaleString()} match${total !== 1 ? 'es' : ''}${pages > 1 ? ` · page ${page} of ${pages}` : ''}`}
            </div>
          </div>
          {addedIds.size > 0 && (
            <div style={{ fontSize: 11, color: '#34C759', background: dark ? 'rgba(52,199,89,0.1)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(52,199,89,0.25)' : '#bbf7d0'}`, padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
              {addedIds.size} added
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {error?.type === 'setup' && <SetupBanner t={t} dark={dark} />}

          {error?.type === 'credits' && (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 6 }}>Explorium credits used up</div>
              <div style={{ fontSize: 12, color: t.sub, lineHeight: 1.65, maxWidth: 260, margin: '0 auto 14px' }}>
                Your Explorium account has no remaining search credits. Credits reset on your billing cycle.
              </div>
              <a href="https://app.explorium.ai" target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '7px 16px', borderRadius: 9, background: dark ? 'rgba(204,253,1,0.1)' : 'rgba(132,204,22,0.1)', border: `1px solid ${dark ? 'rgba(204,253,1,0.25)' : 'rgba(132,204,22,0.3)'}`, color: dark ? '#CCFD01' : '#365314', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                Check Explorium account →
              </a>
            </div>
          )}
          {(error?.type === 'api' || error?.type === 'network') && (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <AlertCircle size={26} style={{ color: '#FF6259', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 5 }}>Search failed</div>
              <div style={{ fontSize: 12, color: t.sub }}>{error.msg}</div>
            </div>
          )}

          {loading && <SkeletonRows t={t} n={10} />}

          {!loading && !error && searched && results.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Users size={26} style={{ color: t.muted, margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 5 }}>No results</div>
              <div style={{ fontSize: 12, color: t.sub }}>Try broadening your filters or removing the email requirement</div>
            </div>
          )}

          {!searched && !loading && (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: dark ? 'rgba(204,253,1,0.07)' : 'rgba(132,204,22,0.07)', border: `1px solid ${dark ? 'rgba(204,253,1,0.13)' : 'rgba(132,204,22,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Target size={22} color={dark ? '#CCFD01' : '#4d7c0f'} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 7 }}>Find your ideal clients</div>
              <div style={{ fontSize: 12, color: t.sub, lineHeight: 1.65, maxWidth: 260, margin: '0 auto' }}>
                Search by industry, job title and seniority to surface decision-makers from 400M+ professionals.
              </div>
            </div>
          )}

          {!loading && results.map(p => {
            const isAdded = addedIds.has(p.id);
            const isSel   = selId === p.id;
            return (
              <div key={p.id} onClick={() => setSelected(isSel ? null : p)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: `1px solid ${t.divider}`, cursor: 'pointer', background: isSel ? (dark ? 'rgba(204,253,1,0.05)' : 'rgba(132,204,22,0.05)') : 'transparent', transition: ease }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: t.accentText, flexShrink: 0 }}>
                  {(p.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {p.full_name}
                    {p.has_email && <Mail size={10} style={{ color: '#34C759', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 11, color: t.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {p.job_title}{p.company_name ? ` · ${p.company_name}` : ''}
                  </div>
                </div>
                {p.location && (
                  <div style={{ fontSize: 10, color: t.muted, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <MapPin size={9} />{p.city || p.location.split(',')[0]}
                  </div>
                )}
                <button onClick={e => { e.stopPropagation(); if (!isAdded) handleAdd(p); }}
                  style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: `1px solid ${isAdded ? (dark ? 'rgba(52,199,89,0.4)' : '#bbf7d0') : t.inputBorder}`, background: isAdded ? (dark ? 'rgba(52,199,89,0.12)' : '#f0fdf4') : t.input, color: isAdded ? '#34C759' : t.sub, cursor: isAdded ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: ease }}>
                  {isAdded ? <Check size={13} /> : <Plus size={13} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {pages > 1 && !loading && searched && (
          <div style={{ padding: '11px 18px', borderTop: `1px solid ${t.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => runSearch(page - 1)} disabled={page <= 1} style={{ padding: '6px 14px', borderRadius: 9, border: `1px solid ${t.inputBorder}`, background: t.input, color: page <= 1 ? t.muted : t.text, fontSize: 12, fontWeight: 600, cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>← Prev</button>
            <span style={{ fontSize: 11, color: t.sub }}>Page {page} of {pages}</span>
            <button onClick={() => runSearch(page + 1)} disabled={page >= pages} style={{ padding: '6px 14px', borderRadius: 9, border: `1px solid ${t.inputBorder}`, background: t.input, color: page >= pages ? t.muted : t.text, fontSize: 12, fontWeight: 600, cursor: page >= pages ? 'default' : 'pointer', opacity: page >= pages ? 0.5 : 1 }}>Next →</button>
          </div>
        )}
      </div>

      {/* ── Detail panel ────────────────────────────────────────────────── */}
      {selected && (
        <ProspectDetail p={selected} isAdded={addedIds.has(selId)} adding={adding} onClose={() => setSelected(null)} onAdd={() => handleAdd(selected)} t={t} dark={dark} compact={compact} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — Find Creators (Nomaad community)
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_STYLES = {
  photo:   { color: '#ccfd01', bg: 'rgba(204,253,1,0.1)',   icon: <Camera    size={11} strokeWidth={2.5} /> },
  video:   { color: '#5AC8FA', bg: 'rgba(90,200,250,0.1)',  icon: <Film      size={11} strokeWidth={2.5} /> },
  design:  { color: '#FF6259', bg: 'rgba(255,98,89,0.1)',   icon: <Palette   size={11} strokeWidth={2.5} /> },
  edit:    { color: '#AF52DE', bg: 'rgba(175,82,222,0.1)',  icon: <Edit3     size={11} strokeWidth={2.5} /> },
  create:  { color: '#FFB340', bg: 'rgba(255,179,64,0.1)',  icon: <Star      size={11} strokeWidth={2.5} /> },
  produce: { color: '#34C759', bg: 'rgba(52,199,89,0.1)',   icon: <Briefcase size={11} strokeWidth={2.5} /> },
};
const CATS       = ['All', 'photo', 'video', 'design', 'edit', 'create', 'produce'];
const CAT_LABELS = { All: 'All', photo: 'Photo', video: 'Video', design: 'Design', edit: 'Editing', create: 'Content', produce: 'Production' };

function RoleBadge({ type, label }) {
  const s = ROLE_STYLES[type] || ROLE_STYLES.photo;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, border: `1px solid ${s.color}33` }}>{s.icon} {label}</span>;
}

function CreatorCard({ member, onView, onConnect, connected, t, dark, idx }) {
  const s = ROLE_STYLES[member.type] || ROLE_STYLES.photo;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03, type: 'spring', stiffness: 420, damping: 34 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 22px', borderBottom: `1px solid ${t.divider}` }}>
      <div onClick={() => onView(member)} style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 50, height: 50, borderRadius: 26, overflow: 'hidden', border: `2.5px solid ${connected ? s.color : t.cardBorder}`, boxShadow: connected ? `0 0 0 3px ${s.color}22` : 'none' }}>
          {member.img
            ? <img src={member.img} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=333&color=fff`; }} />
            : <div style={{ width: '100%', height: '100%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: s.color }}>{member.name.charAt(0)}</div>}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <button onClick={() => onView(member)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{member.name}</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3, flexWrap: 'wrap' }}>
              <RoleBadge type={member.type} label={member.role} />
              {member.loc && <span style={{ fontSize: 11, color: t.sub, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={9} />{member.loc}</span>}
            </div>
            {member.bio && <p style={{ fontSize: 12, color: t.sub, margin: '6px 0 0', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{member.bio}</p>}
            {member.projects?.length > 0 && (
              <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                {member.projects.slice(0, 4).map((proj, i) => (
                  <div key={i} style={{ width: 50, height: 38, borderRadius: 7, overflow: 'hidden', border: `1px solid ${t.cardBorder}`, background: t.input, flexShrink: 0 }}>
                    {proj.img ? <img src={proj.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: t.muted, fontWeight: 700 }}>{(proj.title || '?').charAt(0)}</div>}
                  </div>
                ))}
                {member.projects.length > 4 && <div style={{ width: 50, height: 38, borderRadius: 7, background: t.input, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: t.sub, fontWeight: 600, flexShrink: 0 }}>+{member.projects.length - 4}</div>}
              </div>
            )}
          </div>
          <button onClick={() => onConnect(member.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: connected ? '7px 14px' : '7px 16px', borderRadius: 18, border: connected ? `1px solid ${t.cardBorder}` : `1.5px solid ${s.color}`, background: connected ? t.input : s.bg, color: connected ? t.sub : s.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: ease, whiteSpace: 'nowrap' }}>
            {connected ? <><Check size={13} /> Connected</> : <><UserPlus size={13} /> Connect</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CreatorProfile({ member, onBack, onConnect, connected, t, dark }) {
  const s = ROLE_STYLES[member.type] || ROLE_STYLES.photo;
  const [hovProj, setHovProj] = useState(null);
  return (
    <motion.div key="profile" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 28 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: t.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, alignSelf: 'flex-start' }}>
        <ArrowLeft size={14} /> Back to creators
      </button>
      {/* Hero card */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', overflow: 'hidden' }}>
        <div style={{ height: 100, background: `linear-gradient(135deg,${s.color}1a,${s.color}06)`, borderBottom: `1px solid ${s.color}22`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: `radial-gradient(circle, ${s.color} 0.5px, transparent 0.5px)`, backgroundSize: '20px 20px' }} />
        </div>
        <div style={{ padding: '0 22px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -30 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, overflow: 'hidden', border: `3px solid ${dark ? '#0d0d12' : '#f5f5f0'}`, boxShadow: `0 0 0 3px ${s.color}44, 0 8px 24px rgba(0,0,0,0.2)` }}>
              {member.img ? <img src={member.img} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=333&color=fff`; }} /> : <div style={{ width: '100%', height: '100%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: s.color }}>{member.name.charAt(0)}</div>}
            </div>
            <button onClick={() => onConnect(member.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 18, border: connected ? `1px solid ${t.cardBorder}` : 'none', background: connected ? t.input : s.color === '#ccfd01' ? '#ccfd01' : s.bg, color: connected ? t.sub : s.color === '#ccfd01' ? '#0a0a0a' : s.color, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: connected ? 'none' : `0 4px 16px ${s.color}44`, transition: ease }}>
              {connected ? <><Check size={14} /> Connected</> : <><UserPlus size={14} /> Connect</>}
            </button>
          </div>
          <div style={{ marginTop: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: -0.4, margin: 0 }}>{member.name}</h2>
              <RoleBadge type={member.type} label={member.role} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
              {member.loc && <span style={{ fontSize: 12, color: t.sub, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{member.loc}</span>}
              <span style={{ fontSize: 12, color: t.sub, display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} />{(member.connections || 0).toLocaleString()} connections</span>
            </div>
            {member.bio && <p style={{ fontSize: 13, color: t.sub, marginTop: 10, lineHeight: 1.65, maxWidth: 500 }}>{member.bio}</p>}
          </div>
        </div>
      </div>
      {/* Portfolio */}
      {member.projects?.length > 0 && (
        <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', padding: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: t.text, margin: 0 }}>Portfolio</h3>
            <p style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{member.projects.length} projects on Nomaad</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {member.projects.map((proj, i) => (
              <motion.div key={proj.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onMouseEnter={() => setHovProj(proj.id || i)} onMouseLeave={() => setHovProj(null)}
                style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${hovProj === (proj.id || i) ? s.color + '55' : t.cardBorder}`, boxShadow: hovProj === (proj.id || i) ? `0 6px 20px ${s.color}22` : 'none', transition: 'all 0.2s ease' }}>
                <div style={{ position: 'relative', height: 110, overflow: 'hidden', background: t.input }}>
                  {proj.img ? <img src={proj.img} alt={proj.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovProj === (proj.id || i) ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.3s ease' }} onError={e => { e.target.style.display = 'none'; }} /> : <div style={{ width: '100%', height: '100%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{React.cloneElement(s.icon, { size: 22 })}</div>}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.35),transparent)' }} />
                </div>
                <div style={{ padding: '9px 11px', background: dark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.text, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{proj.title}</div>
                  {proj.year && <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>{proj.year}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function FindCreatorsTab({ t, dark }) {
  const { user } = useAuth();
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [catFilter, setCat]     = useState('All');
  const [connected, setConn]    = useState(new Set());
  const [viewing, setViewing]   = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (!profiles) return;
        const withProjects = await Promise.all(
          profiles.map(async p => {
            const { data: projs } = await supabase.from('projects').select('id,name,status,created_at').eq('user_id', p.id).limit(6);
            return {
              id:          p.id,
              name:        p.full_name || 'Nomaad Creator',
              role:        p.role || 'Creator',
              type:        p.creator_type || 'photo',
              loc:         p.city || p.company || '',
              img:         p.avatar_url || null,
              bio:         p.bio || '',
              connections: Math.floor(Math.random() * 300 + 20),
              projects:    (projs || []).map(pr => ({ id: pr.id, title: pr.name, cat: pr.status, year: new Date(pr.created_at).getFullYear(), img: null })),
            };
          })
        );
        setMembers(withProjects.filter(m => m.id !== user.id));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const filtered = useMemo(() => members.filter(m => {
    if (catFilter !== 'All' && m.type !== catFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return m.name.toLowerCase().includes(q) || (m.role || '').toLowerCase().includes(q) || (m.loc || '').toLowerCase().includes(q);
    }
    return true;
  }), [members, query, catFilter]);

  const toggleConn = id => setConn(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
      {/* Header */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, padding: '15px 20px', boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.4, color: t.text, margin: 0 }}>Find Creators</h1>
          <p style={{ fontSize: 12, color: t.sub, margin: '3px 0 0' }}>Discover Nomaad creatives to collaborate with</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" style={{ padding: '7px 11px 7px 28px', borderRadius: 11, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 12, outline: 'none', fontFamily: 'inherit', width: 170 }} />
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, overflowX: 'auto', paddingBottom: 2 }}>
        {CATS.map(cat => {
          const active = catFilter === cat;
          const s = cat === 'All' ? null : ROLE_STYLES[cat];
          return (
            <button key={cat} onClick={() => setCat(cat)} style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 18, fontFamily: 'inherit', border: `1px solid ${active ? (s ? s.color : '#ccfd01') : t.cardBorder}`, background: active ? (s ? s.bg : 'rgba(204,253,1,0.1)') : t.input, color: active ? (s ? s.color : '#ccfd01') : t.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: ease }}>
              {CAT_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* List / Profile */}
      <AnimatePresence mode="wait">
        {viewing ? (
          <CreatorProfile key="profile" member={viewing} onBack={() => setViewing(null)} onConnect={toggleConn} connected={connected.has(viewing.id)} t={t} dark={dark} />
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.16 }}
            style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 22px', borderBottom: `1px solid ${t.divider}`, fontSize: 10, fontWeight: 700, color: t.muted, letterSpacing: 0.6, textTransform: 'uppercase', flexShrink: 0 }}>
              {loading ? 'Loading…' : `${filtered.length} ${catFilter === 'All' ? 'creators' : CAT_LABELS[catFilter].toLowerCase() + 's'} on Nomaad`}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading && <SkeletonRows t={t} n={6} />}
              {!loading && filtered.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: t.muted, fontSize: 13 }}>No creators found</div>}
              {!loading && filtered.map((m, idx) => <CreatorCard key={m.id} member={m} idx={idx} onView={setViewing} onConnect={toggleConn} connected={connected.has(m.id)} t={t} dark={dark} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root — 2 tabs
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 0, label: 'Find Clients',   desc: 'Decision-makers · 400M+ professionals', icon: <Target size={15} />, accent: '#CCFD01' },
  { id: 1, label: 'Find Creators',  desc: 'Nomaad community · portfolios',          icon: <Users  size={15} />, accent: '#5AC8FA' },
];

export default function ProspectingView({ t, dark, mobile, compact }) {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14, minHeight: 0 }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {TABS.map(tb => {
          const active = tab === tb.id;
          const tc     = dark ? tb.accent : tb.accent === '#CCFD01' ? '#365314' : tb.accent;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 18px', borderRadius: 16, border: `1px solid ${active ? tb.accent + '55' : t.cardBorder}`, background: active ? (dark ? `${tb.accent}16` : `${tb.accent}20`) : t.card, color: active ? tc : t.sub, boxShadow: active ? `0 0 0 1px ${tb.accent}30, ${t.cardShadow}` : t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', cursor: 'pointer', fontFamily: 'inherit', transition: ease, textAlign: 'left' }}>
              <div style={{ flexShrink: 0, opacity: active ? 1 : 0.5 }}>{tb.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>{tb.label}</div>
                {!compact && <div style={{ fontSize: 10, color: active ? tc + 'bb' : t.muted, marginTop: 1, whiteSpace: 'nowrap' }}>{tb.desc}</div>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {tab === 0 && (
            <motion.div key="clients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.13 }} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              <FindClientsTab t={t} dark={dark} compact={compact} />
            </motion.div>
          )}
          {tab === 1 && (
            <motion.div key="creators" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.13 }} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              <FindCreatorsTab t={t} dark={dark} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes nomSpin  { to { transform: rotate(360deg); } }
        @keyframes nomSlide { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes nomPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.38; } }
      `}</style>
    </div>
  );
}
