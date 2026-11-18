import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, kind = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const styles = {
    success: ['check_circle', 'border-[#B7E2BF] text-[#1B6B30]'],
    error: ['error', 'border-[#FECACA] text-[#B91C1C]'],
    info: ['info', 'border-[#B9DCEF] text-[#165C8A]'],
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] space-y-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-2 p-3 rounded-lg bg-surface-container-lowest border font-body-md text-body-md ${styles[t.kind][1]}`}
            style={{ boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.12)' }}
          >
            <span className="material-symbols-outlined text-[18px]">{styles[t.kind][0]}</span>
            <span className="text-on-surface">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** const toast = useToast(); toast('Saved'); toast('Failed', 'error') */
export const useToast = () => useContext(ToastContext);
