import React, { useState } from 'react';
import { Package, Link, CheckCircle, AlertCircle, PlayCircle, Plus, Eye, Check } from 'lucide-react';

// MOCK_DELIVERABLES replaced with dynamic fetching

export default function DeliverablesView({ t, dark, mobile, onLaunchPortal }) {
  const ease = "all 0.45s cubic-bezier(.4,0,.2,1)";
  const { user } = useAuth();
  const [delivs, setDelivs] = useState([]);
  
  React.useEffect(() => {
    if (user) {
      // For MVP, we can map documents to deliverables visually or fetch a separate deliverables table if added later.
      // We will just fetch documents since they share schema traits.
      supabase.from('documents').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        if (data) {
          setDelivs(data.map(d => ({
            id: d.id,
            name: d.title,
            project: d.folder || 'General',
            client: 'Client',
            status: d.is_pinned ? 'Approved' : 'Draft',
            revsUsed: 0,
            revsMax: 3,
            lastUpdated: new Date(d.updated_at).toLocaleDateString()
          })));
        }
      });
    }
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.6 }}>Deliverables Tracker</h1>
          <div style={{ fontSize: 13, color: t.sub, marginTop: 4 }}>Manage client review links, revision limits, and approvals.</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onLaunchPortal} style={{ padding: "0 16px", height: 36, borderRadius: 18, border: `1px solid ${t.cardBorder}`, background: t.input, color: t.text, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <PlayCircle size={16} /> Test Client Portal Mockup
          </button>
          <button style={{ padding: "0 16px", height: 36, borderRadius: 18, border: "none", background: t.accentGrad, color: t.accentText, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", boxShadow: t.accentGlow }}>
            <Plus size={16} /> New Deliverable
          </button>
        </div>
      </div>

      <div style={{ flex: 1, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', overflowY: 'auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr auto', padding: '16px 20px', borderBottom: `1px solid ${t.divider}`, background: dark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Deliverable & Project</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Client</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Revision Limit</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Actions</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {delivs.map(d => {
            const isRed = d.revsUsed >= d.revsMax;
            const isAmber = d.revsUsed === d.revsMax - 1;
            const barColor = isRed ? '#FF3B30' : (isAmber ? '#FFB340' : '#34C759');
            
            return (
              <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr auto', padding: '16px 20px', borderBottom: `1px solid ${t.divider}`, alignItems: 'center', transition: ease, ':hover': { background: t.input } }}>
                
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PlayCircle size={14} style={{ color: t.sub }} /> {d.name}
                  </div>
                  <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>{d.project}</div>
                </div>
                
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                  {d.client}
                </div>
                
                <div>
                  <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '4px 8px', borderRadius: 8,
                    background: d.status === 'Approved' ? 'rgba(52,199,89,0.1)' : d.status === 'Changes Requested' ? 'rgba(255,179,64,0.1)' : d.status === 'Shared' ? 'rgba(90,200,250,0.1)' : t.input,
                    color: d.status === 'Approved' ? '#34C759' : d.status === 'Changes Requested' ? '#FFB340' : d.status === 'Shared' ? '#5AC8FA' : t.sub,
                    border: `1px solid ${d.status === 'Approved' ? 'rgba(52,199,89,0.2)' : d.status === 'Changes Requested' ? 'rgba(255,179,64,0.2)' : d.status === 'Shared' ? 'rgba(90,200,250,0.2)' : t.inputBorder}`
                  }}>
                    {d.status === 'Approved' && <CheckCircle size={12} />}
                    {d.status === 'Changes Requested' && <AlertCircle size={12} />}
                    {d.status === 'Shared' && <Eye size={12} />}
                    {d.status === 'Draft' && <Package size={12} />}
                    {d.status}
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: t.input, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${(d.revsUsed / d.revsMax) * 100}%`, height: '100%', background: barColor, borderRadius: 3, transition: ease }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.text, width: 32 }}>{d.revsUsed}/{d.revsMax}</span>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.input, color: t.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: ease, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link size={14} /> Copy Link
                  </button>
                  {d.status === 'Changes Requested' && (
                    <button style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: t.accentGrad, color: t.accentText, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: t.accentGlow }}>
                      <Check size={14} /> Resolve 2
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
