'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { FiAlertTriangle } from 'react-icons/fi';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  icon?: React.ReactNode;
  /** Optional extra content rendered between description and action buttons */
  children?: React.ReactNode;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  icon,
  children,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const confirmBg =
    variant === 'danger'
      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
      : variant === 'warning'
      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30'
      : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/30';

  const iconBg =
    variant === 'danger'
      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      : variant === 'warning'
      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      : 'bg-red-500/10 border-red-500/30 text-red-400';

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="max-w-sm">
        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl ${
          variant === 'danger' ? 'bg-gradient-to-r from-rose-600 to-red-500' :
          variant === 'warning' ? 'bg-gradient-to-r from-amber-600 to-orange-500' :
          'bg-gradient-to-r from-red-600 to-rose-500'
        }`} />

        <DialogHeader className="items-center text-center pt-2 gap-4">
          <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center ${iconBg}`}>
            {icon ?? <FiAlertTriangle className="h-6 w-6" />}
          </div>
          <div className="space-y-1.5">
            <DialogTitle className="text-base font-extrabold text-white text-center">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 text-center leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Optional extra content slot */}
        {children && <div className="w-full">{children}</div>}

        <DialogFooter className="flex gap-2 sm:gap-2 mt-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${confirmBg} shadow-lg text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
          >
            {loading ? (
              <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Processing...</span></>
            ) : (
              confirmLabel
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
