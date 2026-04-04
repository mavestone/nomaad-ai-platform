import React, { useState } from 'react';
import { Sparkles, Users, Filter, Briefcase, Plus, Search, ChevronRight, Copy, Send, Mail, X, Check, MapPin, Building, Target } from 'lucide-react';

const INDUSTRIES = ['All', 'Ad agencies', 'Consumer brands', 'Media & production', 'PR firms'];
const ROLES = ['All Roles', 'Creative Directors', 'Marketing Directors', 'Brand Managers', 'Agency Producers'];

const MOCK_LEADS = [
  { id: 1, name: 'Sarah Jenkins', role: 'Creative Director', company: 'Ogilvy', industry: 'Ad agencies', loc: 'New York', match: 98, bio: 'Award-winning CD focused on automotive and luxury brands. Recently launched the global campaign for Porsche.' },
  { id: 2, name: 'Marcus Chen', role: 'Brand Manager', company: 'Nike', industry: 'Consumer brands', loc: 'Portland', match: 94, bio: 'Oversees Nike Running digital campaigns. Heavy emphasis on documentary-style storytelling.' },
  { id: 3, name: 'Elena Rodriguez', role: 'Agency Producer', company: 'Wieden+Kennedy', industry: 'Ad agencies', loc: 'Portland', match: 91, bio: 'Senior producer managing multi-million dollar broadcast spots. Always looking for fresh directorial talent.' },
  { id: 4, name: 'James Wilson', role: 'Head of Content', company: 'Sony Music', industry: 'Media & production', loc: 'Los Angeles', match: 89, bio: 'Leading visual content strategy for flagship artists. Needs rapid-turnaround music video treatments.' },
  { id: 5, name: 'Chloe Dubois', role: 'Marketing Director', company: 'L\'Oréal', industry: 'Consumer brands', loc: 'Paris', match: 85, bio: 'Driving the new Gen-Z cosmetics line. Aesthetic is highly vibrant, fast-paced, and TikTok-native.' },
  { id: 6, name: 'Tyler Durden', role: 'Creative Director', company: 'Paper Street', industry: 'Ad agencies', loc: 'Delaware', match: 72, bio: 'Disruptive advertising. Gritty, cinematic style.' },
];

