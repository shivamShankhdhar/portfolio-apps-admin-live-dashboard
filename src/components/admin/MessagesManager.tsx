'use client';

import React, { useState } from 'react';
import { FiTrash2, FiMail, FiCalendar } from 'react-icons/fi';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

export default function MessagesManager({
  messages,
  onReload,
}: {
  messages: ContactMessage[];
  onReload: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirmed = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/messages/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Message deleted');
      setDeletingId(null);
      onReload();
    } catch {
      toast.error('Failed to delete message');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => { if (!open) setDeletingId(null); }}
        title="Delete Message"
        description="This message will be permanently removed from the database. This action cannot be undone."
        confirmLabel="Delete Message"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDeleteConfirmed}
      />

      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <FiMail className="text-red-500" />
        <span>Contact Form Inquiries ({messages.length})</span>
      </h2>

      {messages.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#12131c]/50 border border-dashed border-white/10">
          <p className="text-slate-400 text-sm">Inbox is empty. No messages received yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className="p-5 rounded-2xl bg-[#12131c] border border-red-500/20 hover:border-red-500/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{msg.name}</span>
                  <a
                    href={`mailto:${msg.email}`}
                    className="text-xs text-red-400 hover:underline font-mono"
                  >
                    &lt;{msg.email}&gt;
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <FiCalendar className="h-3 w-3" />
                    <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </span>
                  <button
                    onClick={() => setDeletingId(msg._id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
