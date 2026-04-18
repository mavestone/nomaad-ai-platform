import React, { useState, useCallback } from 'react';
import { Search, Plus, Briefcase, MapPin, Building2, X, Sparkles, Users, Check, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const INDUSTRIES = [
  'Advertising Services', 'Marketing Services', 'Design Services',
  'Media Production', 'Photography', 'Film & Video',
  'Public Relations & Communications', 'Events Services',
  'Software Development', 'Technology', 'E-Learning',
  'Financial Services', 'Real Estate', 'Retail',
];

const DEPARTMENTS = ['Any dept.', 'Marketing', 'Sales', 'Engineering', 'Product', 'Design', 'Finance', 'Operations', 'HR'];

const COUNTRIES = [
  { code: '', label: 'Anywhere' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'IE', label: 'Ireland' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'SE', label: 'Sweden' },
  { code: 'SG', label: 'Singapore' },
  { code: 'AE', label: 'UAE' },
];

const SIZES = ['Any size', '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000'];
const LEVELS = ['Any level', 'manager', 'director', 'vp', 'c-suite'];
const LEVEL_LABELS = { 'Any level': 'Any', manager: 'Manager', director: 'Director', vp: 'VP', 'c-suite': 'C-Suite' };

const ease = 'all 0.3s cubic-bezier(.4,0,.2,1)';

// ─── Sub-components ────────────────────────────────────────────────────────

function Label({ t, text }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 12 }}>
      {text}
    </div>
  );
}

function Chip({ active, label, onClick, t, dark }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 9px', borderRadius: 8,
        border: `1px solid ${active ? (dark ? '#CCFD01' : '#84cc16') : t.inputBorder}`,
        background: active ? (dark ? 'rgba(204,253,1,0.13)' : 'rgba(132,204,22,0.12)') : t.input,
        color: active ? (dark ? '#CCFD01' : '#365314') : t.sub,
        fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: ease,
      }}
    >
      {label}
    </button>
  );
}

function ProspectRow({ p, isAdded, isSelected, t, dark, onClick, onAdd }) {
  const name = p.full_name || p.name || 'Unknown';
  const title = p.job_title || p.title || '';
  const company = p.company_name || p.company || '';
  const location = p.location || p.city || '';
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 18px', borderBottom: `1px solid ${t.divider}`,
        cursor: 'pointer', transition: ease,
        background: isSelected ? (dark ? 'rgba(204,253,1,0.07)' : 'rgba(132,204,22,0.07)') : 'transparent',
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: t.accentText, flexShrink: 0 }}>
        {name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 11, color: t.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
          {title}{company ? ` · ${company}` : ''}
        </div>
      </div>
      {location && (
        <div style={{ fontSize: 10, color: t.muted, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <MapPin size={10} /> {location.split(',')[0]}
        </div>
      )}
      <button
        onClick={onAdd}
        title={isAdded ? 'Added to pipeline' : 'Add to pipeline'}
        style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: 7,
          border: `1px solid ${isAdded ? (dark ? 'rgba(52,199,89,0.4)' : '#bbf7d0') : t.inputBorder}`,
          background: isAdded ? (dark ? 'rgba(52,199,89,0.12)' : '#f0fdf4') : t.input,
          color: isAdded ? '#34C759' : t.sub,
          cursor: isAdded ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: ease,
        }}
      >
        {isAdded ? <Check size={12} /> : <Plus size={12} />}
      </button>
    </div>
  );
}