export default function ProspectingView({ t, dark, mobile }) {
  const [ind, setInd] = useState('All');
  const [role, setRole] = useState('All Roles');
  const [query, setQuery] = useState('');
  const [activeLead, setActiveLead] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [pitch, setPitch] = useState('');
  
  const ease = "all 0.45s cubic-bezier(.4,0,.2,1)";

  const filtered = MOCK_LEADS.filter(l => {
    if (ind !== 'All' && l.industry !== ind) return false;
    if (role !== 'All Roles' && l.role !== role) return false;
    if (query && !l.name.toLowerCase().includes(query.toLowerCase()) && !l.company.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const handleDraft = (lead) => {
    setActiveLead(lead);
    setPitch('');
    setGenerating(true);
    // Mock Groq AI Generation delay
    setTimeout(() => {
      setPitch(`Hi ${lead.name.split(' ')[0]},\n\nI've been following your recent work at ${lead.company}, specifically your approach to ${lead.industry === 'Consumer brands' ? 'digital-first storytelling' : 'high-end broadcast spots'}—it really caught my eye.\n\nI run a boutique production studio that specializes in cinematic, narrative-driven content. Given your focus on ${lead.bio.includes('documentary') ? 'documentary-style' : 'high-impact visual'} marketing, I think our roster of directors would be a perfect fit for your upcoming 2024 campaigns.\n\nAre you open to a quick 10-minute intro call next week so I can show you some of our recent unreleased reels?\n\nBest,\nYour Name`);
      setGenerating(false);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', height: '100%', gap: 16 }}>
      
      {/* Left: Lead Database */}
      <div style={{ flex: activeLead && !mobile ? '1.5' : 1, display: 'flex', flexDirection: 'column', gap: 16, transition: ease }}>
        
        {/* Header & Filters */}
        <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Prospecting</h1>
              <div style={{ fontSize: 13, color: t.sub, marginTop: 4 }}>B2B Creative Intent Database</div>
            </div>
            
            <div style={{ position: 'relative', width: 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: t.sub }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search companies or people..." style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: t.muted, letterSpacing: 0.5 }}>Industry</span>
            {INDUSTRIES.map(i => (
              <button key={i} onClick={() => setInd(i)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 16, border: `1px solid ${ind === i ? t.accent : t.cardBorder}`, background: ind === i ? (dark ? 'rgba(204,253,1,0.1)' : '#f4fce3') : t.input, color: ind === i ? (dark ? t.accentText : '#111') : t.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: ease }}>
                {i}
              </button>
            ))}
            
            <div style={{ width: 1, height: 20, background: t.divider, margin: '0 4px' }} />
            
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: t.muted, letterSpacing: 0.5 }}>Role</span>
            <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: '6px 12px', borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 12, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Data List */}
        <div style={{ flex: 1, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', overflowY: 'auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', padding: '16px 20px', borderBottom: `1px solid ${t.divider}`, position: 'sticky', top: 0, background: dark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Lead Name & Role</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Company</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Location</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Match Match</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Action</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map(lead => (
              <div key={lead.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', padding: '16px 20px', borderBottom: `1px solid ${t.divider}`, alignItems: 'center', transition: ease, background: activeLead?.id === lead.id ? (dark ? 'rgba(204,253,1,0.05)' : '#fcfef7') : 'transparent', ':hover': { background: t.input } }}>
                
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>{lead.role}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text, display: 'flex', alignItems: 'center', gap: 6 }}><Building size={12} style={{ color: t.muted }} /> {lead.company}</div>
                  <div style={{ fontSize: 11, background: t.input, border: `1px solid ${t.inputBorder}`, display: 'inline-block', padding: '2px 8px', borderRadius: 8, color: t.sub, marginTop: 6 }}>{lead.industry}</div>
                </div>
                
                <div style={{ fontSize: 13, color: t.sub, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} /> {lead.loc}
                </div>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 40, height: 40, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="40" height="40" viewBox="0 0 36 36" style={{ position: 'absolute' }}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={t.divider} strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={lead.match > 90 ? '#34C759' : lead.match > 80 ? '#FFB340' : t.accent} strokeWidth="3" strokeDasharray={`${lead.match}, 100`} />
                      </svg>
                      <span style={{ fontSize: 11, fontWeight: 700, color: t.text }}>{lead.match}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => activeLead?.id === lead.id ? setActiveLead(null) : handleDraft(lead)} style={{ padding: '8px 16px', borderRadius: 12, border: `1px solid ${activeLead?.id === lead.id ? t.accent : t.cardBorder}`, background: activeLead?.id === lead.id ? t.accentGrad : t.input, color: activeLead?.id === lead.id ? t.accentText : t.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: ease, display: 'flex', alignItems: 'center', gap: 6, boxShadow: activeLead?.id === lead.id ? t.accentGlow : 'none' }}>
                    <Sparkles size={14} /> {activeLead?.id === lead.id ? 'Drafting...' : 'AI Pitch'}
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Right: Groq AI Slide Panel */}
      {activeLead && (
        <div style={{ width: mobile ? '100%' : 440, flexShrink: 0, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s cubic-bezier(.4,0,.2,1)', overflow: 'hidden' }}>
          
          <div style={{ padding: 20, borderBottom: `1px solid ${t.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dark ? 'rgba(204,253,1,0.03)' : '#f4fce3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accentText, boxShadow: t.accentGlow }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Groq AI Pitch Gen</h3>
                <div style={{ fontSize: 12, color: t.sub }}>Personalized specifically for {activeLead.name.split(' ')[0]}</div>
              </div>
            </div>
            <button onClick={() => setActiveLead(null)} style={{ background: 'transparent', border: 'none', color: t.sub, cursor: 'pointer' }}><X size={18} /></button>
          </div>

          <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
            
            {/* Target Insight */}
            <div style={{ padding: 16, borderRadius: 16, background: t.input, border: `1px solid ${t.inputBorder}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: t.muted, letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={12} /> Target Intent
              </div>
              <div style={{ fontSize: 13, color: t.text, lineHeight: 1.5 }}>
                {activeLead.bio}
              </div>
            </div>

            {/* Generated Email */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: t.muted, letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} /> Drafted Email</span>
                {generating && <span style={{ color: t.accent, animation: 'pulse 1.5s infinite' }}>Groq reasoning...</span>}
              </div>
              
              <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${t.inputBorder}`, background: !dark ? '#fff' : 'rgba(0,0,0,0.2)', flex: 1, position: 'relative' }}>
                {generating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.5 }}>
                    <div style={{ height: 12, background: t.divider, borderRadius: 6, width: '40%' }} />
                    <div style={{ height: 12, background: t.divider, borderRadius: 6, width: '100%', marginTop: 12 }} />
                    <div style={{ height: 12, background: t.divider, borderRadius: 6, width: '90%' }} />
                    <div style={{ height: 12, background: t.divider, borderRadius: 6, width: '95%' }} />
                    <div style={{ height: 12, background: t.divider, borderRadius: 6, width: '80%' }} />
                  </div>
                ) : (
                  <textarea readOnly value={pitch} style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: t.text, fontSize: 14, lineHeight: 1.6, outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                )}
              </div>
            </div>
            
          </div>

          <div style={{ padding: 20, borderTop: `1px solid ${t.divider}`, display: 'flex', gap: 12 }}>
            <button disabled={generating} style={{ flex: 1, padding: '12px', borderRadius: 14, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: generating ? 'default' : 'pointer', opacity: generating ? 0.5 : 1 }}>
              <Copy size={16} /> Copy
            </button>
            <button disabled={generating} style={{ flex: 1, padding: '12px', borderRadius: 14, border: "none", background: t.accentGrad, color: t.accentText, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: generating ? 'default' : 'pointer', boxShadow: generating ? 'none' : t.accentGlow, opacity: generating ? 0.5 : 1 }}>
              <Send size={16} /> Push to CRM
            </button>
          </div>

        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}
