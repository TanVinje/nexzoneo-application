import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { colors } from "./theme";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const bg = { success: "#d1fae5", error: "#fee2e2", info: "#dbeafe" };
  const fg = { success: "#065f46", error: "#991b1b", info: "#1e40af" };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: bg[t.type],
              color: fg[t.type],
              padding: "12px 20px",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: 14,
              fontWeight: 500,
              minWidth: 240,
              animation: "slideIn 0.2s ease",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
