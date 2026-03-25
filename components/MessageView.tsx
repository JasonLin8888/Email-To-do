'use client';

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { ArrowLeft, Reply, Archive, Trash2, CheckSquare, CalendarPlus } from 'lucide-react';
import type { MessageDetail } from '@/lib/email/types';

interface MessageViewProps {
  messageId: string;
  onBack: () => void;
  onAddToTodo: () => void;
  onAddToCalendar: () => void;
  onDelete: () => void;
  onArchive: () => void;
}

const messageDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

function formatDate(unixTimestamp: number): string {
  return messageDateFormatter.format(new Date(unixTimestamp * 1000));
}

function AddressList({ addresses }: { addresses: MessageDetail['from'] }) {
  return (
    <span>
      {addresses.map((a, i) => (
        <span key={i}>
          {i > 0 && ', '}
          {a.name ? `${a.name} <${a.email}>` : a.email}
        </span>
      ))}
    </span>
  );
}

function SkeletonView() {
  return (
    <div className="p-6 animate-pulse flex flex-col gap-4">
      <div className="h-6 w-3/4 rounded bg-gray-200" />
      <div className="h-4 w-1/2 rounded bg-gray-200" />
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-gray-100" style={{ width: `${70 + (i % 3) * 10}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function MessageView({
  messageId,
  onBack,
  onAddToTodo,
  onAddToCalendar,
  onDelete,
  onArchive,
}: MessageViewProps) {
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const r = await fetch(`/api/messages/${messageId}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data: MessageDetail = await r.json();
        if (!cancelled) {
          setMessage(data);
          setLoading(false);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unknown error');
          setLoading(false);
        }
      }
    }

    setLoading(true);
    setError(null);
    load();

    return () => { cancelled = true; };
  }, [messageId]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-1 ml-2">
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            title="Reply"
            aria-label="Reply"
          >
            <Reply size={18} />
          </button>
          <button
            onClick={onArchive}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            title="Archive"
            aria-label="Archive"
          >
            <Archive size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-red-600"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={onAddToTodo}
          className="flex items-center gap-2 bg-[#1a73e8] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#1765cc] transition-colors"
        >
          <CheckSquare size={16} />
          Add to To-Do
        </button>
        <button
          onClick={onAddToCalendar}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
        >
          <CalendarPlus size={16} />
          Add to Calendar
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <SkeletonView />
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Failed to load message: {error}
          </div>
        ) : message ? (
          <div className="p-6 max-w-4xl">
            {/* Subject */}
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              {message.subject || '(no subject)'}
            </h1>

            {/* Headers */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-700 space-y-1">
              <div className="flex gap-2">
                <span className="font-medium text-gray-500 w-10 shrink-0">From</span>
                <AddressList addresses={message.from} />
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-gray-500 w-10 shrink-0">To</span>
                <AddressList addresses={message.to} />
              </div>
              {message.cc && message.cc.length > 0 && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-500 w-10 shrink-0">CC</span>
                  <AddressList addresses={message.cc} />
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-medium text-gray-500 w-10 shrink-0">Date</span>
                <span>{formatDate(message.date)}</span>
              </div>
            </div>

            {/* Body — sanitized with DOMPurify to prevent XSS */}
            <div
              className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.body) }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
