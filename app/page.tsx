'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, UserCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import SearchBar from '@/components/SearchBar';
import MailToolbar from '@/components/MailToolbar';
import MailList from '@/components/MailList';
import MessageView from '@/components/MessageView';
import ComposeModal from '@/components/ComposeModal';
import TaskPanel from '@/components/TaskPanel';
import { MessageSummary, EmailTask, TaskFieldDefinition } from '@/lib/email/types';

const LIMIT = 50;

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
            .filter((f) => !['INBOX', 'SENT', 'TRASH', 'ALL', 'DRAFTS', 'SPAM'].includes(f.id.toUpperCase()))
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
  const hasPrev = offset > 0;

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

  const handleAddToTodo = async (messageId: string) => {
    try {
      const res = await fetch('/api/tasks/from-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
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
      if (!res.ok) throw new Error();
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
      const newField = await res.json();
      setTaskFields((prev) => [...prev, newField]);
    } catch (err) {
      console.error('Add field failed:', err);
    }
  };

  const folderDisplayName: Record<string, string> = {
    INBOX: 'Inbox',
    SENT: 'Sent',
    ALL: 'All Mail',
    TRASH: 'Trash',
  };

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
        <div className="flex flex-1 min-h-0 gap-2 px-2 pb-2">
          {/* Email column */}
          <div className="flex flex-col flex-1 min-w-0 bg-white rounded-2xl overflow-hidden shadow-sm">
            {openMessageId ? (
              <MessageView
                messageId={openMessageId}
                onBack={() => setOpenMessageId(null)}
                onAddToTodo={() => handleAddToTodo(openMessageId)}
                onDelete={() => handleDelete(openMessageId)}
                onArchive={() => handleArchive(openMessageId)}
              />
            ) : (
              <>
                <MailToolbar
                  folder={folderDisplayName[currentFolder] ?? currentFolder}
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
                  onAddToTodo={handleAddToTodo}
                />
              </>
            )}
          </div>

          {/* TASK PANEL */}
          <div className="w-80 shrink-0">
            <TaskPanel
              tasks={tasks}
              fields={taskFields}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onAddField={handleAddField}
              onAddTask={handleAddTask}
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
