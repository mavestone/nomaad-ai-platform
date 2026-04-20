import { useEffect, useRef, useState } from 'react';

const VOLT = '#CCFD01';

let cachedPathLength = 0;
let stylesInjected = false;

const LOADER_KEYFRAMES = `
  @keyframes drawStroke {
    0% { stroke-dashoffset: var(--path-length); animation-timing-function: ease-in-out; }
    50% { stroke-dashoffset: 0; animation-timing-function: ease-in-out; }
    100% { stroke-dashoffset: calc(var(--path-length) * -1); }
  }
  @keyframes textShimmer {
    0% { background-position: -100% center; }
    100% { background-position: 100% center; }
  }
`;

function Loader({ size = 18, strokeWidth = 2.5, color = '#a1a1aa' }) {
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(cachedPathLength);

  useEffect(() => {
    if (!stylesInjected) {
      stylesInjected = true;
      const s = document.createElement('style');
      s.textContent = LOADER_KEYFRAMES;
      document.head.appendChild(s);
    }
    if (pathRef.current && !cachedPathLength) {
      cachedPathLength = pathRef.current.getTotalLength();
      setPathLength(cachedPathLength);
    }
  }, []);

  const isReady = pathLength > 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 19 19"
      fill="none"
      style={{ color }}
    >
      <path
        ref={pathRef}
        d="M4.43431 2.42415C-0.789139 6.90104 1.21472 15.2022 8.434 15.9242C15.5762 16.6384 18.8649 9.23035 15.9332 4.5183C14.1316 1.62255 8.43695 0.0528911 7.51841 3.33733C6.48107 7.04659 15.2699 15.0195 17.4343 16.9241"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        style={isReady ? { strokeDasharray: pathLength, '--path-length': pathLength } : undefined}
      />
      <style>{`
        @keyframes drawStroke {
          0% { stroke-dashoffset: var(--path-length); animation-timing-function: ease-in-out; }
          50% { stroke-dashoffset: 0; animation-timing-function: ease-in-out; }
          100% { stroke-dashoffset: calc(var(--path-length) * -1); }
        }
      `}</style>
      {isReady && (
        <style>{`
          path[d^="M4.43431"] {
            animation: drawStroke 2.5s ease-in-out infinite;
          }
        `}</style>
      )}
    </svg>
  );
}

export function LoadingBreadcrumb({ text = 'Cooking', dark = true }) {
  const textColor = dark ? '#a1a1aa' : '#71717a';
  const shimmerBg = dark
    ? 'linear-gradient(90deg, #a1a1aa 0%, #a1a1aa 40%, #ffffff 50%, #a1a1aa 60%, #a1a1aa 100%)'
    : 'linear-gradient(90deg, #71717a 0%, #71717a 40%, #18181b 50%, #71717a 60%, #71717a 100%)';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 15,
      fontWeight: 500,
      letterSpacing: '0.025em',
      fontFamily: "-apple-system,'SF Pro Display',system-ui,sans-serif"
    }}>
      <Loader color={textColor} />
      <span style={{
        backgroundSize: '200% auto',
        backgroundImage: shimmerBg,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }}>
        {text}
      </span>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}