import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (title: string, options?: { type?: ToastType; message?: string }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, options: { type?: ToastType; message?: string } = {}) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        id,
        title,
        type: options.type || 'info',
        message: options.message,
      };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => toast(title, { type: 'success', message }), [toast]);
  const error = useCallback((title: string, message?: string) => toast(title, { type: 'error', message }), [toast]);
  const info = useCallback((title: string, message?: string) => toast(title, { type: 'info', message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto p-4 rounded-xl border-2 border-atelier-ink shadow-brutal flex items-start gap-3 ${
                t.type === 'success'
                  ? 'bg-atelier-chartreuse text-atelier-ink'
                  : t.type === 'error'
                  ? 'bg-atelier-tomato text-white'
                  : 'bg-atelier-lavender text-atelier-ink'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-atelier-ink" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5 text-white" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-atelier-ink" />}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-display font-bold">{t.title}</p>
                {t.message && <p className="mt-1 opacity-90 text-xs font-body leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
