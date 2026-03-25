'use client';

import { useState } from 'react';
import type { DragEvent } from 'react';
import { Settings, Trash2, ExternalLink, Plus, CheckCircle2, Circle } from 'lucide-react';
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

function hasValidSourceLink(task: EmailTask): boolean {
  return Boolean(task.sourceLink?.messageId?.trim());
}

function TaskRow({
  task,
  fields,
  onUpdate,
  onDelete,
  onOpenEmail,
}: {
  task: EmailTask;
  fields: TaskFieldDefinition[];
  onUpdate: (updates: Partial<EmailTask>) => void;
  onDelete: () => void;
  onOpenEmail?: (messageId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);

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

  return (
    <div className="min-w-max flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 group transition-colors">
      {/* Status toggle */}
      <button
        onClick={() => onUpdate({ status: STATUS_CYCLE[task.status] })}
        className={`shrink-0 transition-colors ${STATUS_COLORS[task.status]} hover:opacity-80`}
        title={`Status: ${task.status}`}
      >
        {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>

      {/* Title */}
      <div className="w-56 shrink-0 min-w-0">
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
            className={`text-sm cursor-text truncate block ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}
          >
            {task.title || '(untitled)'}
          </span>
        )}

        {/* Source email */}
        {hasValidSourceLink(task) ? (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400 truncate">
              {task.sourceLink.sender} — {task.sourceLink.subject}
            </span>
            {onOpenEmail && (
              <button
                onClick={() => onOpenEmail(task.sourceLink.messageId)}
                className="shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
                title="Open source email"
              >
                <ExternalLink size={11} />
              </button>
            )}
          </div>
        ) : (
          <div className="mt-0.5">
            <span className="text-xs text-gray-400">Not linked to an email</span>
          </div>
        )}
      </div>

      {/* Status + deadline */}
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={task.status}
          onChange={(e) => onUpdate({ status: e.target.value as EmailTask['status'] })}
          className="w-28 text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white text-gray-700"
          title="Task status"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <input
          type="date"
          value={task.deadline ?? ''}
          onChange={(e) => onUpdate({ deadline: e.target.value || undefined })}
          className="w-28 text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white text-gray-700 shrink-0"
          title="Due date"
        />
      </div>

      {/* Custom field values */}
      {fields.map((f) => {
        const value = task.customFields?.[f.id] ?? '';
        if (f.type === 'select') {
          return (
            <select
              key={f.id}
              value={value}
              onChange={(e) => commitCustomField(f.id, e.target.value)}
              className="w-28 text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white text-gray-700 shrink-0"
              title={f.name}
            >
              <option value="">—</option>
              {(f.options ?? []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          );
        }

        return (
          <input
            key={f.id}
            type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
            defaultValue={value}
            onBlur={(e) => commitCustomField(f.id, e.target.value)}
            className="w-28 text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white text-gray-700 shrink-0"
            title={f.name}
          />
        );
      })}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
        title="Delete task"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function TaskPanel({
  tasks,
  fields,
  onTaskUpdate,
  onTaskDelete,
  onAddField,
  onAddTask,
  onEmailDrop,
  onOpenEmail,
  loading,
}: TaskPanelProps) {
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<TaskFieldDefinition['type']>('text');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    onAddField({ name: newFieldName.trim(), type: newFieldType });
    setNewFieldName('');
    setNewFieldType('text');
    setShowFieldForm(false);
  };

  const todoCount = tasks.filter((t) => t.status !== 'done').length;

  const handleAddTask = () => {
    const title = window.prompt('Task title:');
    if (title?.trim()) {
      onAddTask(title.trim());
    }
  };

  const getDraggedMessageId = (event: DragEvent<HTMLDivElement>) => {
    return event.dataTransfer.getData('application/x-email-message-id') || event.dataTransfer.getData('text/plain');
  };

  const canDropEmail = (event: DragEvent<HTMLDivElement>) => {
    if (!onEmailDrop) return false;
    return event.dataTransfer.types.includes('application/x-email-message-id') || event.dataTransfer.types.includes('text/plain');
  };

  return (
    <div
      className={`flex flex-col h-full bg-white border-l border-gray-200 transition-colors ${isDragOver ? 'bg-blue-50' : ''}`}
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
        <button
          onClick={() => setShowFieldForm((p) => !p)}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          title="Manage custom fields"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Custom field form */}
      {showFieldForm && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Field name"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400 flex-1 min-w-25"
          />
          <select
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value as TaskFieldDefinition['type'])}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none"
          >
            <option value="text">Text</option>
            <option value="date">Date</option>
            <option value="number">Number</option>
            <option value="select">Select</option>
          </select>
          <button
            onClick={handleAddField}
            className="bg-[#1a73e8] text-white text-sm px-3 py-1 rounded-md hover:bg-[#1765cc] transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 animate-pulse">
                <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 h-4 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-16">
            <CheckCircle2 size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="text-xs text-center px-4">Add emails to your to-do list using the task button.</p>
          </div>
        ) : (
          <div className="min-w-max">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
              <div className="w-5 shrink-0" />
              <div className="w-56 shrink-0">Task</div>
              <div className="w-28 shrink-0">Status</div>
              <div className="w-20 shrink-0">Due</div>
              {fields.map((f) => (
                <div key={f.id} className="w-28 shrink-0 truncate">{f.name}</div>
              ))}
              <div className="w-5 shrink-0" />
            </div>

            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                fields={fields}
                onUpdate={(updates) => onTaskUpdate(task.id, updates)}
                onDelete={() => onTaskDelete(task.id)}
                onOpenEmail={onOpenEmail}
              />
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
