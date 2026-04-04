import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const VOLT = '#ccfd01';
const VOLTD = '#b8e300';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name');
        }
        const { error, data } = await signUp(email, password, fullName);
        if (error) throw error;
        if (data?.user && !data?.session) {
          setSuccess('Check your email for a confirmation link!');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const t = {
    shell: '#08080a',
    card: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.055)',
    text: '#f0f0f5',
    sub: '#8b8fa3',
    muted: '#3f4150',
    input: 'rgba(255,255,255,0.04)',
    inputBorder: 'rgba(255,255,255,0.07)',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100vw', height: '100vh', background: t.shell,
      fontFamily: "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',system-ui,sans-serif",
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%', width: 600, height: 600,
        borderRadius: '50%', filter: 'blur(120px)', opacity: 0.06,
        background: VOLT, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-10%', width: 500, height: 500,
        borderRadius: '50%', filter: 'blur(100px)', opacity: 0.04,
        background: '#FFB340', pointerEvents: 'none',
      }} />

      <div style={{
        width: 420, maxWidth: '90vw',
        background: t.card, border: `1px solid ${t.cardBorder}`,
        borderRadius: 28, backdropFilter: 'blur(40px) saturate(1.8)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 80px rgba(204,253,1,0.02)',
        padding: '44px 36px', position: 'relative', overflow: 'hidden',
        animation: 'fadeUp 0.5s ease backwards',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 36, right: 36, height: 2,
          background: `linear-gradient(90deg, ${VOLT}, ${VOLTD})`, borderRadius: 2,
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#0a0a0a',
            boxShadow: `0 3px 18px rgba(204,253,1,0.18)`,
          }}>N</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: -0.5 }}>
              Nomaad
            </div>
            <div style={{ fontSize: 12, color: t.sub, marginTop: 1 }}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 2, marginBottom: 28,
          background: t.input, borderRadius: 12, padding: 3,
          border: `1px solid ${t.inputBorder}`,
        }}>
          {['Sign In', 'Sign Up'].map((label, i) => {
            const active = (i === 0 && isLogin) || (i === 1 && !isLogin);
            return (
              <button
                key={label}
                onClick={() => { setIsLogin(i === 0); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: active ? `linear-gradient(135deg, ${VOLT}, ${VOLTD})` : 'transparent',
                  color: active ? '#0a0a0a' : t.sub,
                  boxShadow: active ? `0 2px 12px rgba(204,253,1,0.15)` : 'none',
                  transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
                }}
              >{label}</button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: t.sub, marginBottom: 6, display: 'block' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  background: t.input, border: `1px solid ${t.inputBorder}`,
                  color: t.text, fontSize: 14, fontFamily: 'inherit',
                  outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = VOLT + '44'}
                onBlur={(e) => e.target.style.borderColor = t.inputBorder}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: t.sub, marginBottom: 6, display: 'block' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                background: t.input, border: `1px solid ${t.inputBorder}`,
                color: t.text, fontSize: 14, fontFamily: 'inherit',
                outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = VOLT + '44'}
              onBlur={(e) => e.target.style.borderColor = t.inputBorder}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: t.sub, marginBottom: 6, display: 'block' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                background: t.input, border: `1px solid ${t.inputBorder}`,
                color: t.text, fontSize: 14, fontFamily: 'inherit',
                outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = VOLT + '44'}
              onBlur={(e) => e.target.style.borderColor = t.inputBorder}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)',
              color: '#FF6259', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(204,253,1,0.08)', border: `1px solid rgba(204,253,1,0.15)`,
              color: VOLT, fontSize: 13,
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
              color: '#0a0a0a', fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit', marginTop: 4,
              boxShadow: `0 4px 20px rgba(204,253,1,0.2)`,
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: t.muted }}>
          By continuing, you agree to our Terms of Service
        </div>
      </div>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        input::placeholder { color: #3f4150; }
      `}</style>
    </div>
  );
}
