'use client';

import { Menu, PenSquare, Inbox, Send, Mail, Trash2, Plus } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color?: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentFolder: string;
  onFolderChange: (folder: string) => void;
  onCompose: () => void;
  labels: Label[];
  onNewLabel: () => void;
}

const NAV_ITEMS = [
  { folder: 'INBOX', label: 'Inbox', Icon: Inbox },
  { folder: 'SENT', label: 'Sent', Icon: Send },
  { folder: 'ALL', label: 'All Mail', Icon: Mail },
  { folder: 'TRASH', label: 'Trash', Icon: Trash2 },
];

export default function Sidebar({
  collapsed,
  onToggle,
  currentFolder,
  onFolderChange,
  onCompose,
  labels,
  onNewLabel,
}: SidebarProps) {
  return (
    <aside
      className="flex flex-col h-full bg-[#f6f8fc] transition-all duration-200 shrink-0"
      style={{ width: collapsed ? 64 : 256 }}
    >
      {/* Hamburger */}
      <div className="flex items-center h-16 px-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Compose button */}
      <div className={`px-2 mb-4 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <button
            onClick={onCompose}
            className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            aria-label="Compose"
          >
            <PenSquare size={20} className="text-gray-700" />
          </button>
        ) : (
          <button
            onClick={onCompose}
            className="flex items-center gap-3 bg-[#c2e7ff] hover:bg-[#aed9fb] text-gray-800 font-medium rounded-full px-6 py-4 transition-colors"
            style={{ width: '90%' }}
          >
            <PenSquare size={18} />
            <span>Compose</span>
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1 overflow-y-auto">
        {NAV_ITEMS.map(({ folder, label, Icon }) => {
          const isActive = currentFolder === folder;
          return (
            <button
              key={folder}
              onClick={() => onFolderChange(folder)}
              className={`flex items-center gap-3 py-2 transition-colors text-sm font-medium
                ${collapsed ? 'justify-center px-2 rounded-full' : 'px-4 rounded-r-full'}
                ${isActive
                  ? 'bg-[#d3e3fd] text-gray-900'
                  : 'text-gray-700 hover:bg-gray-200'
                }`}
              style={!collapsed ? { borderRadius: '0 50px 50px 0' } : {}}
              aria-label={label}
            >
              <Icon size={18} className={isActive ? 'text-gray-900' : 'text-gray-600'} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}

        {/* Labels section */}
        {!collapsed && labels.length > 0 && (
          <div className="mt-4">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Labels
            </p>
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-r-full cursor-pointer"
                style={{ borderRadius: '0 50px 50px 0' }}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: label.color ?? '#6b7280' }}
                />
                <span className="truncate">{label.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* New label */}
        <button
          onClick={onNewLabel}
          className={`flex items-center gap-3 py-2 text-sm text-gray-600 hover:bg-gray-200 transition-colors mt-1
            ${collapsed ? 'justify-center px-2 rounded-full' : 'px-4'}
          `}
          style={!collapsed ? { borderRadius: '0 50px 50px 0' } : {}}
          aria-label="New label"
        >
          <Plus size={18} />
          {!collapsed && <span>New label</span>}
        </button>
      </nav>
    </aside>
  );
}
