// Reusable skeleton loading components
// Usage: <Skeleton w="60%" h={14} /> or <SkeletonCard rows={3} />

export function Skeleton({ w = "100%", h = 14, radius = 8, style = {} }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeletonShimmer 1.6s ease infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 1, lastW = "70%", h = 13, gap = 8 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} w={i === lines - 1 ? lastW : "100%"} h={h} />
      ))}
    </div>
  );
}

export function SkeletonRow({ t, last }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: last ? "none" : `1px solid ${t?.divider || "rgba(255,255,255,0.05)"}`,
      }}
    >
      <Skeleton w={40} h={40} radius={20} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <Skeleton w="55%" h={13} />
        <Skeleton w="35%" h={10} />
      </div>
      <Skeleton w={60} h={13} />
    </div>
  );
}

export function SkeletonStatCard({ t, dark }) {
  return (
    <div
      style={{
        background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.82)",
        border: `1px solid ${t?.cardBorder || "rgba(255,255,255,0.05)"}`,
        borderRadius: 20,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton w="50%" h={12} />
        <Skeleton w={34} h={34} radius={17} style={{ flexShrink: 0 }} />
      </div>
      <Skeleton w="40%" h={26} />
      <Skeleton w="55%" h={10} />
    </div>
  );
}

// Inject shimmer keyframes once
if (typeof document !== "undefined" && !document.getElementById("skeleton-style")) {
  const s = document.createElement("style");
  s.id = "skeleton-style";
  s.textContent = `
    @keyframes skeletonShimmer {
      0%   { background-position: 200% 0 }
      100% { background-position: -200% 0 }
    }
  `;
  document.head.appendChild(s);
}
