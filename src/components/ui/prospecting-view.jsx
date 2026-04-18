/**
 * prospecting-view.jsx — 3-tab prospecting hub
 *
 * Tab 0 — Vibe Prospecting   AI-powered lead discovery (Explorium)
 * Tab 1 — People Search      Traditional B2B prospecting (Apollo.io style)
 * Tab 2 — Find Creators      Discover Nomaad community members with portfolios
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Plus, Briefcase, MapPin, Building2, X, Sparkles, Users,
  Check, Loader, AlertCircle, ArrowLeft, UserPlus, Camera, Edit3,
  Film, Palette, Star, ChevronDown, ExternalLink, Globe,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const ease = 'all 0.28s cubic-bezier(.4,0,.2,1)';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function selStyle(t) {
  return {
    width: '100%', padding: '7px 9px', borderRadius: 9,
    border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text,
    fontSize: 11, fontWeight: 500, outline: 'none', cursor: 'pointer',
    marginBottom: 0, boxSizing: 'border-box',
  };
}
function inpStyle(t) {
  return {
    width: '100%', padding: '7px 9px', borderRadius: 9,
    border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text,
    fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };
}
function FilterLabel({ t, text, mt = 10 }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5, marginTop: mt }}>{text}</div>;
}
function Chip({ active, label, onClick, t, dark }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
      border: `1px solid ${active ? (dark ? '#CCFD01' : '#84cc16') : t.inputBorder}`,
      background: active ? (dark ? 'rgba(204,253,1,0.13)' : 'rgba(132,204,22,0.12)') : t.input,
      color: active ? (dark ? '#CCFD01' : '#365314') : t.sub, transition: ease, whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}
function SetupBanner({ t, dark, keyName, serviceName }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: dark ? 'rgba(204,253,1,0.08)' : 'rgba(132,204,22,0.08)', border: `1px solid ${dark ? 'rgba(204,253,1,0.18)' : 'rgba(132,204,22,0.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <Sparkles size={22} color={dark ? '#CCFD01' : '#4d7c0f'} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 7 }}>Connect {serviceName}</div>
      <div style={{ fontSize: 12, color: t.sub, lineHeight: 1.65, maxWidth: 290, margin: '0 auto 18px' }}>
        Add <strong style={{ color: t.text }}>{keyName}</strong> to your Vercel environment variables to activate this integration.
      </div>
      <div style={{ background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 11, padding: '11px 14px', textAlign: 'left', fontFamily: 'monospace', fontSize: 11, color: t.sub, lineHeight: 2 }}>
        <div>1. Vercel → Project → Settings</div>
        <div>2. Environment Variables → Add New</div>
        <div>3. <span style={{ color: dark ? '#CCFD01' : '#365314', fontWeight: 700 }}>{keyName}</span> = your key</div>
        <div>4. Redeploy</div>
      </div>
    </div>
  );
}
function SkeletonBlock({ t, rows = 8 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: `1px solid ${t.divider}` }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ width: '38%', height: 11, borderRadius: 6, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite 0.1s' }} />
        <div style={{ width: '60%', height: 9, borderRadius: 6, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite 0.2s' }} />
      </div>
      <div style={{ width: 50, height: 9, borderRadius: 6, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: 28, height: 28, borderRadius: 7, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite' }} />
    </div>
  ));
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 0 — Vibe Prospecting
// ─────────────────────────────────────────────────────────────────────────────

const VIBE_INDUSTRIES = [
  'Advertising Services', 'Marketing Services', 'Design Services',
  'Media Production', 'Photography', 'Film & Video',
  'Public Relations & Communications', 'Events Services',
  'Software Development', 'Technology', 'E-Learning', 'Retail',
];
const VIBE_DEPTS = ['Any dept.', 'Marketing', 'Sales', 'Engineering', 'Product', 'Design', 'Finance', 'Operations'];
const VIBE_COUNTRIES = [
  { code: '', label: 'Anywhere' }, { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' }, { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' }, { code: 'IE', label: 'Ireland' },
  { code: 'DE', label: 'Germany' }, { code: 'FR', label: 'France' },
  { code: 'NL', label: 'Netherlands' }, { code: 'SE', label: 'Sweden' },
  { code: 'SG', label: 'Singapore' }, { code: 'AE', label: 'UAE' },
];
const VIBE_LEVELS = ['Any level', 'manager', 'director', 'vp', 'c-suite'];
const VIBE_LEVEL_LABELS = { 'Any level': 'Any', manager: 'Manager', director: 'Director', vp: 'VP', 'c-suite': 'C-Suite' };
const VIBE_SIZES = ['Any size', '1-10', '11-50', '51-200', '201-500', '1001-5000'];

function VibeDetailPanel({ p, isAdded, adding, onClose, onAdd, t, dark }) {
  const name = p.full_name || p.name || 'Unknown';
  const rows = [
    { icon: <Building2 size={13} />, label: 'Company', val: p.company_name || p.company },
    { icon: <MapPin size={13} />, label: 'Location', val: p.location || [p.city, p.country].filter(Boolean).join(', ') },
    { icon: <Briefcase size={13} />, label: 'Industry', val: p.linkedin_industry || p.industry },
    { icon: <Users size={13} />, label: 'Company size', val: p.company_size },
  ].filter(r => r.val);

  return (
    <div style={{ width: 320, flexShrink: 0, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'nomSlide 0.22s cubic-bezier(.4,0,.2,1)' }}>
      <div style={{ padding: '13px 16px', borderBottom: `1px solid ${t.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dark ? 'rgba(204,253,1,0.03)' : 'rgba(132,204,22,0.04)' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>Prospect Details</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.muted, cursor: 'pointer', display: 'flex', padding: 3, borderRadius: 5 }}><X size={14} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: t.accentText, flexShrink: 0, boxShadow: t.accentGlow }}>{name.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{name}</div>
            <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>{p.job_title || p.title || ''}</div>
          </div>
        </div>
        {rows.map(row => (
          <div key={row.label} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: t.input, border: `1px solid ${t.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted, flexShrink: 0 }}>{row.icon}</div>
            <div>
              <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{row.label}</div>
              <div style={{ fontSize: 12, color: t.text, fontWeight: 500, marginTop: 1 }}>{row.val}</div>
            </div>
          </div>
        ))}
        {(p.bio || p.summary) && (
          <div style={{ padding: 11, borderRadius: 10, background: t.input, border: `1px solid ${t.inputBorder}` }}>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>About</div>
            <div style={{ fontSize: 12, color: t.text, lineHeight: 1.6 }}>{p.bio || p.summary}</div>
          </div>
        )}
      </div>
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.divider}` }}>
        {isAdded ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 11, background: dark ? 'rgba(52,199,89,0.1)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(52,199,89,0.28)' : '#bbf7d0'}`, color: '#34C759', fontSize: 13, fontWeight: 700 }}>
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

function VibeTab({ t, dark, compact }) {
  const { user } = useAuth();
  const [industry, setIndustry] = useState('');
  const [level, setLevel] = useState('Any level');
  const [dept, setDept] = useState('Any dept.');
  const [country, setCountry] = useState('');
  const [size, setSize] = useState('Any size');
  const [keywords, setKeywords] = useState('');
  const [limit, setLimit] = useState(25);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const [adding, setAdding] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true); setError(null); setSearched(true); setSelected(null); setResults([]);
    const filters = {};
    if (industry) filters.linkedin_category = [industry];
    if (level !== 'Any level') filters.job_level = level;
    if (dept !== 'Any dept.') filters.job_department = dept.toLowerCase();
    if (country) filters.country_code = country;
    if (size !== 'Any size') filters.company_size = size;
    if (keywords.trim()) filters.job_title = keywords.trim(); // use as job title keyword filter
    try {
      const res = await fetch('/api/prospect/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filters, limit }) });
      const data = await res.json();
      if (!res.ok) { setError({ type: data.setup_required ? 'setup' : 'api', message: data.error }); return; }
      setResults(data.prospects || []); setTotal(data.total || (data.prospects || []).length);
    } catch (err) { setError({ type: 'network', message: err.message }); }
    finally { setLoading(false); }
  }, [industry, level, dept, country, size, keywords, limit]);

  const handleAdd = useCallback(async (prospect) => {
    if (!user || adding) return;
    setAdding(true);
    const pid = prospect.id || prospect.prospect_id;
    try {
      const { error: err } = await supabase.from('prospects').insert([{
        user_id: user.id, name: prospect.full_name || prospect.name || 'Unknown',
        company: prospect.company_name || prospect.company || '', email: prospect.email || '',
        role: prospect.job_title || prospect.title || '', industry: prospect.linkedin_industry || prospect.industry || '',
        location: prospect.location || prospect.city || '',
        notes: `Sourced via Vibe Prospecting.${prospect.bio ? ' ' + prospect.bio : ''}`.trim(),
        source: 'vibe-prospecting', stage: 'lead', value: 0,
      }]);
      if (!err) setAddedIds(prev => new Set([...prev, pid]));
    } finally { setAdding(false); }
  }, [user, adding]);

  const selId = selected ? (selected.id || selected.prospect_id) : null;

  return (
    <div style={{ display: 'flex', flex: 1, gap: 14, minHeight: 0 }}>
      {/* Filter sidebar */}
      <div style={{ width: compact ? 210 : 242, flexShrink: 0, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, padding: '16px 14px', boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <FilterLabel t={t} text="Industry" mt={0} />
        <select value={industry} onChange={e => setIndustry(e.target.value)} style={selStyle(t)}>
          <option value="">Any industry</option>
          {VIBE_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <FilterLabel t={t} text="Seniority" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 2 }}>
          {VIBE_LEVELS.map(l => <Chip key={l} active={level === l} label={VIBE_LEVEL_LABELS[l]} onClick={() => setLevel(l)} t={t} dark={dark} />)}
        </div>
        <FilterLabel t={t} text="Department" />
        <select value={dept} onChange={e => setDept(e.target.value)} style={selStyle(t)}>
          {VIBE_DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <FilterLabel t={t} text="Country" />
        <select value={country} onChange={e => setCountry(e.target.value)} style={selStyle(t)}>
          {VIBE_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
        <FilterLabel t={t} text="Company size" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 2 }}>
          {VIBE_SIZES.map(s => <Chip key={s} active={size === s} label={s} onClick={() => setSize(s)} t={t} dark={dark} />)}
        </div>
        <FilterLabel t={t} text="Job Title" />
        <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g. Creative Director" onKeyDown={e => e.key === 'Enter' && handleSearch()} style={{ ...inpStyle(t), marginBottom: 10 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: t.sub, fontWeight: 600 }}>Results</span>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: 7, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 11, outline: 'none', cursor: 'pointer' }}>
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button onClick={handleSearch} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: 12, border: 'none', background: loading ? t.input : t.accentGrad, color: loading ? t.sub : t.accentText, fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: loading ? 'none' : t.accentGlow, transition: ease }}>
          {loading ? <><Loader size={13} style={{ animation: 'nomSpin 1s linear infinite' }} /> Searching…</> : <><Search size={13} /> Search Prospects</>}
        </button>
        <div style={{ textAlign: 'center', fontSize: 10, color: t.muted, marginTop: 10 }}>Powered by <span style={{ fontWeight: 600, color: t.sub }}>Vibe Prospecting</span></div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: ease }}>
        <div style={{ padding: '13px 18px', borderBottom: `1px solid ${t.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Prospects</div>
            <div style={{ fontSize: 11, color: t.sub, marginTop: 1 }}>{!searched ? 'Set filters and search' : loading ? 'Searching…' : `${results.length}${total > results.length ? ` of ${total.toLocaleString()}` : ''} result${results.length !== 1 ? 's' : ''}`}</div>
          </div>
          {addedIds.size > 0 && <div style={{ fontSize: 11, color: '#34C759', background: dark ? 'rgba(52,199,89,0.1)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(52,199,89,0.25)' : '#bbf7d0'}`, padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>{addedIds.size} added</div>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {error?.type === 'setup' && <SetupBanner t={t} dark={dark} keyName="EXPLORIUM_API_KEY" serviceName="Vibe Prospecting" />}
          {(error?.type === 'api' || error?.type === 'network') && <div style={{ padding: '48px 24px', textAlign: 'center' }}><AlertCircle size={26} style={{ color: '#FF6259', margin: '0 auto 10px', display: 'block' }} /><div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 5 }}>Search failed</div><div style={{ fontSize: 12, color: t.sub }}>{error.message}</div></div>}
          {loading && <SkeletonBlock t={t} rows={10} />}
          {!loading && !error && searched && results.length === 0 && <div style={{ padding: '48px 24px', textAlign: 'center' }}><Users size={26} style={{ color: t.muted, margin: '0 auto 10px', display: 'block' }} /><div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 5 }}>No results</div><div style={{ fontSize: 12, color: t.sub }}>Try broadening your filters</div></div>}
          {!searched && !loading && <div style={{ padding: '56px 24px', textAlign: 'center' }}><div style={{ width: 52, height: 52, borderRadius: 16, background: dark ? 'rgba(204,253,1,0.07)' : 'rgba(132,204,22,0.08)', border: `1px solid ${dark ? 'rgba(204,253,1,0.14)' : 'rgba(132,204,22,0.18)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Sparkles size={22} color={dark ? '#CCFD01' : '#4d7c0f'} /></div><div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 7 }}>Find your next client</div><div style={{ fontSize: 12, color: t.sub, lineHeight: 1.65, maxWidth: 260, margin: '0 auto' }}>Filter by industry, seniority and location to surface leads from 400M+ professionals.</div></div>}
          {!loading && results.map((p, idx) => {
            const pid = p.id || p.prospect_id || `r${idx}`;
            const isAdded = addedIds.has(pid);
            const isSel = selId === pid;
            const name = p.full_name || p.name || 'Unknown';
            return (
              <div key={pid} onClick={() => setSelected(isSel ? null : { ...p, id: pid })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: `1px solid ${t.divider}`, cursor: 'pointer', background: isSel ? (dark ? 'rgba(204,253,1,0.06)' : 'rgba(132,204,22,0.06)') : 'transparent', transition: ease }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: t.accentText, flexShrink: 0 }}>{name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: 11, color: t.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{p.job_title || p.title || ''}{(p.company_name || p.company) ? ` · ${p.company_name || p.company}` : ''}</div>
                </div>
                {(p.location || p.city) && <div style={{ fontSize: 10, color: t.muted, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}><MapPin size={10} />{(p.location || p.city || '').split(',')[0]}</div>}
                <button onClick={e => { e.stopPropagation(); if (!isAdded) handleAdd({ ...p, id: pid }); }} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, border: `1px solid ${isAdded ? (dark ? 'rgba(52,199,89,0.4)' : '#bbf7d0') : t.inputBorder}`, background: isAdded ? (dark ? 'rgba(52,199,89,0.12)' : '#f0fdf4') : t.input, color: isAdded ? '#34C759' : t.sub, cursor: isAdded ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: ease }}>
                  {isAdded ? <Check size={12} /> : <Plus size={12} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && <VibeDetailPanel p={selected} isAdded={addedIds.has(selId)} adding={adding} onClose={() => setSelected(null)} onAdd={() => handleAdd(selected)} t={t} dark={dark} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — People Search (Apollo.io style)
// ─────────────────────────────────────────────────────────────────────────────

const APOLLO_SENIORITIES = [
  { id: 'owner', label: 'Owner / Founder' },
  { id: 'c_suite', label: 'C-Suite' },
  { id: 'vp', label: 'VP' },
  { id: 'director', label: 'Director' },
  { id: 'manager', label: 'Manager' },
  { id: 'senior', label: 'Senior' },
  { id: 'entry', label: 'Entry Level' },
];

const EMAIL_STATUS_COLORS = {
  verified: '#34C759',
  unverified: '#FFB340',
  likely_to_engage: '#5AC8FA',
  unavailable: '#8E8E93',
};

function ApolloTab({ t, dark, compact }) {
  const { user } = useAuth();
  const [titleInput, setTitleInput] = useState('');
  const [titles, setTitles] = useState([]);
  const [seniorities, setSeniorities] = useState([]);
  const [location, setLocation] = useState('');
  const [domain, setDomain] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [adding, setAdding] = useState(null); // id of row being added

  const toggleSeniority = id => setSeniorities(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleAddTitle = () => {
    const v = titleInput.trim();
    if (v && !titles.includes(v)) { setTitles(prev => [...prev, v]); setTitleInput(''); }
  };

  const runSearch = useCallback(async (pg = 1) => {
    setLoading(true); setError(null); setSearched(true);
    try {
      const res = await fetch('/api/prospect/apollo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_titles: titles, person_seniorities: seniorities, person_locations: location ? [location] : [], q_organization_domains_list: domain ? [domain] : [], page: pg, per_page: perPage }),
      });
      const data = await res.json();
      if (!res.ok) { setError({ type: data.setup_required ? 'setup' : 'api', message: data.error }); return; }
      setResults(data.people || []); setTotal(data.pagination?.total_entries || (data.people || []).length); setPage(pg);
    } catch (err) { setError({ type: 'network', message: err.message }); }
    finally { setLoading(false); }
  }, [titles, seniorities, location, domain, perPage]);

  const handleAdd = useCallback(async (person) => {
    if (!user || adding) return;
    setAdding(person.id);
    try {
      const { error: err } = await supabase.from('prospects').insert([{
        user_id: user.id, name: person.name || 'Unknown',
        company: person.organization_name || '', email: person.email || '',
        role: person.title || '', industry: person.industry || '',
        location: [person.city, person.state, person.country].filter(Boolean).join(', '),
        notes: `Sourced via Apollo.io People Search.`,
        source: 'apollo', stage: 'lead', value: 0,
      }]);
      if (!err) setAddedIds(prev => new Set([...prev, person.id]));
    } finally { setAdding(null); }
  }, [user, adding]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div style={{ display: 'flex', flex: 1, gap: 14, minHeight: 0 }}>
      {/* Filter sidebar */}
      <div style={{ width: compact ? 210 : 248, flexShrink: 0, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, padding: '16px 14px', boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: 0 }}>

        <FilterLabel t={t} text="Job Titles" mt={0} />
        <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
          <input value={titleInput} onChange={e => setTitleInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTitle(); } }} placeholder="e.g. Creative Director" style={{ ...inpStyle(t), flex: 1 }} />
          <button onClick={handleAddTitle} style={{ padding: '7px 10px', borderRadius: 9, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Plus size={13} /></button>
        </div>
        {titles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {titles.map(tt => (
              <span key={tt} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 7, background: dark ? 'rgba(204,253,1,0.1)' : 'rgba(132,204,22,0.1)', border: `1px solid ${dark ? 'rgba(204,253,1,0.2)' : 'rgba(132,204,22,0.25)'}`, color: dark ? '#CCFD01' : '#365314', fontSize: 11, fontWeight: 600 }}>
                {tt}<button onClick={() => setTitles(prev => prev.filter(x => x !== tt))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex' }}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}

        <FilterLabel t={t} text="Seniority" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 4 }}>
          {APOLLO_SENIORITIES.map(s => (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '3px 0' }}>
              <div onClick={() => toggleSeniority(s.id)} style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${seniorities.includes(s.id) ? (dark ? '#CCFD01' : '#84cc16') : t.inputBorder}`, background: seniorities.includes(s.id) ? (dark ? '#CCFD01' : '#84cc16') : t.input, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: ease }}>
                {seniorities.includes(s.id) && <Check size={9} color={dark ? '#000' : '#fff'} />}
              </div>
              <span style={{ fontSize: 11, color: t.text, fontWeight: seniorities.includes(s.id) ? 600 : 400 }}>{s.label}</span>
            </label>
          ))}
        </div>

        <FilterLabel t={t} text="Location" />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, United Kingdom" style={{ ...inpStyle(t), marginBottom: 0 }} />

        <FilterLabel t={t} text="Company Domain" />
        <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. apple.com" style={{ ...inpStyle(t), marginBottom: 0 }} />

        <FilterLabel t={t} text="Results per page" />
        <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ ...selStyle(t), marginBottom: 12 }}>
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <button onClick={() => runSearch(1)} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: 12, border: 'none', background: loading ? t.input : t.accentGrad, color: loading ? t.sub : t.accentText, fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: loading ? 'none' : t.accentGlow, transition: ease }}>
          {loading ? <><Loader size={13} style={{ animation: 'nomSpin 1s linear infinite' }} /> Searching…</> : <><Search size={13} /> Search People</>}
        </button>
        <div style={{ textAlign: 'center', fontSize: 10, color: t.muted, marginTop: 10 }}>Powered by <span style={{ fontWeight: 600, color: t.sub }}>Apollo.io</span></div>
      </div>

      {/* Results table */}
      <div style={{ flex: 1, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ padding: '13px 18px', borderBottom: `1px solid ${t.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>People</div>
            <div style={{ fontSize: 11, color: t.sub, marginTop: 1 }}>{!searched ? 'Build your search and go' : loading ? 'Searching Apollo…' : `${total.toLocaleString()} result${total !== 1 ? 's' : ''}${totalPages > 1 ? ` · page ${page}/${totalPages}` : ''}`}</div>
          </div>
          {addedIds.size > 0 && <div style={{ fontSize: 11, color: '#34C759', background: dark ? 'rgba(52,199,89,0.1)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(52,199,89,0.25)' : '#bbf7d0'}`, padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>{addedIds.size} added</div>}
        </div>

        {/* Col headers */}
        {(results.length > 0 || loading) && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.8fr 1.2fr 1fr auto', padding: '9px 18px', borderBottom: `1px solid ${t.divider}`, background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', flexShrink: 0 }}>
            {['Name / Role', 'Company', 'Location', 'Email', ''].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {error?.type === 'setup' && <SetupBanner t={t} dark={dark} keyName="APOLLO_API_KEY" serviceName="Apollo.io" />}
          {(error?.type === 'api' || error?.type === 'network') && <div style={{ padding: '48px 24px', textAlign: 'center' }}><AlertCircle size={26} style={{ color: '#FF6259', margin: '0 auto 10px', display: 'block' }} /><div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 5 }}>Search failed</div><div style={{ fontSize: 12, color: t.sub }}>{error.message}</div></div>}
          {loading && <SkeletonBlock t={t} rows={10} />}
          {!loading && !error && searched && results.length === 0 && <div style={{ padding: '48px 24px', textAlign: 'center' }}><Users size={26} style={{ color: t.muted, margin: '0 auto 10px', display: 'block' }} /><div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 5 }}>No results</div><div style={{ fontSize: 12, color: t.sub }}>Try different titles or broaden your location</div></div>}
          {!searched && !loading && (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: dark ? 'rgba(90,200,250,0.07)' : 'rgba(90,200,250,0.08)', border: `1px solid ${dark ? 'rgba(90,200,250,0.15)' : 'rgba(90,200,250,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Search size={22} color="#5AC8FA" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 7 }}>Traditional B2B Search</div>
              <div style={{ fontSize: 12, color: t.sub, lineHeight: 1.65, maxWidth: 270, margin: '0 auto' }}>Add job titles, select seniority levels and filter by location — just like Apollo.</div>
            </div>
          )}

          {!loading && results.map(person => {
            const isAdded = addedIds.has(person.id);
            const emailColor = EMAIL_STATUS_COLORS[person.email_status] || EMAIL_STATUS_COLORS.unavailable;
            return (
              <div key={person.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.8fr 1.2fr 1fr auto', padding: '12px 18px', borderBottom: `1px solid ${t.divider}`, alignItems: 'center', gap: 8, transition: ease }}>
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: t.input, border: `1px solid ${t.inputBorder}` }}>
                    {person.photo_url
                      ? <img src={person.photo_url} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                      : <div style={{ width: '100%', height: '100%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: t.accentText }}>{(person.name || '?').charAt(0)}</div>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {person.name}
                      {person.linkedin_url && <a href={person.linkedin_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}><ExternalLink size={10} style={{ color: t.muted }} /></a>}
                    </div>
                    <div style={{ fontSize: 11, color: t.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{person.title}</div>
                  </div>
                </div>
                {/* Company */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.organization_name || '—'}</div>
                  {person.organization?.primary_domain && <div style={{ fontSize: 10, color: t.muted, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}><Globe size={9} />{person.organization.primary_domain}</div>}
                </div>
                {/* Location */}
                <div style={{ fontSize: 11, color: t.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[person.city, person.country].filter(Boolean).join(', ') || '—'}
                </div>
                {/* Email status */}
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: emailColor, background: `${emailColor}18`, border: `1px solid ${emailColor}33`, padding: '2px 7px', borderRadius: 6, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                    {(person.email_status || 'unavailable').replace(/_/g, ' ')}
                  </span>
                </div>
                {/* Action */}
                <button onClick={() => !isAdded && handleAdd(person)} disabled={!!adding} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9, border: `1px solid ${isAdded ? (dark ? 'rgba(52,199,89,0.35)' : '#bbf7d0') : t.inputBorder}`, background: isAdded ? (dark ? 'rgba(52,199,89,0.1)' : '#f0fdf4') : t.input, color: isAdded ? '#34C759' : t.text, fontSize: 11, fontWeight: 600, cursor: isAdded || adding ? 'default' : 'pointer', whiteSpace: 'nowrap', transition: ease }}>
                  {adding === person.id ? <Loader size={11} style={{ animation: 'nomSpin 1s linear infinite' }} /> : isAdded ? <><Check size={11} /> Added</> : <><Plus size={11} /> Add</>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div style={{ padding: '12px 18px', borderTop: `1px solid ${t.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => runSearch(page - 1)} disabled={page <= 1} style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${t.inputBorder}`, background: t.input, color: page <= 1 ? t.muted : t.text, fontSize: 12, fontWeight: 600, cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>← Prev</button>
            <span style={{ fontSize: 12, color: t.sub }}>Page {page} of {totalPages}</span>
            <button onClick={() => runSearch(page + 1)} disabled={page >= totalPages} style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${t.inputBorder}`, background: t.input, color: page >= totalPages ? t.muted : t.text, fontSize: 12, fontWeight: 600, cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — Find Creators (Nomaad community, LinkedIn-style)
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_STYLES = {
  photo:   { color: '#ccfd01', bg: 'rgba(204,253,1,0.1)',   icon: <Camera  size={11} strokeWidth={2.5} /> },
  video:   { color: '#5AC8FA', bg: 'rgba(90,200,250,0.1)',  icon: <Film    size={11} strokeWidth={2.5} /> },
  design:  { color: '#FF6259', bg: 'rgba(255,98,89,0.1)',   icon: <Palette size={11} strokeWidth={2.5} /> },
  edit:    { color: '#AF52DE', bg: 'rgba(175,82,222,0.1)',  icon: <Edit3   size={11} strokeWidth={2.5} /> },
  create:  { color: '#FFB340', bg: 'rgba(255,179,64,0.1)',  icon: <Star    size={11} strokeWidth={2.5} /> },
  produce: { color: '#34C759', bg: 'rgba(52,199,89,0.1)',   icon: <Briefcase size={11} strokeWidth={2.5} /> },
};
const CATS = ['All', 'photo', 'video', 'design', 'edit', 'create', 'produce'];
const CAT_LABELS = { All: 'All', photo: 'Photo', video: 'Video', design: 'Design', edit: 'Editing', create: 'Content', produce: 'Production' };

function RoleBadge({ type, label }) {
  const s = ROLE_STYLES[type] || ROLE_STYLES.photo;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, border: `1px solid ${s.color}33` }}>{s.icon} {label}</span>;
}

