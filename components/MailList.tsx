'use client';

import { Inbox } from 'lucide-react';
import type { MessageSummary } from '@/lib/email/types';
import MailRow from './MailRow';

interface MailListProps {
  messages: MessageSummary[];
  loading: boolean;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onToggleRead: (id: string) => void;
  onToggleStar: (id: string) => void;
  onAddToTodo: (id: string) => void;
  onAddToCalendar: (id: string) => void;
  onDragStart: (id: string) => void;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 animate-pulse">
      <div className="w-4 h-4 rounded bg-gray-200 shrink-0" />
      <div className="w-32 h-4 rounded bg-gray-200 shrink-0" />
      <div className="flex-1 h-4 rounded bg-gray-200" />
      <div className="w-10 h-4 rounded bg-gray-200 shrink-0" />
    </div>
  );
}

export default function MailList({
  messages,
  loading,
  selectedIds,
  onSelect,
  onOpen,
  onDelete,
  onArchive,
  onToggleRead,
  onToggleStar,
  onAddToTodo,
  onAddToCalendar,
  onDragStart,
}: MailListProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {loading ? (
        Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 py-24">
          <Inbox size={48} strokeWidth={1.5} />
          <p className="text-lg font-medium">No messages</p>
          <p className="text-sm">Your mailbox is empty.</p>
        </div>
      ) : (
        messages.map((message) => (
          <MailRow
            key={message.id}
            message={message}
            selected={selectedIds.has(message.id)}
            onSelect={() => onSelect(message.id)}
            onClick={() => onOpen(message.id)}
            onDelete={() => onDelete(message.id)}
            onArchive={() => onArchive(message.id)}
            onToggleRead={() => onToggleRead(message.id)}
            onToggleStar={() => onToggleStar(message.id)}
            onAddToTodo={() => onAddToTodo(message.id)}
            onAddToCalendar={() => onAddToCalendar(message.id)}
            onDragStart={onDragStart}
          />
        ))
      )}
    </div>
  );
}
