import React, { useState } from 'react';
import { Play, Pause, Maximize, Volume2, Plus, MessageCircle, Send, CheckCircle2, AlertCircle, Pin } from 'lucide-react';

export default function ClientPortalView({ onExit }) {
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState(null); // 'approved' or 'changes'
  const [comments, setComments] = useState([
    { id: 1, author: 'Sarah Jenkins', text: 'Can we lose the first 2 seconds? It drags a little bit before the music kicks in.', timecode: '0:02', resolved: false },
    { id: 2, author: 'Marcus Chen', text: 'Color grading on the shoes looks way too saturated here. Pull it back 10%.', timecode: '1:24', resolved: false },
  ]);
  const [pinTime, setPinTime] = useState(true);
  
  const ease = "all 0.4s cubic-bezier(.4,0,.2,1)";

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a0a', display: 'flex', color: '#fff',
      fontFamily: '"Inter", "San Francisco", "Helvetica Neue", sans-serif', animation: 'fadeIn 0.3s ease'
    }}>
      
      {/* Top Header / Nav */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 360, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#aaa' }}>
          <span style={{ cursor: 'pointer' }} onClick={onExit}>← Exit Preview</span>
        </div>
        <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: 8, padding: 4 }}>
          <button style={{ background: '#333', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>V2</button>
          <button style={{ background: 'transparent', color: '#888', border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>V1</button>
        </div>
        <div style={{ width: 100 }} /> {/* spacer */}
      </div>

      {/* Main Video Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 80px 24px', background: '#0a0a0a' }}>
        
        {/* Mock Video Container */}
        <div style={{ width: '100%', maxWidth: 1200, aspectRatio: '16/9', background: '#111', borderRadius: 8, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          
          <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2370&ixlib=rb-4.0.3" alt="Video frame" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          
          {/* Mock Player Controls */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
            <Play size={20} fill="#fff" color="#fff" />
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '45%', background: '#ccfd01', borderRadius: 2 }} />
              {/* Pins on timeline */}
              <div style={{ position: 'absolute', left: '2%', top: -4, width: 2, height: 12, background: '#fff', borderRadius: 1 }} />
              <div style={{ position: 'absolute', left: '60%', top: -4, width: 2, height: 12, background: '#fff', borderRadius: 1 }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>1:24 / 2:30</div>
            <Volume2 size={18} color="#ccc" />
            <Maximize size={18} color="#ccc" />
          </div>
        </div>

      </div>

      {/* Right Sidebar (Comments & Actions) */}
      <div style={{ width: 360, background: '#141414', borderLeft: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
        
        {/* Sidebar Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #222' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Winter Campaign Final</h2>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Nike Running</div>
        </div>

        {/* Comments List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#aaa', flexShrink: 0 }}>
                {c.author.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{c.author}</span>
                  <span style={{ fontSize: 11, color: '#666' }}>Just now</span>
                </div>
                {c.timecode && (
                  <button style={{ padding: '4px 8px', borderRadius: 6, background: '#2a2a2a', border: '1px solid #333', color: '#ccfd01', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8, cursor: 'pointer' }}>
                    <Play size={10} fill="#ccfd01" /> {c.timecode}
                  </button>
                )}
                <p style={{ fontSize: 13, color: '#ccc', lineHeight: 1.5, margin: 0 }}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #222', background: '#1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: pinTime ? '#ccfd01' : '#888', fontWeight: 600 }}>
              <input type="checkbox" checked={pinTime} onChange={() => setPinTime(!pinTime)} style={{ display: 'none' }} />
              <Pin size={12} /> Pin to 1:24
            </label>
          </div>
          <div style={{ position: 'relative' }}>
            <textarea placeholder="Leave a comment..." style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13, outline: 'none', resize: 'none', minHeight: 80 }} />
            <button style={{ position: 'absolute', right: 8, bottom: 8, width: 28, height: 28, borderRadius: 6, background: '#ccfd01', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={14} color="#000" />
            </button>
          </div>
        </div>

        {/* Approval Actions */}
        <div style={{ padding: '24px', background: '#111', borderTop: '1px solid #222', display: 'flex', gap: 12 }}>
          {locked ? (
            <div style={{ flex: 1, padding: 16, borderRadius: 12, background: status === 'approved' ? 'rgba(52,199,89,0.1)' : 'rgba(255,179,64,0.1)', border: `1px solid ${status === 'approved' ? 'rgba(52,199,89,0.2)' : 'rgba(255,179,64,0.2)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {status === 'approved' ? <CheckCircle2 color="#34C759" size={24} /> : <AlertCircle color="#FFB340" size={24} />}
              <div style={{ fontSize: 14, fontWeight: 700, color: status === 'approved' ? '#34C759' : '#FFB340' }}>
                {status === 'approved' ? 'Deliverable Approved' : 'Changes Requested'}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>You have formally submitted your review.</div>
            </div>
          ) : (
            <>
              <button 
                onClick={() => { setStatus('changes'); setLocked(true); }}
                style={{ flex: 1, padding: '14px', borderRadius: 10, background: 'rgba(255,179,64,0.1)', border: '1px solid rgba(255,179,64,0.2)', color: '#FFB340', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: ease, ':hover': { background: 'rgba(255,179,64,0.15)' } }}
              >
                Request Changes
              </button>
              <button 
                onClick={() => { setStatus('approved'); setLocked(true); }}
                style={{ flex: 1, padding: '14px', borderRadius: 10, background: '#34C759', border: 'none', color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: ease, boxShadow: '0 4px 14px rgba(52,199,89,0.3)' }}
              >
                Approve File
              </button>
            </>
          )}
        </div>

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
