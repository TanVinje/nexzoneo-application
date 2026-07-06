import { colors } from "../theme";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = "📭", title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ color: colors.deepNavy, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: actionLabel ? 24 : 0, lineHeight: 1.5 }}>{message}</p>
      {actionLabel && onAction && (
        <button className="btn-primary" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}
