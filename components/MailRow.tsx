'use client';

import { CheckCheck, Archive, Trash2, CheckSquare, CalendarPlus, GripVertical, Star } from 'lucide-react';
import type { MessageSummary } from '@/lib/email/types';

interface MailRowProps {
  message: MessageSummary;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onToggleRead: () => void;
  onToggleStar: () => void;
  onAddToTodo: () => void;
  onAddToCalendar: () => void;
  onDragStart: (messageId: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function formatTime(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);
  return dateFormatter.format(date);
}

function getSenderName(from: MessageSummary['from']): string {
  if (!from || from.length === 0) return 'Unknown';
  const first = from[0];
  return first.name || first.email;
}

export default function MailRow({
  message,
  selected,
  onSelect,
  onClick,
  onDelete,
  onArchive,
  onToggleRead,
  onToggleStar,
  onAddToTodo,
  onAddToCalendar,
  onDragStart,
}: MailRowProps) {
  const isUnread = message.unread;
  const isStarred = message.starred;

  return (
    <div
      className={`group flex items-center gap-2 px-4 py-2 cursor-pointer border-b border-gray-100 rounded-sm
        transition-all duration-100 select-none
        ${isUnread ? 'bg-white' : 'bg-gray-50'}
        ${selected ? 'bg-blue-50' : ''}
        hover:shadow-md hover:-translate-y-0.5 hover:z-10 hover:relative
      `}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/x-email-message-id', message.id);
        e.dataTransfer.setData('text/plain', message.id);
        onDragStart(message.id);
      }}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 w-4 h-5 flex items-center justify-center text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing"
        title="Drag to Tasks"
      >
        <GripVertical size={14} />
      </div>

      {/* Checkbox */}
      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 accent-[#1a73e8] cursor-pointer"
          aria-label="Select email"
        />
      </div>

      {/* Sender */}
      <div
        className={`w-40 shrink-0 text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-normal text-gray-700'}`}
      >
        {getSenderName(message.from)}
      </div>

      {/* Subject + labels + snippet */}
      <div className="flex-1 flex items-baseline gap-2 min-w-0 overflow-hidden">
        <span
          className={`text-sm shrink-0 truncate max-w-xs ${isUnread ? 'font-semibold text-gray-900' : 'font-normal text-gray-800'}`}
        >
          {message.subject || '(no subject)'}
        </span>

        {message.labels && message.labels.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {message.labels.slice(0, 2).map((label) => (
              <span
                key={label}
                className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <span className="text-sm text-gray-500 truncate hidden sm:block">
          — {message.snippet}
        </span>
      </div>

      {/* Time — hidden on hover, replaced by actions */}
      <div className="shrink-0 flex items-center gap-1 ml-2">
        <span
          className={`text-xs text-gray-500 group-hover:hidden ${isUnread ? 'font-semibold' : ''}`}
        >
          {formatTime(message.date)}
        </span>

        {/* Action icons shown on hover */}
        <div
          className="hidden group-hover:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onToggleStar}
            className={`p-1.5 rounded-full hover:bg-gray-200 transition-colors ${
              isStarred ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-500 hover:text-yellow-500'
            }`}
            title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={16} className={isStarred ? 'fill-current' : ''} />
          </button>
          <button
            onClick={onToggleRead}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
            title={isUnread ? 'Mark as read' : 'Mark as unread'}
          >
            <CheckCheck size={16} />
          </button>
          <button
            onClick={onArchive}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
            title="Archive"
          >
            <Archive size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onAddToTodo}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition-colors"
            title="Add to To-Do"
          >
            <CheckSquare size={16} />
          </button>
          <button
            onClick={onAddToCalendar}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-green-600 transition-colors"
            title="Add to Calendar"
          >
            <CalendarPlus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
