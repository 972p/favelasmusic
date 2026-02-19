'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore, Toast } from '@/store/useToastStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 md:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto flex items-center gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl overflow-hidden relative group",
        bgColors[toast.type] || bgColors.info
      )}
    >
      <div className="shrink-0">{icons[toast.type] || icons.info}</div>
      <p className="text-sm font-medium text-white/90 flex-1">{toast.message}</p>
      <button 
        onClick={onClose}
        className="text-white/40 hover:text-white transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Progress Bar Animation (Optional fancy touch) */}
      <motion.div 
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 3, ease: "linear" }}
        className={cn(
            "absolute bottom-0 left-0 h-[2px]",
            toast.type === 'success' && "bg-green-500/50",
            toast.type === 'error' && "bg-red-500/50",
            toast.type === 'info' && "bg-blue-500/50",
        )}
      />
    </motion.div>
  );
}
