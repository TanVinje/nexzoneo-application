import { colors } from "./theme";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(20,27,77,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ width: 400, padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: colors.deepNavy, marginBottom: 8 }}>{title}</h3>
        <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
