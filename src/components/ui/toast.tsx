"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONES: Record<ToastTone, { className: string; icon: React.ReactNode }> = {
  success: {
    className: "border-success/30 bg-success-bg text-success",
    icon: <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />,
  },
  error: {
    className: "border-danger/30 bg-danger-bg text-danger",
    icon: <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />,
  },
  info: {
    className: "border-info/30 bg-info-bg text-info",
    icon: <Info className="size-5 shrink-0" aria-hidden="true" />,
  },
};

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast fokusu oğurlamır — yalnız aria-live ilə elan olunur */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "animate-fade-in pointer-events-auto flex w-full max-w-sm items-start gap-3",
              "rounded-xs border px-4 py-3 text-sm font-medium shadow-md",
              TONES[item.tone].className,
            )}
          >
            {TONES[item.tone].icon}
            <span className="flex-1 leading-snug">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Bildirişi bağla"
              className="-my-1 -mr-1 shrink-0 cursor-pointer rounded-xs p-1 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast yalnız ToastProvider daxilində istifadə edilə bilər");
  }
  return context;
}
