'use client';

import { RefreshCw, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';

interface MailToolbarProps {
  folder: string;
  total?: number;
  offset: number;
  limit: number;
  hasNext: boolean;
  onRefresh: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectAll: () => void;
  allSelected: boolean;
  loading: boolean;
}

const FOLDER_LABELS: Record<string, string> = {
  INBOX: 'Inbox',
  SENT: 'Sent',
  ALL: 'All Mail',
  TRASH: 'Trash',
};

const numberFormatter = new Intl.NumberFormat('en-US');

export default function MailToolbar({
  folder,
  total,
  offset,
  limit,
  hasNext,
  onRefresh,
  onPrev,
  onNext,
  onSelectAll,
  allSelected,
  loading,
}: MailToolbarProps) {
  const from = offset + 1;
  const to = offset + limit;
  const totalLabel = total != null ? `of ${numberFormatter.format(total)}` : '';
  const rangeLabel = `${numberFormatter.format(from)}–${numberFormatter.format(to)} ${totalLabel}`;
  const hasPrev = offset > 0;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Select all */}
        <button
          onClick={onSelectAll}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          aria-label={allSelected ? 'Deselect all' : 'Select all'}
        >
          {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw
            size={18}
            className={loading ? 'animate-spin' : ''}
          />
        </button>

        {/* Folder name */}
        <span className="text-sm font-medium text-gray-700 ml-1">
          {FOLDER_LABELS[folder] ?? folder}
        </span>
      </div>

      {/* Right side — pagination */}
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <span className="mr-1" suppressHydrationWarning>{rangeLabel}</span>

        <button
          onClick={onPrev}
          disabled={!hasPrev || loading}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext || loading}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
