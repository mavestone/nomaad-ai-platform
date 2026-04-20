import { useEffect, useRef, useState } from 'react';

const VOLT = '#CCFD01';
const DARK = '#B8E300';

let stylesInjected = false;

export function AnimatedLoader({ size = 48, text = 'Loading...' }) {
  const pathRef = useRef(null);
  const [pathLen, setPathLen] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!stylesInjected) {
      stylesInjected = true;
      const s = document.createElement('style');
      s.textContent = `
        @keyframes drawLine {
          0% { stroke-dashoffset: var(--pl); }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: calc(var(--pl) * -1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `;
      document.head.appendChild(s);
    }
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setPathLen(len);
      setReady(true);
    }
  }, []);

  const isReady = pathLen > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', background: '#08080a', fontFamily: "-apple-system,'SF Pro Display',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <rect x="4" y="4" width="40" height="40" rx="12" fill="#08080a" />
          <path
            ref={pathRef}
            d="M14 14 L34 14 L34 34 L14 34 Z"
            stroke={VOLT}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            style={ready ? { strokeDasharray: pathLen, '--pl': pathLen } : {}}
            className={ready ? 'drawLineAnim' : ''}
          />
        </svg>
        <style>{`
          .drawLineAnim {
            animation: drawLine 2s ease-in-out infinite;
          }
        `}</style>
        {text && (
          <div style={{ marginTop: 16, fontSize: 14, color: '#8b8fa3' }}>
            {text}
          </div>
        )}
      </div>
    </div>
  );
}