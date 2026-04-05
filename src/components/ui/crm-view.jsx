import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { X } from "lucide-react";

const STAGES = ["new", "contacted", "proposal", "negotiation", "won"];

export default function CRMView({ t, dark, mobile, compact, mode, notifOpen, setNotifOpen, w, IC, pal, VOLT, VOLTD }) {
  const { user } = useAuth();
  const [view, setView] = useState("table"); 
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', company: '', email: '', value: '', stage: 'new' });

  useEffect(() => {
    if (user) fetchProspects();
  }, [user]);

  async function fetchProspects() {
    const { data, error } = await supabase.from('prospects').select('*').order('created_at', { ascending: false });
    if (data) {
      const formatted = data.map(d => ({
        id: d.id, name: d.name, email: d.email, company: d.company, stage: d.stage,
        value: `$${parseFloat(d.value).toLocaleString()}`,
        lastContact: "recently", avatar: d.name ? d.name.charAt(0).toUpperCase() : "?",
        color: stageColor(d.stage)
      }));
      setContacts(formatted);
    }
    setLoading(false);
  }

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!user) return;
    const { name, company, email, value, stage } = formData;
    await supabase.from('prospects').insert([{
      user_id: user.id,
      name,
      company,
      email,
      value: parseFloat(value) || 0,
      stage,
      status: 'active'
    }]);
    setModalOpen(false);
    fetchProspects();
  };

  const ease="all 0.45s cubic-bezier(.4,0,.2,1)";
  const card = (ex = {}) => ({ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, transition: ease, backdropFilter: "blur(24px) saturate(1.6)", ...ex });

  const stageColor = (stage) => {
    switch (stage) {
      case "new": return pal.amber.base;
      case "contacted": return pal.coral.base;
      case "proposal": return pal.teal.base;
      case "negotiation": return pal.volt.base;
      case "won": return pal.volt.base;
      default: return t.muted;
    }
  };

  const getStageStyles = (stage) => {
    const c = stageColor(stage);
    return {
      background: dark ? `rgba(${hexToRgb(c)}, 0.1)` : `rgba(${hexToRgb(c)}, 0.15)`,
      color: c,
      border: `1px solid rgba(${hexToRgb(c)}, 0.2)`
    };
  };

  const hexToRgb = (hex) => {
    if(!hex) return '255,255,255';
    let c = hex.substring(1).split('');
    if(c.length === 3){ c= [c[0], c[0], c[1], c[1], c[2], c[2]]; }
    c = '0x' + c.join('');
    return [(c>>16)&255, (c>>8)&255, c&255].join(',');
  };

  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: mobile ? "4px 2px 0" : "8px 4px 0", flexShrink: 0, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: compact ? 12 : 24, flex: 1, minWidth: 0, marginLeft: mobile ? 48 : 0 }}>
          <h1 style={{ fontSize: mobile ? 22 : 28, fontWeight: 700, letterSpacing: -0.6, flexShrink: 0 }}>CRM Pipeline</h1>
          
          <div style={{ display: "flex", background: t.input, borderRadius: 12, border: `1px solid ${t.inputBorder}`, padding: 3, flexShrink: 0 }}>
            {[{ id: "table", label: "List", ic: IC.grid }, { id: "board", label: "Board", ic: IC.chart }].map((v) => (
              <button key={v.id} onClick={() => setView(v.id)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 9, fontSize: 13, fontWeight: view === v.id ? 600 : 500,
                color: view === v.id ? t.accentText : t.sub, background: view === v.id ? t.accentGrad : "transparent",
                boxShadow: view === v.id ? t.accentGlow : "none", border: "none", cursor: "pointer", transition: ease
              }}>
                <div style={{ width: 14, height: 14 }}>{v.ic}</div>
                {!mobile && <span>{v.label}</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {!compact && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: 38, borderRadius: 20, background: t.card, border: `1px solid ${t.cardBorder}`, color: t.sub, backdropFilter: "blur(20px)" }}>
              {IC.search}<input placeholder="Search deals..." style={{ border: "none", background: "transparent", color: t.text, fontSize: 13, outline: "none", width: 120 }} />
            </div>
          )}
          <button onClick={() => setModalOpen(true)} style={{ height: 38, padding: "0 16px", borderRadius: 20, border: "none", background: t.text, color: t.shell, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", boxShadow: `0 4px 14px rgba(0,0,0,0.15)` }}>
            <span style={{ fontSize: 16 }}>+</span> New
          </button>
        </div>
      </header>

      {/* Main CRM Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative", animation: "fadeUp 0.4s ease backwards", paddingBottom: 12 }}>
        
        {view === "table" ? (
          <div style={{ ...card({ padding: 0 }), flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${t.divider}`, fontSize: 12, fontWeight: 600, color: t.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
              <div style={{ flex: 2, minWidth: 150 }}>Contact</div>
              <div style={{ flex: 1.5, minWidth: 120 }}>Company</div>
              <div style={{ flex: 1, minWidth: 100 }}>Stage</div>
              <div style={{ flex: 1, minWidth: 100 }}>Deal Value</div>
              <div style={{ flex: 1, minWidth: 100 }}>Last Act.</div>
              <div style={{ width: 40, textAlign: "right" }}></div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading && <div style={{ padding: 20, textAlign: "center", color: t.muted }}>Loading data...</div>}
              {!loading && contacts.length === 0 && <div style={{ padding: 20, textAlign: "center", color: t.muted }}>No prospects yet. Add one!</div>}
              {contacts.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: i < contacts.length - 1 ? `1px solid ${t.divider}` : "none", transition: ease, cursor: "pointer", ':hover': { background: t.input } }}>
                  <div style={{ flex: 2, minWidth: 150, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${c.color}, ${c.color}aa)`, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#000" : "#fff", fontWeight: 700, fontSize: 14 }}>
                      {c.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: t.sub }}>{c.email}</div>
                    </div>
                  </div>
                  <div style={{ flex: 1.5, minWidth: 120, fontSize: 14, color: t.text }}>{c.company}</div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600, ...getStageStyles(c.stage) }}>{c.stage}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 100, fontSize: 14, fontWeight: 600, color: t.text, fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
                  <div style={{ flex: 1, minWidth: 100, fontSize: 13, color: t.sub }}>{c.lastContact}</div>
                  <div style={{ width: 40, textAlign: "right", color: t.muted }}>{IC.dots}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", gap: 16, overflowX: "auto", overflowY: "hidden", marginTop: 12, paddingRight: 4, paddingBottom: 10 }}>
            {STAGES.map(stage => {
              const stageDeals = contacts.filter(c => c.stage === stage);
              return (
                <div key={stage} style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: stageColor(stage) }} />
                      <h3 style={{ fontSize: 14, fontWeight: 600 }}>{stage}</h3>
                      <span style={{ fontSize: 11, background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 10, padding: "2px 8px", color: t.sub }}>{stageDeals.length}</span>
                    </div>
                    <button style={{ background: "none", border: "none", color: t.sub, cursor: "pointer" }}>{IC.dots}</button>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 20 }}>
                    {stageDeals.map(c => (
                      <div key={c.id} style={{ ...card({ padding: "16px" }), cursor: "grab", animation: "fadeUp 0.3s ease backwards" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: stageColor(stage), background: `rgba(${hexToRgb(stageColor(stage))}, 0.1)`, padding: "4px 8px", borderRadius: 8 }}>{c.company}</span>
                          <span style={{ color: t.muted }}>{IC.dots}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 4 }}>{c.value}</div>
                        <div style={{ fontSize: 13, color: t.sub, marginBottom: 16 }}>{c.name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${t.divider}`, paddingTop: 12 }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${c.color}, ${c.color}aa)`, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#000" : "#fff", fontWeight: 700, fontSize: 11 }}>
                            {c.avatar}
                          </div>
                          <div style={{ fontSize: 11, color: t.muted, display: "flex", alignItems: "center", gap: 4 }}>
                            {IC.help} {c.lastContact}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button style={{ padding: "12px", borderRadius: 16, border: `1px dashed ${t.cardBorder}`, background: "transparent", color: t.sub, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", transition: ease, ':hover': { background: t.input } }}>
                      <span>+</span> Add Deal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: t.card, padding: 24, borderRadius: 20, width: 360, boxShadow: t.cardShadow, border: `1px solid ${t.cardBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>New Pipeline Deal</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: t.sub, cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: t.sub, marginBottom: 4 }}>Contact Name</label>
                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: t.sub, marginBottom: 4 }}>Company</label>
                  <input required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: t.sub, marginBottom: 4 }}>Deal Value ($)</label>
                  <input required type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text }} />
                </div>
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: 12, color: t.sub, marginBottom: 4 }}>Email</label>
                 <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: t.sub, marginBottom: 4 }}>Initial Stage</label>
                <select value={formData.stage} onChange={e => setFormData({ ...formData, stage: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, appearance: 'none', cursor: 'pointer' }}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: 'none', background: t.accentGrad, color: t.accentText, fontWeight: 700, cursor: 'pointer', boxShadow: t.accentGlow }}>
                Add Deal
              </button>
            </form>
          </div>
        </div>
      )}

    </>
  );
}

