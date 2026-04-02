'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Settings, UserCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import SearchBar from '@/components/SearchBar';
import MailToolbar from '@/components/MailToolbar';
import MailList from '@/components/MailList';
import MessageView from '@/components/MessageView';
import ComposeModal from '@/components/ComposeModal';
import TaskPanel from '@/components/TaskPanel';
import { MessageSummary, EmailTask, TaskFieldDefinition } from '@/lib/email/types';

const LIMIT = 20;
const TASK_PANEL_MIN_WIDTH = 280;
const TASK_PANEL_MAX_WIDTH = 560;
const MIN_EMAIL_PANEL_WIDTH = 420;

const SYSTEM_LABEL_KEYS = new Set([
  'inbox',
  'sent',
  'all',
  'all mail',
  'chat',
  'trash',
  'drafts',
  'draft',
  'spam',
  'junk',
  'archive',
  'important',
  'starred',
  'yellow star',
  'unread',
  'favorites',
]);

function normalizeLabelKey(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function isSystemLabel(folder: { id: string; name: string; displayName?: string }): boolean {
  const keys = [
    normalizeLabelKey(folder.id),
    normalizeLabelKey(folder.name),
    normalizeLabelKey(folder.displayName),
  ];
  return keys.some((key) => key.startsWith('category ') || SYSTEM_LABEL_KEYS.has(key));
}

export default function Home() {
  // ── Layout state ─────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  // ── Navigation ───────────────────────────────────────────────────────────
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);

  // ── Email list state ─────────────────────────────────────────────────────
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingQuery, setPendingQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Labels ───────────────────────────────────────────────────────────────
  const [labels, setLabels] = useState<Array<{ id: string; name: string; color?: string }>>([]);

  // ── Tasks ────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<EmailTask[]>([]);
  const [taskFields, setTaskFields] = useState<TaskFieldDefinition[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskPanelWidth, setTaskPanelWidth] = useState(320);
  const [isResizingTaskPanel, setIsResizingTaskPanel] = useState(false);
  const splitPaneRef = useRef<HTMLDivElement | null>(null);
  const taskEmailIds = useMemo(
    () => new Set(tasks.map((task) => task.sourceEmailId).filter(Boolean)),
    [tasks]
  );

  // ── Fetch messages ───────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    setMessagesLoading(true);
    try {
      const params = new URLSearchParams({
        folder: currentFolder,
        limit: String(LIMIT),
        offset: String(offset),
      });
      if (searchQuery) params.set('query', searchQuery);

      const res = await fetch(`/api/messages?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages(data.messages ?? []);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [currentFolder, offset, searchQuery]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── Fetch tasks + fields ─────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const [tasksRes, fieldsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/tasks/fields'),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (fieldsRes.ok) setTaskFields(await fieldsRes.json());
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Fetch labels ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/folders')
      .then((r) => r.json())
      .then((folders) => {
        // Use folders as labels for sidebar display
        setLabels(
          (folders as Array<{ id: string; name: string; displayName?: string }>)
            .filter((f) => !isSystemLabel(f))
            .map((f) => ({ id: f.id, name: f.displayName ?? f.name }))
        );
      })
      .catch(() => setLabels([]));
  }, []);

  // ── Folder change ────────────────────────────────────────────────────────
  const handleFolderChange = (folder: string) => {
    setCurrentFolder(folder);
    setOffset(0);
    setOpenMessageId(null);
    setSelectedIds(new Set());
  };

  // ── Search ───────────────────────────────────────────────────────────────
  const handleSearch = () => {
    setSearchQuery(pendingQuery);
    setOffset(0);
  };

  // ── Pagination ───────────────────────────────────────────────────────────
  const hasNext = messages.length === LIMIT; // if we got a full page, there might be more

  // ── Email actions ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (openMessageId === id) setOpenMessageId(null);
  };

  const handleArchive = async (id: string) => {
    await fetch(`/api/messages/${id}/archive`, { method: 'POST' });
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (openMessageId === id) setOpenMessageId(null);
  };

  const handleToggleRead = async (id: string) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    await fetch(`/api/messages/${id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: msg.unread }), // toggle
    });
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, unread: !m.unread } : m))
    );
  };

  const handleToggleStar = async (id: string, currentStarred?: boolean) => {
    const existingMessage = messages.find((m) => m.id === id);
    const previousValue = typeof currentStarred === 'boolean'
      ? currentStarred
      : Boolean(existingMessage?.starred);
    const nextValue = !previousValue;

    const res = await fetch(`/api/messages/${id}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isStarred: nextValue }),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }

    setMessages((prev) => {
      // In Favorites view, removing star should hide the message immediately.
      if (currentFolder === 'YELLOW_STAR' && !nextValue) {
        return prev.filter((m) => m.id !== id);
      }

      return prev.map((m) => (m.id === id ? { ...m, starred: nextValue } : m));
    });
  };

  const handleAddToTodo = async (messageId: string) => {
    if (taskEmailIds.has(messageId)) {
      return;
    }

    try {
      const res = await fetch('/api/tasks/from-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      if (res.status === 409) {
        await fetchTasks();
        return;
      }
      if (!res.ok) throw new Error(await res.text());

      const task = await res.json();
      setTasks((prev) => {
        const hasExisting = prev.some((existing) =>
          existing.sourceEmailId
            ? existing.sourceEmailId === task.sourceEmailId
            : existing.id === task.id
        );
        return hasExisting ? prev : [task, ...prev];
      });
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleAddToCalendar = (messageId: string) => {
    // Placeholder hook for future Google Calendar integration.
    console.info('Add to Calendar clicked for message:', messageId);
  };

  // ── Selection ────────────────────────────────────────────────────────────
  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map((m) => m.id)));
    }
  };

  // ── Task management ───────────────────────────────────────────────────────
  const handleTaskUpdate = async (id: string, updates: Partial<EmailTask>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const message = await res.text();

        // If task IDs drifted due dev hot reload state, refresh local task list.
        if (res.status === 404) {
          const tasksRes = await fetch('/api/tasks');
          if (tasksRes.ok) {
            setTasks(await tasksRes.json());
          }
        }

        throw new Error(message || `HTTP ${res.status}`);
      }

      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Task update failed:', err);
    }
  };

  const handleAddTask = async (title: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status: 'todo' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleTaskDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Task delete failed:', err);
    }
  };

  const handleAddField = async (field: Omit<TaskFieldDefinition, 'id'>) => {
    try {
      const res = await fetch('/api/tasks/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(field),
      });
      if (!res.ok) throw new Error();
      await res.json();

      // Re-fetch definitions so UI stays consistent with server state.
      const fieldsRes = await fetch('/api/tasks/fields');
      if (!fieldsRes.ok) throw new Error();
      setTaskFields(await fieldsRes.json());
    } catch (err) {
      console.error('Add field failed:', err);
    }
  };

  const handleTaskPanelResizeStart = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const container = splitPaneRef.current;
    if (!container) return;

    const startX = event.clientX;
    const startWidth = taskPanelWidth;
    const containerWidth = container.getBoundingClientRect().width;
    const maxWidth = Math.min(
      TASK_PANEL_MAX_WIDTH,
      Math.max(TASK_PANEL_MIN_WIDTH, containerWidth - MIN_EMAIL_PANEL_WIDTH)
    );

    setIsResizingTaskPanel(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const nextWidth = Math.min(maxWidth, Math.max(TASK_PANEL_MIN_WIDTH, startWidth + delta));
      setTaskPanelWidth(nextWidth);
    };

    const onMouseUp = () => {
      setIsResizingTaskPanel(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [taskPanelWidth]);

  const folderDisplayName: Record<string, string> = {
    INBOX: 'Inbox',
    SENT: 'Sent',
    ALL: 'All Mail',
    YELLOW_STAR: 'Favorites',
    TRASH: 'Trash',
  };

  const activeFolderLabel = labels.find((label) => label.id === currentFolder)?.name;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f6f8fc]">
      {/* LEFT SIDEBAR */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        currentFolder={currentFolder}
        onFolderChange={handleFolderChange}
        onCompose={() => setComposeOpen(true)}
        labels={labels}
        onNewLabel={async () => {
          const name = window.prompt('Label name:');
          if (name?.trim()) {
            // Create a label via Nylas API
            try {
              await fetch('/api/folders', { method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() }),
              });
            } catch {
              // Labels are provider-specific; silently ignore if unsupported
            }
            setLabels((prev) => [...prev, { id: name.trim(), name: name.trim() }]);
          }
        }}
      />

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <header className="flex items-center gap-4 px-4 py-2 bg-[#f6f8fc] z-10">
          {/* Search centered */}
          <div className="flex-1 flex justify-center px-4">
            <div className="w-full max-w-2xl">
              <SearchBar
                value={pendingQuery}
                onChange={setPendingQuery}
                onSearch={handleSearch}
              />
            </div>
          </div>
          {/* Right icons */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
              <Settings size={20} className="text-gray-600" />
            </button>
            <button className="p-1 rounded-full hover:bg-gray-200 transition-colors">
              <UserCircle size={32} className="text-gray-500" />
            </button>
          </div>
        </header>

        {/* Email area + Task Panel */}
        <div ref={splitPaneRef} className="flex flex-1 min-h-0 gap-2 px-2 pb-2">
          {/* Email column */}
          <div className="flex flex-col flex-1 min-w-0 bg-white rounded-2xl overflow-hidden shadow-sm">
            {openMessageId ? (
              <MessageView
                messageId={openMessageId}
                isInTodo={taskEmailIds.has(openMessageId)}
                onBack={() => setOpenMessageId(null)}
                onAddToTodo={() => handleAddToTodo(openMessageId)}
                onAddToCalendar={() => handleAddToCalendar(openMessageId)}
                onDelete={() => handleDelete(openMessageId)}
                onArchive={() => handleArchive(openMessageId)}
                onToggleStar={handleToggleStar}
              />
            ) : (
              <>
                <MailToolbar
                  folder={folderDisplayName[currentFolder] ?? activeFolderLabel ?? currentFolder}
                  total={total}
                  offset={offset}
                  limit={LIMIT}
                  hasNext={hasNext}
                  onRefresh={fetchMessages}
                  onPrev={() => setOffset((o) => Math.max(0, o - LIMIT))}
                  onNext={() => setOffset((o) => o + LIMIT)}
                  onSelectAll={handleSelectAll}
                  allSelected={selectedIds.size === messages.length && messages.length > 0}
                  loading={messagesLoading}
                />
                <MailList
                  messages={messages}
                  taskEmailIds={taskEmailIds}
                  loading={messagesLoading}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onOpen={async (id) => {
                    setOpenMessageId(id);
                    // Only mark as read if currently unread
                    const msg = messages.find((m) => m.id === id);
                    if (msg?.unread) {
                      await fetch(`/api/messages/${id}/read`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isRead: true }),
                      });
                      setMessages((prev) =>
                        prev.map((m) => (m.id === id ? { ...m, unread: false } : m))
                      );
                    }
                  }}
                  onDelete={handleDelete}
                  onArchive={handleArchive}
                  onToggleRead={handleToggleRead}
                  onToggleStar={(id) => handleToggleStar(id)}
                  onAddToTodo={handleAddToTodo}
                  onAddToCalendar={handleAddToCalendar}
                  onDragStart={() => {
                    // Handler is passed so rows can trigger native drag with message metadata.
                  }}
                />
              </>
            )}
          </div>

          <div
            role="separator"
            aria-label="Resize to-do panel"
            aria-orientation="vertical"
            onMouseDown={handleTaskPanelResizeStart}
            className="relative mx-1 my-1 w-3 shrink-0 cursor-col-resize"
          >
            <div
              className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-colors ${
                isResizingTaskPanel ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-2 rounded-full border transition-colors ${
                isResizingTaskPanel
                  ? 'border-blue-400 bg-blue-100'
                  : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-semibold tracking-tight select-none ${
                  isResizingTaskPanel ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {'<>'}
              </span>
            </div>
          </div>

          {/* TASK PANEL */}
          <div
            className="shrink-0"
            style={{ width: taskPanelWidth }}
          >
            <TaskPanel
              tasks={tasks}
              fields={taskFields}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onAddField={handleAddField}
              onAddTask={handleAddTask}
              onEmailDrop={handleAddToTodo}
              onOpenEmail={(messageId) => {
                setOpenMessageId(messageId);
                setComposeOpen(false);
              }}
              loading={tasksLoading}
            />
          </div>
        </div>
      </div>

      {/* COMPOSE MODAL */}
      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => {
          setComposeOpen(false);
          fetchMessages();
        }}
      />
    </div>
  );
}