function CreatorCard({ member, onView, onConnect, connected, t, dark, idx }) {
  const s = ROLE_STYLES[member.type] || ROLE_STYLES.photo;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.035, type: 'spring', stiffness: 420, damping: 34 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 22px', borderBottom: `1px solid ${t.divider}` }}>
      {/* Avatar */}
      <div onClick={() => onView(member)} style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 52, height: 52, borderRadius: 28, overflow: 'hidden', border: `2.5px solid ${member.online ? s.color : t.cardBorder}`, boxShadow: member.online ? `0 0 0 3px ${s.color}22` : 'none' }}>
          {member.img
            ? <img src={member.img} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=333&color=fff`; }} />
            : <div style={{ width: '100%', height: '100%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: s.color }}>{member.name.charAt(0)}</div>}
        </div>
        {member.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: '#34C759', border: `2px solid ${dark ? '#0d0d12' : '#fff'}` }} />}
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <button onClick={() => onView(member)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: t.text, letterSpacing: -0.2 }}>{member.name}</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3, flexWrap: 'wrap' }}>
              <RoleBadge type={member.type} label={member.role} />
              {member.loc && <span style={{ fontSize: 11, color: t.sub, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{member.loc}</span>}
            </div>
            {member.bio && <p style={{ fontSize: 12, color: t.sub, margin: '7px 0 0', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{member.bio}</p>}
            {/* Portfolio thumbnails preview */}
            {member.projects?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {member.projects.slice(0, 4).map((proj, i) => (
                  <div key={i} style={{ width: 54, height: 40, borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.cardBorder}`, background: t.input, flexShrink: 0 }}>
                    {proj.img ? <img src={proj.img} alt={proj.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: t.muted, fontWeight: 700 }}>{proj.title?.charAt(0)}</div>}
                  </div>
                ))}
                {member.projects.length > 4 && <div style={{ width: 54, height: 40, borderRadius: 8, background: t.input, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: t.sub, fontWeight: 600, flexShrink: 0 }}>+{member.projects.length - 4}</div>}
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
    <motion.div key="profile" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: t.sub, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 4px', alignSelf: 'flex-start' }}>
        <ArrowLeft size={15} /> Back to creators
      </button>
      {/* Hero */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', overflow: 'hidden' }}>
        <div style={{ height: 110, background: `linear-gradient(135deg,${s.color}1a,${s.color}06)`, borderBottom: `1px solid ${s.color}22`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: `radial-gradient(circle, ${s.color} 0.5px, transparent 0.5px)`, backgroundSize: '22px 22px' }} />
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -32 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, overflow: 'hidden', border: `3px solid ${dark ? '#0d0d12' : '#f5f5f0'}`, boxShadow: `0 0 0 3px ${s.color}44, 0 8px 28px rgba(0,0,0,0.25)` }}>
              {member.img ? <img src={member.img} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=333&color=fff`; }} /> : <div style={{ width: '100%', height: '100%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: s.color }}>{member.name.charAt(0)}</div>}
            </div>
            <button onClick={() => onConnect(member.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 20, border: connected ? `1px solid ${t.cardBorder}` : 'none', background: connected ? t.input : s.color === '#ccfd01' ? '#ccfd01' : s.bg, color: connected ? t.sub : s.color === '#ccfd01' ? '#0a0a0a' : s.color, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: connected ? 'none' : `0 4px 18px ${s.color}44`, transition: ease }}>
              {connected ? <><Check size={14} /> Connected</> : <><UserPlus size={14} /> Connect</>}
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text, letterSpacing: -0.4, margin: 0 }}>{member.name}</h2>
              <RoleBadge type={member.type} label={member.role} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
              {member.loc && <span style={{ fontSize: 12, color: t.sub, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{member.loc}</span>}
              <span style={{ fontSize: 12, color: t.sub, display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} />{(member.connections || 0).toLocaleString()} connections</span>
              {member.online ? <span style={{ fontSize: 11, color: '#34C759', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759', display: 'inline-block' }} />Online now</span> : member.status && <span style={{ fontSize: 11, color: t.muted }}>{member.status}</span>}
            </div>
            {member.bio && <p style={{ fontSize: 13, color: t.sub, marginTop: 10, lineHeight: 1.65, maxWidth: 520 }}>{member.bio}</p>}
          </div>
        </div>
      </div>
      {/* Portfolio */}
      {member.projects?.length > 0 && (
        <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', padding: 22 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text, margin: 0 }}>Portfolio</h3>
            <p style={{ fontSize: 11, color: t.muted, marginTop: 3 }}>{member.projects.length} projects on Nomaad</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {member.projects.map((proj, i) => (
              <motion.div key={proj.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onMouseEnter={() => setHovProj(proj.id || i)} onMouseLeave={() => setHovProj(null)}
                style={{ borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${hovProj === (proj.id || i) ? s.color + '55' : t.cardBorder}`, boxShadow: hovProj === (proj.id || i) ? `0 6px 24px ${s.color}22` : 'none', transition: 'all 0.22s ease' }}>
                <div style={{ position: 'relative', height: 120, overflow: 'hidden', background: t.input }}>
                  {proj.img ? <img src={proj.img} alt={proj.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovProj === (proj.id || i) ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.35s ease' }} onError={e => { e.target.style.display = 'none'; }} /> : <div style={{ width: '100%', height: '100%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: s.color }}>{s.icon}</div>}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.4),transparent)' }} />
                  {proj.cat && <div style={{ position: 'absolute', top: 7, left: 7, padding: '2px 7px', borderRadius: 6, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>{proj.cat}</div>}
                </div>
                <div style={{ padding: '10px 12px', background: dark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.text, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{proj.title}</div>
                  {proj.year && <div style={{ fontSize: 10, color: t.muted, marginTop: 3 }}>{proj.year}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CreatorsTab({ t, dark }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [connected, setConnected] = useState(new Set());
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (!profiles) return;
        // For each profile, fetch their projects
        const profilesWithProjects = await Promise.all(profiles.map(async p => {
          const { data: projs } = await supabase.from('projects').select('id,name,status,created_at').eq('user_id', p.id).limit(6);
          return {
            id: p.id,
            name: p.full_name || 'Nomaad Creator',
            role: p.role || 'Creator',
            type: p.creator_type || 'photo',
            online: true,
            status: 'Active',
            loc: p.city || p.company || '',
            img: p.avatar_url || null,
            bio: p.bio || `${p.full_name || 'This creator'} is a Nomaad member.`,
            mutuals: [],
            connections: Math.floor(Math.random() * 300 + 20),
            projects: (projs || []).map(pr => ({ id: pr.id, title: pr.name, cat: pr.status, year: new Date(pr.created_at).getFullYear(), img: null })),
          };
        }));
        setMembers(profilesWithProjects.filter(m => m.id !== user.id));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const filtered = useMemo(() => members.filter(m => {
    if (catFilter !== 'All' && m.type !== catFilter) return false;
    if (query) { const q = query.toLowerCase(); return m.name.toLowerCase().includes(q) || (m.role || '').toLowerCase().includes(q) || (m.loc || '').toLowerCase().includes(q); }
    return true;
  }), [members, query, catFilter]);

  const toggleConnect = id => setConnected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const online = members.filter(m => m.online).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
      {/* Header */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, padding: '16px 20px', boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4, color: t.text, margin: 0 }}>Find Creators</h1>
          <p style={{ fontSize: 12, color: t.sub, margin: '3px 0 0' }}>Discover Nomaad creatives available for collaboration</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 18, background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.28)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759', animation: 'ncPulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#34C759' }}>{online} online</span>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search creators…" style={{ padding: '7px 11px 7px 28px', borderRadius: 11, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 12, outline: 'none', fontFamily: 'inherit', width: 180 }} />
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, overflowX: 'auto', paddingBottom: 2 }}>
        {CATS.map(cat => {
          const active = catFilter === cat;
          const s = cat === 'All' ? null : ROLE_STYLES[cat];
          return (
            <button key={cat} onClick={() => setCatFilter(cat)} style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 18, fontFamily: 'inherit', border: `1px solid ${active ? (s ? s.color : '#ccfd01') : t.cardBorder}`, background: active ? (s ? s.bg : 'rgba(204,253,1,0.1)') : t.input, color: active ? (s ? s.color : '#ccfd01') : t.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: ease }}>
              {CAT_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Member list / profile */}
      <AnimatePresence mode="wait">
        {viewing ? (
          <CreatorProfile key="profile" member={viewing} onBack={() => setViewing(null)} onConnect={toggleConnect} connected={connected.has(viewing.id)} t={t} dark={dark} />
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
            style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 18, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '11px 22px', borderBottom: `1px solid ${t.divider}`, fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: 0.6, textTransform: 'uppercase', flexShrink: 0 }}>
              {loading ? 'Loading…' : `${filtered.length} ${catFilter === 'All' ? 'creators' : CAT_LABELS[catFilter].toLowerCase() + 's'} on Nomaad`}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading && <SkeletonBlock t={t} rows={6} />}
              {!loading && filtered.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: t.muted, fontSize: 13 }}>No creators found</div>}
              {!loading && filtered.map((member, idx) => <CreatorCard key={member.id} member={member} idx={idx} onView={setViewing} onConnect={toggleConnect} connected={connected.has(member.id)} t={t} dark={dark} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root — Tab switcher
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 0, label: 'Vibe Prospecting', desc: 'AI-powered discovery · 400M+ professionals', icon: <Sparkles size={15} />, color: '#CCFD01', textColor: '#0a0a0a' },
  { id: 1, label: 'People Search',    desc: 'Apollo.io · traditional B2B filters',        icon: <Search size={15} />,   color: '#5AC8FA', textColor: '#0a0a0a' },
  { id: 2, label: 'Find Creators',    desc: 'Nomaad community · portfolios',               icon: <Users size={15} />,    color: '#FF6259', textColor: '#fff' },
];

export default function ProspectingView({ t, dark, mobile, compact }) {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14, minHeight: 0 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {TABS.map(tb => {
          const active = tab === tb.id;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '10px 18px', borderRadius: 16,
              border: `1px solid ${active ? tb.color + '55' : t.cardBorder}`,
              background: active ? (dark ? `${tb.color}18` : `${tb.color}22`) : t.card,
              color: active ? (dark ? tb.color : tb.color === '#CCFD01' ? '#365314' : tb.color) : t.sub,
              boxShadow: active ? `0 0 0 1px ${tb.color}33, ${t.cardShadow}` : t.cardShadow,
              backdropFilter: 'blur(24px) saturate(1.6)', cursor: 'pointer',
              fontFamily: 'inherit', transition: ease, textAlign: 'left',
            }}>
              <div style={{ flexShrink: 0, opacity: active ? 1 : 0.55 }}>{tb.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>{tb.label}</div>
                {!compact && <div style={{ fontSize: 10, color: active ? (dark ? tb.color + 'cc' : tb.color + 'aa') : t.muted, marginTop: 1, whiteSpace: 'nowrap' }}>{tb.desc}</div>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {tab === 0 && <motion.div key="vibe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex', flex: 1, minHeight: 0 }}><VibeTab t={t} dark={dark} compact={compact} /></motion.div>}
          {tab === 1 && <motion.div key="apollo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex', flex: 1, minHeight: 0 }}><ApolloTab t={t} dark={dark} compact={compact} /></motion.div>}
          {tab === 2 && <motion.div key="creators" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex', flex: 1, minHeight: 0 }}><CreatorsTab t={t} dark={dark} /></motion.div>}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes nomSpin    { to { transform: rotate(360deg); } }
        @keyframes nomSlide   { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes nomPulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes ncPulse    { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
}
