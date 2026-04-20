import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X } from 'lucide-react';
import { formatMoney, getCurrency } from './settings-view';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function monthKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function shortMonth(yyyy_mm) {
  const [y, m] = yyyy_mm.split('-');
  return new Date(+y, +m - 1).toLocaleString('default', { month: 'short' });
}

function isOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date() && new Date(dueDateStr).toDateString() !== new Date().toDateString();
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
const SK_STYLE = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '400% 100%',
  animation: 'finSK 1.5s ease infinite',
  borderRadius: 8,
};

function SkRow() {
  return (
    <tr>
      <td style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...SK_STYLE, width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ ...SK_STYLE, width: '55%', height: 13 }} />
        </div>
      </td>
      <td style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}><div style={{ ...SK_STYLE, width: 70, height: 12 }} /></td>
      <td style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}><div style={{ ...SK_STYLE, width: 50, height: 12 }} /></td>
      <td style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right' }}><div style={{ ...SK_STYLE, width: 60, height: 13, marginLeft: 'auto' }} /></td>
    </tr>
  );
}

// ─── Mini SVG bar chart ───────────────────────────────────────────────────────
function MonthlyBarChart({ months, dark, VOLT, pal }) {
  const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expenses)), 1);
  const barW = 14;
  const gap = 6;
  const chartH = 80;
  const totalW = months.length * (barW * 2 + gap + 8);

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <svg width={totalW} height={chartH + 30} style={{ display: 'block' }}>
        {months.map((m, i) => {
          const x = i * (barW * 2 + gap + 8);
          const incH = (m.income / maxVal) * chartH;
          const expH = (m.expenses / maxVal) * chartH;
          return (
            <g key={m.key}>
              {/* Income bar */}
              <rect x={x} y={chartH - incH} width={barW} height={incH}
                fill={VOLT} opacity={0.85} rx={3} />
              {/* Expense bar */}
              <rect x={x + barW + 3} y={chartH - expH} width={barW} height={expH}
                fill={pal.coral.base} opacity={0.7} rx={3} />
              {/* Month label */}
              <text x={x + barW} y={chartH + 16} textAnchor="middle"
                fill={dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                fontSize={9} fontFamily="-apple-system,sans-serif">
                {shortMonth(m.key)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FinancialsView({ t, dark, mobile, compact, IC, pal, VOLT }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ desc: '', amount: '', type: 'income', account: 'Bank', date: new Date().toISOString().slice(0,10) });
  const [taxRate, setTaxRate] = useState(() => {
    try { return Number(localStorage.getItem('nomaad_tax_rate') || 25); } catch { return 25; }
  });
  const [editingTax, setEditingTax] = useState(false);

  const currency = getCurrency();

  useEffect(() => {
    if (user) fetchFinancials();
  }, [user]);

  async function fetchFinancials() {
    setLoading(true);
    try {
      const thirteenMonthsAgo = new Date();
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 12);

      const [txRes, invRes] = await Promise.all([
        supabase.from('transactions').select('*').gte('created_at', thirteenMonthsAgo.toISOString()).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false })
      ]);

      if (txRes.data) {
        setTransactions(txRes.data.map(d => ({
          id: d.id,
          desc: d.description || 'Untitled',
          amount: Number(d.amount) || 0,
          type: d.type,
          status: d.status,
          account: d.account || 'Bank',
          date: d.transaction_date || d.created_at?.slice(0, 10) || '',
          created_at: d.created_at,
          category: d.category || null,
        })));
      }
      if (invRes.data) {
        setInvoices(invRes.data.map(d => ({
          id: d.id,
          number: d.number,
          client: d.client_name || '—',
          amount: Number(d.amount) || 0,
          status: d.status,
          due: d.due_date || d.created_at?.slice(0, 10) || '',
          paid_at: d.paid_at,
        })));
      }
    } catch (err) {
      console.error("fetchFinancials:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Computed stats ──────────────────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { totalIncome, totalExpenses, monthIncome, monthExpenses } = useMemo(() => {
    let ti = 0, te = 0, mi = 0, me = 0;
    transactions.forEach(tx => {
      const d = new Date(tx.created_at || tx.date);
      if (tx.type === 'income') { ti += tx.amount; if (d >= monthStart) mi += tx.amount; }
      else if (tx.type === 'expense') { te += tx.amount; if (d >= monthStart) me += tx.amount; }
    });
    return { totalIncome: ti, totalExpenses: te, monthIncome: mi, monthExpenses: me };
  }, [transactions]);

  const netProfit = totalIncome - totalExpenses;
  const taxPot = Math.max(netProfit * taxRate / 100, 0);

  // ── 12-month chart data ─────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[k] = { key: k, income: 0, expenses: 0 };
    }
    transactions.forEach(tx => {
      const k = monthKey(tx.created_at || tx.date);
      if (map[k]) {
        if (tx.type === 'income') map[k].income += tx.amount;
        else if (tx.type === 'expense') map[k].expenses += tx.amount;
      }
    });
    return Object.values(map);
  }, [transactions]);

  // ── Expense breakdown ───────────────────────────────────────────────────────
  const expenseBreakdown = useMemo(() => {
    const cats = {};
    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
      const cat = tx.category || tx.account || 'Other';
      cats[cat] = (cats[cat] || 0) + tx.amount;
    });
    const total = Object.values(cats).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount, pct: Math.round(amount / total * 100) }));
  }, [transactions]);

  const overdueInvoices = invoices.filter(inv => inv.status !== 'paid' && isOverdue(inv.due));
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');

  const ease = "all 0.3s cubic-bezier(.4,0,.2,1)";
  const card = (ex = {}) => ({
    background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20,
    boxShadow: t.cardShadow, backdropFilter: "blur(24px) saturate(1.6)", ...ex
  });

  const handleCreateTx = async (e) => {
    e.preventDefault();
    if (!user) return;
    const { desc, amount, type, account, date } = formData;
    await supabase.from('transactions').insert([{
      user_id: user.id,
      description: desc || 'Untitled',
      amount: parseFloat(amount) || 0,
      type,
      account,
      transaction_date: date || new Date().toISOString().slice(0, 10),
      status: 'completed',
    }]);
    setModalOpen(false);
    setFormData({ desc: '', amount: '', type: 'income', account: 'Bank', date: new Date().toISOString().slice(0, 10) });
    fetchFinancials();
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minWidth: 0, animation: "fadeUp 0.4s ease backwards" }}>

      {/* Keyframe injection */}
      <style>{`
        @keyframes finSK { 0%,100% { background-position: 100% 50%; } 50% { background-position: 0% 50%; } }
      `}</style>

      {/* ── Header ── */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: mobile ? 22 : 26, fontWeight: 700, letterSpacing: -0.6 }}>Financials</h1>
          <p style={{ fontSize: 13, color: t.sub, marginTop: 3 }}>Income, expenses and tax at a glance.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Quick income */}
          <button
            onClick={() => { setFormData(f => ({ ...f, type: 'income' })); setModalOpen(true); }}
            style={{ height: 34, padding: "0 14px", borderRadius: 12, background: "rgba(204,253,1,0.1)", border: `1px solid ${VOLT}33`, color: VOLT, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Income
          </button>
          {/* Quick expense */}
          <button
            onClick={() => { setFormData(f => ({ ...f, type: 'expense' })); setModalOpen(true); }}
            style={{ height: 34, padding: "0 14px", borderRadius: 12, background: "rgba(255,98,89,0.1)", border: "1px solid rgba(255,98,89,0.25)", color: pal.coral.base, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Expense
          </button>
          <button onClick={() => setModalOpen(true)} style={{
            height: 34, padding: "0 16px", borderRadius: 12, background: t.accentGrad, border: "none",
            color: t.accentText, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            boxShadow: t.accentGlow,
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            New Transaction
          </button>
        </div>
      </header>

      {/* ── Overdue banner ── */}
      {overdueInvoices.length > 0 && (
        <div style={{ ...card({ padding: "12px 18px", marginBottom: 14, background: dark ? "rgba(255,98,89,0.08)" : "rgba(255,98,89,0.05)", border: "1px solid rgba(255,98,89,0.2)" }), display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,98,89,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={pal.coral.base} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: pal.coral.base }}>
              {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>
              {overdueInvoices.map(i => i.client).join(', ')} · Total {formatMoney(overdueInvoices.reduce((s, i) => s + i.amount, 0))}
            </div>
          </div>
        </div>
      )}

      {/* ── KPI stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : compact ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
        {[
          { label: "Total Income", val: formatMoney(totalIncome), sub: `${formatMoney(monthIncome)} this month`, ic: "tUp", c: { base: VOLT, glow: pal.volt.glow } },
          { label: "Total Expenses", val: formatMoney(totalExpenses), sub: `${formatMoney(monthExpenses)} this month`, ic: "tDn", c: pal.coral },
          { label: "Net Profit", val: formatMoney(netProfit), sub: netProfit >= 0 ? "You're in profit 🎉" : "Watch your spend", ic: "dollar", c: netProfit >= 0 ? pal.teal : pal.coral },
          { label: "Tax Pot", val: formatMoney(taxPot), sub: `${taxRate}% of net · set aside`, ic: "expense", c: pal.amber },
        ].map((s, i) => (
          <div key={i} style={{ ...card({ padding: "16px 18px", position: "relative", overflow: "hidden" }), animation: `fadeUp 0.4s ease ${i * 0.05}s backwards` }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: s.c.base, opacity: dark ? 0.08 : 0.04, filter: "blur(30px)", pointerEvents: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: t.sub }}>{s.label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: s.c.glow, display: "flex", alignItems: "center", justifyContent: "center", color: s.c.base, flexShrink: 0 }}>
                {IC[s.ic] || '💰'}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: t.text, marginBottom: 4 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: t.muted }}>{s.sub}</div>
            {/* Tax rate editor */}
            {i === 3 && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                {editingTax ? (
                  <input
                    type="number" min="0" max="60" value={taxRate}
                    onChange={e => { const v = Math.max(0, Math.min(60, Number(e.target.value))); setTaxRate(v); try { localStorage.setItem('nomaad_tax_rate', String(v)); } catch {} }}
                    onBlur={() => setEditingTax(false)}
                    autoFocus
                    style={{ width: 48, padding: "2px 6px", borderRadius: 6, border: `1px solid ${VOLT}55`, background: "rgba(204,253,1,0.08)", color: VOLT, fontSize: 12, fontWeight: 700, outline: "none" }}
                  />
                ) : (
                  <button onClick={() => setEditingTax(true)} style={{ background: "none", border: "none", padding: 0, color: pal.amber.base, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Change rate
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── 12-month bar chart ── */}
      <div style={{ ...card({ padding: "18px 20px", marginBottom: 14 }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>12-Month Overview</h3>
            <div style={{ display: "flex", gap: 14 }}>
              {[{ c: VOLT, l: "Income" }, { c: pal.coral.base, l: "Expenses" }].map((lg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: lg.c }} />
                  <span style={{ fontSize: 11.5, color: t.sub }}>{lg.l}</span>
                </div>
              ))}
            </div>
          </div>
          {loading && <div style={{ fontSize: 12, color: t.muted }}>Loading…</div>}
        </div>
        {loading ? (
          <div style={{ ...SK_STYLE, height: 100, borderRadius: 12 }} />
        ) : (
          <MonthlyBarChart months={monthlyData} dark={dark} VOLT={VOLT} pal={pal} />
        )}
      </div>

      {/* ── Main two-column ── */}
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 320px", gap: 14 }}>

        {/* Transactions table */}
        <div style={{ ...card({ padding: 0 }), overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Transactions</h3>
            <span style={{ fontSize: 11, color: t.muted }}>{transactions.length} records</span>
          </div>
          <div style={{ overflowX: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
              <thead>
                <tr>
                  {["Transaction", "Date", "Account", "Amount"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 20px", textAlign: i === 3 ? "right" : "left", fontSize: 11, fontWeight: 600, color: t.muted, borderBottom: `1px solid ${t.divider}`, letterSpacing: 0.4, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 5 }).map((_, i) => <SkRow key={i} />)}
                {!loading && transactions.length === 0 && (
                  <tr><td colSpan="4" style={{ padding: "32px 20px", textAlign: "center", color: t.muted, fontSize: 13 }}>No transactions yet. Add your first one above.</td></tr>
                )}
                {!loading && transactions.map((tr) => (
                  <tr key={tr.id} style={{ transition: ease, cursor: "default" }}
                    onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "13px 20px", borderBottom: `1px solid ${t.divider}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: tr.type === 'income' ? "rgba(204,253,1,0.12)" : "rgba(255,98,89,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: tr.type === 'income' ? VOLT : pal.coral.base, flexShrink: 0 }}>
                          {tr.type === 'income' ? IC.tUp : IC.tDn}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{tr.desc}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: `1px solid ${t.divider}`, fontSize: 12, color: t.sub }}>{tr.date}</td>
                    <td style={{ padding: "13px 20px", borderBottom: `1px solid ${t.divider}`, fontSize: 12, color: t.sub }}>{tr.account}</td>
                    <td style={{ padding: "13px 20px", borderBottom: `1px solid ${t.divider}`, fontSize: 13, fontWeight: 600, color: tr.type === 'income' ? VOLT : t.text, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {tr.type === 'income' ? '+' : '-'}{formatMoney(Math.abs(tr.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Outstanding Invoices */}
          <div style={{ ...card({ padding: "16px 18px" }) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Invoices</h3>
              <span style={{ fontSize: 11, color: t.muted }}>{unpaidInvoices.length} unpaid</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ ...SK_STYLE, height: 52, borderRadius: 12 }} />
              ))}
              {!loading && invoices.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", color: t.muted, fontSize: 13 }}>No invoices yet.</div>
              )}
              {!loading && invoices.slice(0, 6).map((inv) => {
                const overdue = isOverdue(inv.due) && inv.status !== 'paid';
                return (
                  <div key={inv.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", background: overdue ? "rgba(255,98,89,0.06)" : t.input,
                    borderRadius: 12, border: `1px solid ${overdue ? "rgba(255,98,89,0.2)" : t.inputBorder}`,
                    transition: ease,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {inv.client || inv.number || `INV-${inv.id.slice(0, 6)}`}
                      </div>
                      <div style={{ fontSize: 11, color: overdue ? pal.coral.base : t.muted, marginTop: 2 }}>
                        {overdue ? `⚠ Overdue · ` : `Due `}{inv.due}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{formatMoney(inv.amount)}</div>
                      <div style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 5, marginTop: 3, textTransform: "uppercase",
                        background: inv.status === 'paid' ? "rgba(204,253,1,0.1)" : inv.status === 'pending' ? pal.amber.glow : "rgba(255,98,89,0.1)",
                        color: inv.status === 'paid' ? VOLT : inv.status === 'pending' ? pal.amber.base : pal.coral.base,
                      }}>{inv.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expense breakdown */}
          {!loading && expenseBreakdown.length > 0 && (
            <div style={{ ...card({ padding: "16px 18px" }) }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Expense Breakdown</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {expenseBreakdown.map((cat, i) => (
                  <div key={cat.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{cat.name}</span>
                      <span style={{ fontSize: 12, color: t.sub, fontVariantNumeric: "tabular-nums" }}>{cat.pct}% · {formatMoney(cat.amount)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: t.input, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${cat.pct}%`, background: [VOLT, pal.coral.base, pal.amber.base, pal.teal.base, "#AF52DE"][i % 5], borderRadius: 2, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tax Pot reminder */}
          <div style={{ ...card({ padding: "16px 18px", background: dark ? "rgba(255,179,64,0.06)" : "rgba(255,179,64,0.05)", border: "1px solid rgba(255,179,64,0.18)" }) }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>🏦</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: pal.amber.base, marginBottom: 4 }}>Tax Pot</div>
                <div style={{ fontSize: 12, color: t.sub, lineHeight: 1.6 }}>
                  Set aside <strong style={{ color: t.text }}>{formatMoney(taxPot)}</strong> ({taxRate}% of net {formatMoney(netProfit)} profit) for your tax bill.
                </div>
                <button onClick={() => setEditingTax(true)} style={{ marginTop: 8, background: "none", border: "none", color: pal.amber.base, fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                  Change tax rate →
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── New Transaction Modal ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }} onClick={() => setModalOpen(false)}>
          <div style={{ background: dark ? "#16161e" : "#fff", padding: 24, borderRadius: 20, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: `1px solid ${t.cardBorder}` }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: t.text }}>New Transaction</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Type toggle */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {['income', 'expense'].map(type => (
                <button key={type} onClick={() => setFormData(f => ({ ...f, type }))} style={{
                  flex: 1, padding: "8px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: formData.type === type ? (type === 'income' ? "rgba(204,253,1,0.12)" : "rgba(255,98,89,0.12)") : t.input,
                  border: `1px solid ${formData.type === type ? (type === 'income' ? VOLT + "44" : "rgba(255,98,89,0.35)") : t.inputBorder}`,
                  color: formData.type === type ? (type === 'income' ? VOLT : pal.coral.base) : t.sub,
                  transition: ease,
                  fontFamily: "inherit",
                }}>
                  {type === 'income' ? '↑ Income' : '↓ Expense'}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateTx} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: "Description", key: "desc", type: "text", placeholder: "What was this for?" },
                { label: "Amount", key: "amount", type: "number", placeholder: "0.00", step: "0.01" },
              ].map(({ label, key, ...rest }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.sub, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                  <input required value={formData[key]} onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                    {...rest}
                    onFocus={e => e.target.style.borderColor = VOLT}
                    onBlur={e => e.target.style.borderColor = t.inputBorder}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.sub, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Account</label>
                  <select value={formData.account} onChange={e => setFormData(f => ({ ...f, account: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 14, appearance: 'none', cursor: 'pointer', fontFamily: "inherit" }}>
                    {['Bank', 'Stripe', 'PayPal', 'Cash', 'Other'].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.sub, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              </div>
              <button type="submit" style={{ marginTop: 6, padding: '12px', borderRadius: 12, border: 'none', background: formData.type === 'income' ? `linear-gradient(135deg, ${VOLT}, #b8e300)` : `linear-gradient(135deg, #FF6259, #E8453C)`, color: formData.type === 'income' ? '#0a0a0a' : '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "inherit" }}>
                Save {formData.type === 'income' ? 'Income' : 'Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
