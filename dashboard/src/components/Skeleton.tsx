import { colors } from "../theme";

export function SkeletonBox({ height = 20, width = "100%", style }: { height?: number | string; width?: number | string; style?: React.CSSProperties }) {
  return (
    <div style={{
      height, width, borderRadius: 8,
      background: `linear-gradient(90deg, ${colors.warmBeige} 25%, #f5f0e8 50%, ${colors.warmBeige} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.2s infinite",
      ...style,
    }} />
  );
}

export function ProductGridSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <SkeletonBox height={120} style={{ marginBottom: 12 }} />
          <SkeletonBox height={16} width="70%" style={{ marginBottom: 8 }} />
          <SkeletonBox height={14} width="50%" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBox key={i} height={40} style={{ marginBottom: 8 }} />
      ))}
    </div>
  );
}
