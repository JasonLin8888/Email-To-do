'use client';

import { useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { Trash2, ExternalLink, Plus, CheckCircle2, Circle, ClockFading, Pencil, X } from 'lucide-react';
import type { EmailTask, TaskFieldDefinition } from '@/lib/email/types';

interface TaskPanelProps {
  tasks: EmailTask[];
  fields: TaskFieldDefinition[];
  onTaskUpdate: (id: string, updates: Partial<EmailTask>) => void;
  onTaskDelete: (id: string) => void;
  onAddField: (field: Omit<TaskFieldDefinition, 'id'>) => void;
  onAddTask: (title: string) => void;
  onEmailDrop?: (messageId: string) => void;
  onOpenEmail?: (messageId: string) => void;
  loading: boolean;
}

const STATUS_CYCLE: Record<EmailTask['status'], EmailTask['status']> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

const STATUS_COLORS: Record<EmailTask['status'], string> = {
  todo: 'text-gray-400',
  in_progress: 'text-yellow-500',
  done: 'text-green-500',
};

const INTERNAL_ORDER_FIELD = '__taskOrder';

function hasValidSourceLink(task: EmailTask): boolean {
  return Boolean(task.sourceLink?.messageId?.trim());
}

function TaskRow({
  task,
  onUpdate,
  onDelete,
  onOpenEmail,
}: {
  task: EmailTask;
  onUpdate: (updates: Partial<EmailTask>) => void;
  onDelete: () => void;
  onOpenEmail?: (messageId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [modalTitleDraft, setModalTitleDraft] = useState(task.title);
  const [modalDeadlineDraft, setModalDeadlineDraft] = useState(task.deadline ?? '');
  const [modalNotice, setModalNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const commitTitle = () => {
    setEditing(false);
    if (titleDraft.trim() && titleDraft !== task.title) {
      onUpdate({ title: titleDraft.trim() });
    }
  };

  const isDone = task.status === 'done';

  const commitCustomField = (fieldId: string, value: string) => {
    const nextCustomFields = {
      ...(task.customFields ?? {}),
      [fieldId]: value,
    };
    onUpdate({ customFields: nextCustomFields });
  };

  const removeCustomField = (fieldId: string) => {
    const nextCustomFields = { ...(task.customFields ?? {}) };
    delete nextCustomFields[fieldId];
    onUpdate({ customFields: nextCustomFields });
  };

  const addCustomField = () => {
    const key = newFieldName.trim();
    if (!key) {
      setModalNotice({ type: 'error', text: 'Field name is required. Please enter a field name.' });
      return;
    }
    commitCustomField(key, newFieldValue);
    setNewFieldName('');
    setNewFieldValue('');
    setModalNotice({ type: 'success', text: `Added field "${key}".` });
  };

  const openTaskModal = () => {
    setModalTitleDraft(task.title);
    setModalDeadlineDraft(task.deadline ?? '');
    setModalNotice(null);
    setShowFieldModal(true);
  };

  const saveTaskDetailsFromModal = () => {
    const trimmedTitle = modalTitleDraft.trim();
    onUpdate({
      title: trimmedTitle || task.title,
      deadline: modalDeadlineDraft || undefined,
    });
    setTitleDraft(trimmedTitle || task.title);
    setModalNotice({ type: 'success', text: 'Task details saved.' });
  };

  const customFieldEntries = Object.entries(task.customFields ?? {}).filter(
    ([fieldName]) => fieldName !== INTERNAL_ORDER_FIELD
  );

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-2">
        {/* Status toggle */}
        <button
          onClick={() => onUpdate({ status: STATUS_CYCLE[task.status] })}
          className={`mt-0.5 shrink-0 transition-colors ${STATUS_COLORS[task.status]} hover:opacity-80`}
          title={`Status: ${task.status}`}
        >
          {task.status === 'done' ? <CheckCircle2 size={18} /> : task.status === 'in_progress' ? <ClockFading size={18} /> : <Circle size={18} />}
        </button>

        {/* Title + source */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="w-full text-sm border-b border-blue-400 outline-none bg-transparent text-gray-900 py-0.5"
            />
          ) : (
            <span
              onClick={() => {
                setTitleDraft(task.title);
                setEditing(true);
              }}
              className={`text-sm cursor-text block wrap-break-word ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}
            >
              {task.title || '(untitled)'}
            </span>
          )}

          {hasValidSourceLink(task) ? (
            <div className="flex items-start gap-1 mt-1">
              <span className={`text-xs wrap-break-word ${isDone ? 'line-through text-gray-300' : 'text-gray-400'}`}>
                {task.sourceLink.sender} - {task.sourceLink.subject}
              </span>
              {onOpenEmail && (
                <button
                  onClick={() => onOpenEmail(task.sourceLink.messageId)}
                  className="mt-0.5 shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Open source email"
                >
                  <ExternalLink size={11} />
                </button>
              )}
            </div>
          ) : (
            <div className="mt-1">
              <span className="text-xs text-gray-400">Not linked to an email</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <input
          type="date"
          value={task.deadline ?? ''}
          onChange={(e) => onUpdate({ deadline: e.target.value || undefined })}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700"
          title="Due date"
        />
      </div>

      {customFieldEntries.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-md border border-gray-100 bg-gray-50 p-2">
          {customFieldEntries.map(([fieldName, fieldValue]) => (
            <div key={fieldName} className={`text-xs wrap-break-word ${isDone ? 'line-through text-gray-400' : 'text-gray-600'}`}>
              <span className={`font-medium ${isDone ? 'text-gray-500' : 'text-gray-700'}`}>{fieldName}:</span>{' '}
              <span>{fieldValue || '-'}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={openTaskModal}
          className="p-1.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Edit task fields"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {showFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Edit Task Fields</h3>
              <button
                onClick={() => setShowFieldModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
              {modalNotice && (
                <div
                  className={`text-xs rounded-md px-2.5 py-2 border ${
                    modalNotice.type === 'success'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {modalNotice.text}
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="text"
                  value={modalTitleDraft}
                  onChange={(e) => setModalTitleDraft(e.target.value)}
                  placeholder="Task title"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700"
                />
                <input
                  type="date"
                  value={modalDeadlineDraft}
                  onChange={(e) => setModalDeadlineDraft(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700"
                />
                <button
                  onClick={saveTaskDetailsFromModal}
                  className="w-full text-xs font-medium rounded-md px-2 py-1.5 bg-gray-800 text-white hover:bg-gray-900 transition-colors"
                >
                  Save Task Details
                </button>
              </div>

              {customFieldEntries.length === 0 ? (
                <p className="text-xs text-gray-400">No extra fields yet.</p>
              ) : (
                customFieldEntries.map(([fieldName, fieldValue]) => (
                  <div key={fieldName} className="flex items-center gap-2">
                    <input
                      value={fieldName}
                      readOnly
                      className="w-2/5 text-xs border border-gray-200 rounded px-2 py-1.5 bg-gray-50 text-gray-600"
                    />
                    <input
                      value={fieldValue}
                      onChange={(e) => commitCustomField(fieldName, e.target.value)}
                      className="w-3/5 text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700"
                    />
                    <button
                      onClick={() => removeCustomField(fieldName)}
                      className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                      title="Remove field"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Field name"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700"
                />
                <input
                  type="text"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="Field value"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700"
                />
                <button
                  onClick={addCustomField}
                  className="w-full text-xs font-medium rounded-md px-2 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskPanel({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onAddTask,
  onEmailDrop,
  onOpenEmail,
  loading,
}: TaskPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const orderedTasks = useMemo(() => {
    const getOrder = (task: EmailTask): number | null => {
      const raw = task.customFields?.[INTERNAL_ORDER_FIELD];
      if (!raw) return null;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    };

    return [...tasks].sort((a, b) => {
      const aOrder = getOrder(a);
      const bOrder = getOrder(b);

      if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
      if (aOrder !== null) return -1;
      if (bOrder !== null) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks]);

  const todoCount = orderedTasks.filter((t) => t.status !== 'done').length;

  const handleAddTask = () => {
    const title = window.prompt('Task title:');
    if (title?.trim()) {
      onAddTask(title.trim());
    }
  };

  const getDraggedMessageId = (event: DragEvent<HTMLDivElement>) => {
    return event.dataTransfer.getData('application/x-email-message-id');
  };

  const canDropEmail = (event: DragEvent<HTMLDivElement>) => {
    if (!onEmailDrop) return false;
    return event.dataTransfer.types.includes('application/x-email-message-id');
  };

  const handleTaskReorder = (fromTaskId: string, toTaskId: string) => {
    if (fromTaskId === toTaskId) return;

    const fromIndex = orderedTasks.findIndex((task) => task.id === fromTaskId);
    const toIndex = orderedTasks.findIndex((task) => task.id === toTaskId);
    if (fromIndex < 0 || toIndex < 0) return;

    const nextOrder = [...orderedTasks];
    const [movedTask] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, movedTask);

    nextOrder.forEach((task, index) => {
      onTaskUpdate(task.id, {
        customFields: {
          ...(task.customFields ?? {}),
          [INTERNAL_ORDER_FIELD]: String(index),
        },
      });
    });
  };

  return (
    <div
      className={`flex flex-col h-full bg-white border border-gray-200 rounded-2xl overflow-hidden transition-colors ${isDragOver ? 'bg-blue-50' : ''}`}
      onDragOver={(event) => {
        if (!canDropEmail(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        if (!canDropEmail(event)) return;
        event.preventDefault();
        setIsDragOver(false);
        const messageId = getDraggedMessageId(event).trim();
        if (messageId) {
          onEmailDrop?.(messageId);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 shrink-0">
        <h2 className="font-semibold text-gray-800 text-sm">Tasks</h2>
        {todoCount > 0 && (
          <span className="text-xs bg-[#1a73e8] text-white rounded-full px-2 py-0.5 font-medium">
            {todoCount}
          </span>
        )}
        <div className="flex-1" />
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-3 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-3 animate-pulse">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-full rounded bg-gray-100" />
                <div className="mt-3 h-8 w-full rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : orderedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-16">
            <CheckCircle2 size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="text-xs text-center px-4">Add emails to your to-do list using the task button.</p>
          </div>
        ) : (
          <div className="p-3 flex flex-col gap-3">
            {orderedTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('application/x-task-id', task.id);
                  setDraggedTaskId(task.id);
                }}
                onDragOver={(event) => {
                  if (draggedTaskId && draggedTaskId !== task.id) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDragOverTaskId(task.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverTaskId === task.id) {
                    setDragOverTaskId(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromTaskId = event.dataTransfer.getData('application/x-task-id') || draggedTaskId;
                  if (!fromTaskId) return;
                  handleTaskReorder(fromTaskId, task.id);
                  setDraggedTaskId(null);
                  setDragOverTaskId(null);
                }}
                onDragEnd={() => {
                  setDraggedTaskId(null);
                  setDragOverTaskId(null);
                }}
                className={`rounded-xl transition-shadow ${dragOverTaskId === task.id ? 'ring-2 ring-blue-200' : ''}`}
                title="Drag to reorder"
              >
                <TaskRow
                  task={task}
                  onUpdate={(updates) => onTaskUpdate(task.id, updates)}
                  onDelete={() => onTaskDelete(task.id)}
                  onOpenEmail={onOpenEmail}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add task button */}
      <div className="px-4 py-3 border-t border-gray-200 shrink-0">
        <button
          onClick={handleAddTask}
          className="flex items-center gap-2 w-full text-sm text-[#1a73e8] hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors"
        >
          <Plus size={16} />
          Add new task
        </button>
        <p className="mt-2 text-xs text-gray-400">Tip: drag an email here to add it as a task.</p>
      </div>
    </div>
  );
}
