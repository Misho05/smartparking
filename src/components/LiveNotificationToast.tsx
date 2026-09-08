import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'freed' | 'occupied' | 'success' | 'info';
  title: string;
  subtitle?: string;
}

interface LiveNotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.slice(-3).map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'freed' || toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300'
              : toast.type === 'occupied'
              ? 'bg-slate-900/95 border-rose-950/80 text-rose-300'
              : 'bg-slate-900/95 border-slate-700 text-slate-300'
          }`}
        >
          <div className="p-1.5 rounded-xl bg-slate-950/80 shrink-0">
            {toast.type === 'freed' || toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : toast.type === 'occupied' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400" />
            )}
          </div>

          <div className="flex-1 text-xs">
            <p className="font-bold text-white leading-tight">{toast.title}</p>
            {toast.subtitle && <p className="text-slate-400 mt-0.5 leading-snug">{toast.subtitle}</p>}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 text-slate-500 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
