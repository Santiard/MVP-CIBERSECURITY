import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type AlertType = 'success' | 'warning' | 'error';

type AlertItem = {
  id: number;
  type: AlertType;
  title: string;
  message: string;
  durationMs: number;
  leaving?: boolean;
};

type AlertPayload = {
  type: AlertType;
  title: string;
  message: string;
  durationMs?: number;
};

type AlertContextValue = {
  showAlert: (payload: AlertPayload) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

const ALERT_META: Record<AlertType, { icon: string; className: string }> = {
  success: { icon: '✓', className: 'toast-success' },
  warning: { icon: '!', className: 'toast-warning' },
  error: { icon: '✕', className: 'toast-error' },
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<AlertItem[]>([]);

  const dismissItem = useCallback((id: number) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 220);
  }, []);

  const showAlert = useCallback((payload: AlertPayload) => {
    const item: AlertItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: payload.type,
      title: payload.title,
      message: payload.message,
      durationMs: payload.durationMs ?? 3500,
    };
    setItems((prev) => [...prev, item]);
    window.setTimeout(() => {
      dismissItem(item.id);
    }, item.durationMs);
  }, [dismissItem]);

  const ctxValue = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={ctxValue}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {items.map((item) => {
          const meta = ALERT_META[item.type];
          return (
            <div key={item.id} className={`toast-card ${meta.className}${item.leaving ? ' toast-leaving' : ''}`} role="status">
              <div className="toast-icon">{meta.icon}</div>
              <button
                type="button"
                className="toast-close"
                aria-label="Cerrar alerta"
                onClick={() => dismissItem(item.id)}
              >
                ×
              </button>
              <div className="toast-title">{item.title}</div>
              <div className="toast-message">{item.message}</div>
              <div className="toast-accent" />
            </div>
          );
        })}
      </div>
    </AlertContext.Provider>
  );
};

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert debe usarse dentro de AlertProvider');
  }
  return ctx;
}