function SkeletonRow({ t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: `1px solid ${t.divider}` }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ width: '38%', height: 11, borderRadius: 6, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite 0.1s' }} />
        <div style={{ width: '62%', height: 9, borderRadius: 6, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite 0.2s' }} />
      </div>
      <div style={{ width: 48, height: 9, borderRadius: 6, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: 28, height: 28, borderRadius: 7, background: t.input, animation: 'nomPulse 1.4s ease-in-out infinite' }} />
    </div>
  );
}

function SetupBanner({ t, dark }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: dark ? 'rgba(204,253,1,0.1)' : 'rgba(132,204,22,0.1)', border: `1px solid ${dark ? 'rgba(204,253,1,0.2)' : 'rgba(132,204,22,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Sparkles size={24} color={dark ? '#CCFD01' : '#4d7c0f'} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 8 }}>Connect Vibe Prospecting</div>
      <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.65, maxWidth: 300, margin: '0 auto 20px' }}>
        Add your <strong style={{ color: t.text }}>EXPLORIUM_API_KEY</strong> to Vercel environment variables to unlock AI-powered prospect search from 400M+ professionals.
      </div>
      <div style={{ background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 12, padding: '12px 14px', textAlign: 'left', fontFamily: 'monospace', fontSize: 11, color: t.sub, lineHeight: 2 }}>
        <div>1. Vercel → Project → Settings</div>
        <div>2. Environment Variables → Add New</div>
        <div>3. <span style={{ color: dark ? '#CCFD01' : '#365314', fontWeight: 700 }}>EXPLORIUM_API_KEY</span> = your key</div>
        <div>4. Redeploy</div>
      </div>
    </div>
  );
}

function DetailPanel({ p, isAdded, adding, onClose, onAdd, t, dark }) {
  const name = p.full_name || p.name || 'Unknown';
  const infoRows = [
    { icon: <Building2 size={13} />, label: 'Company', val: p.company_name || p.company },
    { icon: <MapPin size={13} />, label: 'Location', val: p.location || [p.city, p.country].filter(Boolean).join(', ') },
    { icon: <Briefcase size={13} />, label: 'Industry', val: p.linkedin_industry || p.industry },
    { icon: <Users size={13} />, label: 'Company size', val: p.company_size },
  ].filter(r => r.val);

  return (
    <div style={{ width: 340, flexShrink: 0, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'nomSlide 0.25s cubic-bezier(.4,0,.2,1)' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dark ? 'rgba(204,253,1,0.03)' : 'rgba(132,204,22,0.04)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Prospect Details</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.muted, cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}><X size={15} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: t.accentText, flexShrink: 0, boxShadow: t.accentGlow }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{name}</div>
            <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>{p.job_title || p.title || ''}</div>
          </div>
        </div>

        {infoRows.map(row => (
          <div key={row.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: t.input, border: `1px solid ${t.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted, flexShrink: 0 }}>{row.icon}</div>
            <div>
              <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{row.label}</div>
              <div style={{ fontSize: 12, color: t.text, fontWeight: 500, marginTop: 2 }}>{row.val}</div>
            </div>
          </div>
        ))}

        {(p.bio || p.summary) && (
          <div style={{ padding: 12, borderRadius: 10, background: t.input, border: `1px solid ${t.inputBorder}` }}>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>About</div>
            <div style={{ fontSize: 12, color: t.text, lineHeight: 1.65 }}>{p.bio || p.summary}</div>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 18px', borderTop: `1px solid ${t.divider}` }}>
        {isAdded ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12, background: dark ? 'rgba(52,199,89,0.1)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(52,199,89,0.3)' : '#bbf7d0'}`, color: '#34C759', fontSize: 13, fontWeight: 700 }}>
            <Check size={15} /> Added to Pipeline
          </div>
        ) : (
          <button
            onClick={onAdd}
            disabled={adding}
            style={{ width: '100%', padding: '11px', borderRadius: 12, border: 'none', background: t.accentGrad, color: t.accentText, fontSize: 13, fontWeight: 700, cursor: adding ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: t.accentGlow, opacity: adding ? 0.6 : 1, transition: ease }}
          >
            {adding ? <><Loader size={14} style={{ animation: 'nomSpin 1s linear infinite' }} /> Adding...</> : <><Plus size={14} /> Add to Pipeline</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main View ─────────────────────────────────────────────────────────────

export default function ProspectingView({ t, dark, mobile, compact }) {
  const { user } = useAuth();

  // Filters
  const [industry, setIndustry] = useState('');
  const [level, setLevel] = useState('Any level');
  const [dept, setDept] = useState('Any dept.');
  const [country, setCountry] = useState('');
  const [size, setSize] = useState('Any size');
  const [keywords, setKeywords] = useState('');
  const [limit, setLimit] = useState(25);

  // Search state
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);

  // UI state
  const [selected, setSelected] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const [adding, setAdding] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setSelected(null);
    setResults([]);

    const filters = {};
    if (industry) filters.linkedin_category = [industry];
    if (level !== 'Any level') filters.job_level = level;
    if (dept !== 'Any dept.') filters.job_department = dept.toLowerCase();
    if (country) filters.prospect_country_code = country;
    if (size !== 'Any size') filters.company_size = size;
    if (keywords.trim()) filters.website_keywords = keywords.split(',').map(k => k.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/prospect/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, limit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ type: data.setup_required ? 'setup' : 'api', message: data.error });
        return;
      }
      setResults(data.prospects || []);
      setTotal(data.total || (data.prospects || []).length);
    } catch (err) {
      setError({ type: 'network', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [industry, level, dept, country, size, keywords, limit]);

  const handleAdd = useCallback(async (prospect) => {
    if (!user || adding) return;
    setAdding(true);
    try {
      const pid = prospect.id || prospect.prospect_id;
      const { error: err } = await supabase.from('prospects').insert([{
        user_id: user.id,
        name: prospect.full_name || prospect.name || 'Unknown',
        company: prospect.company_name || prospect.company || '',
        email: prospect.email || '',
        role: prospect.job_title || prospect.title || '',
        industry: prospect.linkedin_industry || prospect.industry || '',
        location: prospect.location || prospect.city || '',
        notes: `Sourced via Vibe Prospecting.${prospect.bio ? ' ' + prospect.bio : ''}`.trim(),
        source: 'vibe-prospecting',
        stage: 'lead',
        value: 0,
      }]);
      if (!err) {
        setAddedIds(prev => new Set([...prev, pid]));
      }
    } finally {
      setAdding(false);
    }
  }, [user, adding]);

  const selId = selected ? (selected.id || selected.prospect_id) : null;

  return (
    <div style={{ display: 'flex', height: '100%', gap: 14, minHeight: 0 }}>

      {/* ── Left: Filter panel ──────────────────────────────────────── */}
      <div style={{ width: compact ? 210 : 248, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: '18px 16px', boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: t.accentGlow }}>
              <Sparkles size={14} color={t.accentText} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Vibe Prospecting</div>
              <div style={{ fontSize: 10, color: t.sub }}>400M+ professionals</div>
            </div>
          </div>

          <Label t={t} text="Industry" />
          <select value={industry} onChange={e => setIndustry(e.target.value)} style={sel(t)}>
            <option value="">Any industry</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>

          <Label t={t} text="Seniority" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 2 }}>
            {LEVELS.map(l => (
              <Chip key={l} active={level === l} label={LEVEL_LABELS[l]} onClick={() => setLevel(l)} t={t} dark={dark} />
            ))}
          </div>

          <Label t={t} text="Department" />
          <select value={dept} onChange={e => setDept(e.target.value)} style={sel(t)}>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <Label t={t} text="Country" />
          <select value={country} onChange={e => setCountry(e.target.value)} style={sel(t)}>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>

          <Label t={t} text="Company size" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 2 }}>
            {SIZES.map(s => (
              <Chip key={s} active={size === s} label={s} onClick={() => setSize(s)} t={t} dark={dark} />
            ))}
          </div>

          <Label t={t} text="Keywords" />
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="branding, SaaS, fintech…"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ ...inp(t), width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: t.sub, fontWeight: 600 }}>Results</span>
            <select value={limit} onChange={e => setLimit(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: 8, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 11, outline: 'none', cursor: 'pointer' }}>
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ width: '100%', padding: '11px', borderRadius: 13, border: 'none', background: loading ? t.input : t.accentGrad, color: loading ? t.sub : t.accentText, fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: loading ? 'none' : t.accentGlow, transition: ease }}
          >
            {loading
              ? <><Loader size={14} style={{ animation: 'nomSpin 1s linear infinite' }} /> Searching…</>
              : <><Search size={14} /> Search Prospects</>}
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 10, color: t.muted, paddingBottom: 4 }}>
          Powered by <span style={{ fontWeight: 600, color: t.sub }}>Vibe Prospecting</span>
        </div>
      </div>

      {/* ── Right: Results + Detail ──────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', gap: 14, minWidth: 0 }}>

        {/* Results list */}
        <div style={{ flex: 1, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: ease }}>

          {/* List header */}
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Prospects</div>
              <div style={{ fontSize: 11, color: t.sub, marginTop: 1 }}>
                {!searched ? 'Set filters and search' : loading ? 'Searching database…' : `${results.length}${total > results.length ? ` of ${total.toLocaleString()}` : ''} result${results.length !== 1 ? 's' : ''}`}
              </div>
            </div>
            {addedIds.size > 0 && (
              <div style={{ fontSize: 11, color: '#34C759', background: dark ? 'rgba(52,199,89,0.1)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(52,199,89,0.25)' : '#bbf7d0'}`, padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                {addedIds.size} added
              </div>
            )}
          </div>

          {/* List body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* Setup required */}
            {error?.type === 'setup' && <SetupBanner t={t} dark={dark} />}

            {/* API / network error */}
            {(error?.type === 'api' || error?.type === 'network') && (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <AlertCircle size={28} style={{ color: '#FF6259', margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 6 }}>Search failed</div>
                <div style={{ fontSize: 12, color: t.sub }}>{error.message}</div>
              </div>
            )}

            {/* Skeleton loading */}
            {loading && Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} t={t} />)}

            {/* Empty result */}
            {!loading && !error && searched && results.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Users size={28} style={{ color: t.muted, margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 6 }}>No results</div>
                <div style={{ fontSize: 12, color: t.sub }}>Try broadening your filters or different keywords</div>
              </div>
            )}

            {/* Initial prompt */}
            {!searched && !loading && (
              <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: dark ? 'rgba(204,253,1,0.08)' : 'rgba(132,204,22,0.08)', border: `1px solid ${dark ? 'rgba(204,253,1,0.15)' : 'rgba(132,204,22,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Search size={22} color={dark ? '#CCFD01' : '#4d7c0f'} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 8 }}>Find your next client</div>
                <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
                  Filter by industry, seniority, location and more. Add anyone directly to your client pipeline.
                </div>
              </div>
            )}

            {/* Results */}
            {!loading && results.map((p, idx) => {
              const pid = p.id || p.prospect_id || `r${idx}`;
              const isAdded = addedIds.has(pid);
              const isSelected = selId === pid;
              return (
                <ProspectRow
                  key={pid}
                  p={p}
                  isAdded={isAdded}
                  isSelected={isSelected}
                  t={t}
                  dark={dark}
                  onClick={() => setSelected(isSelected ? null : { ...p, id: pid })}
                  onAdd={e => { e.stopPropagation(); if (!isAdded) handleAdd({ ...p, id: pid }); }}
                />
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <DetailPanel
            p={selected}
            isAdded={addedIds.has(selId)}
            adding={adding}
            onClose={() => setSelected(null)}
            onAdd={() => handleAdd(selected)}
            t={t}
            dark={dark}
          />
        )}
      </div>

      <style>{`
        @keyframes nomSpin { to { transform: rotate(360deg); } }
        @keyframes nomSlide { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes nomPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>
    </div>
  );
}

// ─── Style helpers ──────────────────────────────────────────────────────────
function sel(t) {
  return {
    width: '100%', padding: '7px 9px', borderRadius: 9,
    border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text,
    fontSize: 11, fontWeight: 500, outline: 'none', cursor: 'pointer',
    marginBottom: 2, boxSizing: 'border-box',
  };
}
function inp(t) {
  return {
    padding: '7px 9px', borderRadius: 9,
    border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text,
    fontSize: 11, outline: 'none', boxSizing: 'border-box',
  };
}
