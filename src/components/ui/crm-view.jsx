import React, { useState } from "react";

const INITIAL_CONTACTS = [
  { id: 1, name: "Alice Freeman", email: "alice@acme.co", company: "Acme Corp", stage: "Active", value: "$12,400", lastContact: "2h ago", avatar: "A", color: "#5AC8FA" },
  { id: 2, name: "Bobby Tables", email: "bobby@drop.co", company: "Drop Inc.", stage: "Lead", value: "$4,500", lastContact: "1d ago", avatar: "B", color: "#FFB340" },
  { id: 3, name: "Carolina Herr", email: "carol@design.co", company: "CH Design", stage: "Negotiating", value: "$28,000", lastContact: "3d ago", avatar: "C", color: "#FF6259" },
  { id: 4, name: "David Kim", email: "david@build.io", company: "Build IO", stage: "Won", value: "$52,000", lastContact: "1w ago", avatar: "D", color: "#ccfd01" },
  { id: 5, name: "Evelyn Salt", email: "eve@sec.gov", company: "Securities", stage: "Active", value: "$8,900", lastContact: "2w ago", avatar: "E", color: "#ccfd01" },
  { id: 6, name: "Frank Wright", email: "frank@arch.com", company: "Arch Group", stage: "Lead", value: "$15,200", lastContact: "3w ago", avatar: "F", color: "#FFB340" },
  { id: 7, name: "Grace Hopper", email: "grace@navy.mil", company: "USN", stage: "Negotiating", value: "$120,000", lastContact: "1mo ago", avatar: "G", color: "#FF6259" },
];

const STAGES = ["Lead", "Negotiating", "Active", "Won"];

export default function CRMView({ t, dark, mobile, compact, mode, notifOpen, setNotifOpen, w, IC, pal, VOLT, VOLTD }) {
  const [view, setView] = useState("table"); // 'table' or 'board'
  const ease="all 0.45s cubic-bezier(.4,0,.2,1)";
  const card = (ex = {}) => ({ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20, boxShadow: t.cardShadow, transition: ease, backdropFilter: "blur(24px) saturate(1.6)", ...ex });

  const stageColor = (stage) => {
    switch (stage) {
      case "Lead": return pal.amber.base;
      case "Negotiating": return pal.coral.base;
      case "Active": return pal.teal.base;
      case "Won": return pal.volt.base;
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
          <button style={{ height: 38, padding: "0 16px", borderRadius: 20, border: "none", background: t.text, color: t.shell, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", boxShadow: `0 4px 14px rgba(0,0,0,0.15)` }}>
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
              {INITIAL_CONTACTS.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: i < INITIAL_CONTACTS.length - 1 ? `1px solid ${t.divider}` : "none", transition: ease, cursor: "pointer", ':hover': { background: t.input } }}>
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
              const stageDeals = INITIAL_CONTACTS.filter(c => c.stage === stage);
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
    </>
  );
}
