import React, { useState } from 'react';
import { FileText, Download, Send, Plus, Trash2, ChevronDown, CheckCircle2 } from 'lucide-react';

const DOC_TYPES = ['Invoice', 'Quote', 'Proposal', 'Contract', 'Pitch'];

export default function DocsView({ t, dark, mobile }) {
  const [docType, setDocType] = useState('Invoice');
  const [data, setData] = useState({
    client: 'Acme Corp',
    project: 'Winter Campaign Final',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: 'Thank you for your business. Payment is due within 14 days.',
    amount: 12500,
    items: [
      { desc: 'Pre-production & Strategy', price: 2500 },
      { desc: '2-Day Production (Crew + Gear)', price: 7000 },
      { desc: 'Post-production (Edit, Color, Audio)', price: 3000 }
    ]
  });
  
  const ease = "all 0.45s cubic-bezier(.4,0,.2,1)";
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const handleUpdate = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleItemUpdate = (idx, field, val) => {
    const newItems = [...data.items];
    newItems[idx][field] = field === 'price' ? parseFloat(val) || 0 : val;
    setData({ ...data, items: newItems });
  };

  const totalAmount = data.items.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', height: '100%', gap: 16 }}>
      
      {/* Left Pane: Editor */}
      <div style={{ width: mobile ? '100%' : 400, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: 24, boxShadow: t.cardShadow, backdropFilter: 'blur(24px) saturate(1.6)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>Doc Generator</h2>
            <div style={{ position: 'relative' }}>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ padding: '8px 32px 8px 16px', borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, fontWeight: 600, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: 10, color: t.sub, pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.sub, marginBottom: 4, textTransform: 'uppercase' }}>Client Name</label>
              <input name="client" value={data.client} onChange={handleUpdate} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.sub, marginBottom: 4, textTransform: 'uppercase' }}>Project</label>
              <input name="project" value={data.project} onChange={handleUpdate} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.sub, marginBottom: 4, textTransform: 'uppercase' }}>Issue Date</label>
                <input type="date" name="date" value={data.date} onChange={handleUpdate} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.sub, marginBottom: 4, textTransform: 'uppercase' }}>Valid Until</label>
                <input type="date" name="dueDate" value={data.dueDate} onChange={handleUpdate} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 14, outline: 'none' }} />
              </div>
            </div>
          </div>
          
          {/* Line Items */}
          {(docType === 'Invoice' || docType === 'Quote') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: t.text, borderBottom: `1px solid ${t.divider}`, paddingBottom: 8 }}>Line Items</h3>
              {data.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={item.desc} onChange={(e) => handleItemUpdate(idx, 'desc', e.target.value)} placeholder="Description" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: 'none' }} />
                  <input type="number" value={item.price} onChange={(e) => handleItemUpdate(idx, 'price', e.target.value)} placeholder="Price" style={{ width: 90, padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: 'none' }} />
                  <button onClick={() => setData({ ...data, items: data.items.filter((_, i) => i !== idx) })} style={{ background: 'transparent', border: 'none', color: t.sub, cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => setData({ ...data, items: [...data.items, { desc: '', price: 0 }] })} style={{ padding: "8px", borderRadius: 8, border: `1px dashed ${t.cardBorder}`, background: "transparent", color: t.sub, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", transition: ease, ':hover': { background: t.input } }}>
                <Plus size={14} /> Add Item
              </button>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.sub, marginBottom: 4, textTransform: 'uppercase' }}>Notes / Terms</label>
            <textarea name="notes" value={data.notes} onChange={handleUpdate} rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: 'none', resize: 'vertical' }} />
          </div>

        </div>

        {/* Global actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button style={{ padding: '14px', borderRadius: 16, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", boxShadow: t.cardShadow }}>
            <Download size={16} /> Export PDF
          </button>
          <button style={{ padding: '14px', borderRadius: 16, border: "none", background: t.accentGrad, color: t.accentText, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", boxShadow: t.accentGlow }}>
            <Send size={16} /> Send via Kinso
          </button>
        </div>

      </div>

      {/* Right Pane: Live Preview Container */}
      <div style={{ flex: 1, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: 24, boxShadow: t.cardShadow, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
        
        {/* The A4 "Paper" Component */}
        <div style={{ 
          width: '100%', maxWidth: 700, minHeight: 990, background: '#ffffff', color: '#111111', 
          borderRadius: 8, padding: 64, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', 
          fontFamily: '"Helvetica Neue", sans-serif', animation: 'fadeUp 0.4s ease backwards', position: 'relative' 
        }}>
          
          {/* Doc Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #eeeeee', paddingBottom: 32, marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, background: '#111', borderRadius: '50%' }} /> STATIC STUDIOS
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
                123 Creative Avenue, Suite 400<br/>New York, NY 10012<br/>hello@staticstudios.com
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, textTransform: 'uppercase', color: '#111' }}>{docType}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                <strong>Date:</strong> {data.date}<br/>
                <strong>Status:</strong> <span style={{ color: '#000' }}>Issued</span>
              </div>
            </div>
          </div>

          {/* Doc Meta / Client Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Bill To</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{data.client}</div>
              <div style={{ fontSize: 14, color: '#444', marginTop: 4 }}>{data.project}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Total Amount</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{formatter.format(docType === 'Invoice' || docType === 'Quote' ? totalAmount : data.amount)}</div>
              {data.dueDate && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}><strong>Due / Valid:</strong> {data.dueDate}</div>}
            </div>
          </div>

          {/* Doc Body */}
          {(docType === 'Invoice' || docType === 'Quote') ? (
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '4fr 1fr', borderBottom: '1px solid #ddd', paddingBottom: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>Description</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right' }}>Amount</div>
              </div>
              
              {data.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '4fr 1fr', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ fontSize: 14, color: '#222', fontWeight: 500 }}>{item.desc || 'Item'}</div>
                  <div style={{ fontSize: 14, color: '#111', fontWeight: 600, textAlign: 'right' }}>{formatter.format(item.price)}</div>
                </div>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                <div style={{ width: 250 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f5f5f5', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: '#666' }}>Subtotal</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{formatter.format(totalAmount)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Total Due</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{formatter.format(totalAmount)}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 48 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Project Overview</h3>
              <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>We are thrilled to present this {docType.toLowerCase()} for the {data.project} initiative with {data.client}. Our team has tailored this comprehensive approach to meet your exact creative requirements, leveraging our expertise in high-end production.</p>
              
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 16 }}>Estimated Budget</h3>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{formatter.format(data.amount)}</div>
            </div>
          )}

          {/* Footer Notes */}
          <div style={{ marginTop: 'auto', paddingTop: 48, borderTop: '1px solid #eee' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Notes & Terms</div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{data.notes}</div>
          </div>
          
          <div style={{ position: 'absolute', bottom: 40, right: 64, opacity: 0.2 }}>
            <div style={{ width: 64, height: 64, border: '4px solid #111', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={32} color="#111" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
