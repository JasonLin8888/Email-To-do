'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export default function ComposeModal({ open, onClose, onSent }: ComposeModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSend = async () => {
    if (!to.trim()) {
      setError('Recipient is required.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [{ email: to.trim() }],
          subject,
          body,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setTo('');
      setSubject('');
      setBody('');
      onSent();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none"
      aria-modal="true"
      role="dialog"
    >
      {/* Modal card */}
      <div className="pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#404040] rounded-t-2xl">
          <h2 className="text-sm font-semibold text-white">New Message</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col divide-y divide-gray-100">
          <input
            type="text"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-5 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-5 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          <textarea
            placeholder="Write your message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="px-5 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="px-5 pb-2 text-xs text-red-500">{error}</p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-gray-100">
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 bg-[#1a73e8] text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-[#1765cc] transition-colors disabled:opacity-60"
          >
            <Send size={15} />
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
