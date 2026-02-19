'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden"
          >
             {/* Gradient Glow */}
             <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50" />

            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
                <p className="text-sm text-zinc-400">{description}</p>
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-white/5"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors text-white ${
                    isDestructive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
            
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-zinc-600 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
