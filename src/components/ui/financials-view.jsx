import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Plus } from 'lucide-react';

export default function FinancialsView({ t, dark, mobile, compact, IC, pal, VOLT }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ desc: '', amount: '', type: 'income', account: 'Bank' });

  useEffect(() => {
    if (user) {
      fetchFinancials();
    }
  }, [user]);

  async function fetchFinancials() {
    const [txRes, invRes] = await Promise.all([
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false })
    ]);
    
    if (txRes.data) {
      setTransactions(txRes.data.map(d => ({
        id: d.id, desc: d.description, amount: d.amount, type: d.type, 
        status: d.status, account: d.account || 'Bank', date: d.transaction_date || d.created_at.split('T')[0]
      })));
    }
    if (invRes.data) {
      setInvoices(invRes.data.map(d => ({
        id: d.id, client: d.client_name, amount: d.amount, status: d.status, due: d.due_date || d.created_at.split('T')[0]
      })));
    }
    setLoading(false);
    setLoading(false);
  }

  const handleCreateTx = async (e) => {
    e.preventDefault();
    if (!user) return;
    const { desc, amount, type, account } = formData;
    await supabase.from('transactions').insert([{
      user_id: user.id,
      description: desc || 'Untitled',
      amount: parseFloat(amount) || 0,
      type,
      account,
      status: 'completed',
    }]);
    setModalOpen(false);
    fetchFinancials();
  };

  const ease = "all 0.45s cubic-bezier(.4,0,.2,1)";
  const card = (ex = {}) => ({
    background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20,
    boxShadow: t.cardShadow, transition: ease, backdropFilter: "blur(24px) saturate(1.6)", ...ex
  });

  return (
    <div style={{ padding: mobile ? "10px 4px" : "14px 10px", animation: "fadeUp 0.4s ease backwards", minWidth: 0 }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: mobile ? 22 : 28, fontWeight: 700, letterSpacing: -0.6 }}>Financials</h1>
          <p style={{ fontSize: 13, color: t.sub, marginTop: 4, fontWeight: 500 }}>Manage operations, revenue, and expenses.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{
            background: t.input, border: `1px solid ${t.inputBorder}`, padding: "8px 14px", borderRadius: 12,
            color: t.sub, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: ease
          }}>Export CSV</button>
          <button onClick={() => setModalOpen(true)} style={{
            background: t.accentGrad, border: "none", padding: "8px 16px", borderRadius: 12,
            color: t.accentText, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            boxShadow: t.accentGlow
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            New Transaction
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: compact ? (mobile ? "1fr" : "1fr 1fr") : "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
        {[ 
          { label: "Total Balance", val: "$48,290.00", ic: "dollar", c: pal.teal, up: true, ch: "+12.5%" },
          { label: "Total Income", val: "$16,900.00", ic: "tUp", c: { base: VOLT, glow: pal.volt.glow }, up: true, ch: "+8.2%" },
          { label: "Total Expenses", val: "$845.00", ic: "tDn", c: pal.coral, up: false, ch: "-2.1%" },
        ].map((s, i) => (
           <div key={i} style={{ ...card({ padding: "20px 22px", position: "relative", overflow: "hidden" }), animation: `fadeUp 0.4s ease ${i * 0.05}s backwards` }}>
             <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: s.c.base, opacity: dark ? 0.08 : 0.04, filter: "blur(30px)", pointerEvents: "none" }} />
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
               <div style={{ width: 36, height: 36, borderRadius: 12, background: s.c.glow, display: "flex", alignItems: "center", justifyContent: "center", color: s.c.base }}>
                 {IC[s.ic] || <svg width="16" height="16" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/></svg>}
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: 4, background: s.up ? "rgba(204,253,1,0.1)" : "rgba(255,98,89,0.1)", padding: "4px 8px", borderRadius: 10 }}>
                 <span style={{ color: s.up ? VOLT : pal.coral.base, display: "flex" }}>{s.up ? IC.tUp : IC.tDn}</span>
                 <span style={{ fontSize: 11, fontWeight: 600, color: s.up ? VOLT : pal.coral.base }}>{s.ch}</span>
               </div>
             </div>
             <div style={{ fontSize: 13, color: t.sub, fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
             <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: t.text }}>{s.val}</div>
           </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 340px", gap: 12 }}>
        
        {/* Transactions List */}
        <div style={{ ...card({ padding: 0 }), overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: dark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Transactions</h3>
            <button style={{ color: t.muted, background: "none", border: "none", cursor: "pointer" }}>{IC.dots}</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr>
                  {["Transaction", "Date", "Account", "Amount"].map((h, i) => (
                    <th key={i} style={{ padding: "12px 20px", textAlign: i === 3 ? "right" : "left", fontSize: 12, fontWeight: 500, color: t.muted, borderBottom: `1px solid ${t.divider}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: t.muted }}>Loading transactions...</td></tr>}
                {!loading && transactions.length === 0 && <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: t.muted }}>No transactions.</td></tr>}
                {transactions.map((tr) => (
                  <tr key={tr.id} style={{ transition: ease, cursor: "pointer" }} onMouseEnter={(e)=>e.currentTarget.style.background=dark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)"} onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding: "16px 20px", borderBottom: `1px solid ${t.divider}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: tr.type === 'income' ? pal.volt.glow : pal.coral.glow, display: "flex", alignItems: "center", justifyContent: "center", color: tr.type === 'income' ? VOLT : pal.coral.base }}>
                          {tr.type === 'income' ? IC.tUp : IC.tDn}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{tr.desc}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", borderBottom: `1px solid ${t.divider}`, fontSize: 13, color: t.sub }}>{tr.date}</td>
                    <td style={{ padding: "16px 20px", borderBottom: `1px solid ${t.divider}`, fontSize: 13, color: t.sub }}>{tr.account}</td>
                    <td style={{ padding: "16px 20px", borderBottom: `1px solid ${t.divider}`, fontSize: 14, fontWeight: 600, color: tr.type === 'income' ? VOLT : t.text, textAlign: "right" }}>
                      {tr.type === 'income' ? '+' : '-'}${Math.abs(tr.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "14px 20px", textAlign: "center", borderTop: `1px solid ${t.divider}` }}>
             <button style={{ background: "none", border: "none", color: t.sub, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: ease }} onMouseEnter={e=>e.currentTarget.style.color=t.text} onMouseLeave={e=>e.currentTarget.style.color=t.sub}>View All Transactions</button>
          </div>
        </div>

        {/* Invoices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...card({ padding: "18px 20px" }) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Outstanding Invoices</h3>
              <button style={{ color: t.muted, background: "none", border: "none" }}>{IC.dots}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {loading && <div style={{ padding: 20, textAlign: 'center', color: t.muted }}>Loading...</div>}
              {!loading && invoices.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: t.muted }}>No invoices found.</div>}
              {invoices.map((inv) => (
                <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: t.input, borderRadius: 14, border: `1px solid ${t.inputBorder}`, transition: ease }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 2 }}>{inv.client}</div>
                    <div style={{ fontSize: 11, color: t.sub, display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.id}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: t.muted }} />
                      <span>Due {inv.due}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>${inv.amount.toLocaleString()}</span>
                    <span style={{ 
                      fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6, marginTop: 4, textTransform: "uppercase",
                      background: inv.status === 'paid' ? pal.volt.glow : inv.status === 'pending' ? pal.amber.glow : pal.coral.glow,
                      color: inv.status === 'paid' ? VOLT : inv.status === 'pending' ? pal.amber.base : pal.coral.base
                    }}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* New Transaction Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: t.card, padding: 24, borderRadius: 20, width: 360, boxShadow: t.cardShadow, border: `1px solid ${t.cardBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>New Transaction</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: t.sub, cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTx} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: t.sub, marginBottom: 4 }}>Description</label>
                <input required value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: t.sub, marginBottom: 4 }}>Amount ($)</label>
                <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: t.sub, marginBottom: 4 }}>Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, appearance: 'none', cursor: 'pointer' }}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: t.sub, marginBottom: 4 }}>Account</label>
                  <select value={formData.account} onChange={e => setFormData({ ...formData, account: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, appearance: 'none', cursor: 'pointer' }}>
                    <option value="Bank">Bank</option>
                    <option value="Stripe">Stripe</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <button type="submit" style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: 'none', background: t.accentGrad, color: t.accentText, fontWeight: 700, cursor: 'pointer', boxShadow: t.accentGlow }}>
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

