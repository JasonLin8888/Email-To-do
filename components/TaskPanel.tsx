'use client';

import { useState } from 'react';
import { Settings, Trash2, ExternalLink, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { EmailTask, TaskFieldDefinition } from '@/lib/email/types';

interface TaskPanelProps {
  tasks: EmailTask[];
  fields: TaskFieldDefinition[];
  onTaskUpdate: (id: string, updates: Partial<EmailTask>) => void;
  onTaskDelete: (id: string) => void;
  onAddField: (field: Omit<TaskFieldDefinition, 'id'>) => void;
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

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 group transition-colors">
      {/* Status toggle */}
      <button
        onClick={() => onUpdate({ status: STATUS_CYCLE[task.status] })}
        className={`shrink-0 transition-colors ${STATUS_COLORS[task.status]} hover:opacity-80`}
        title={`Status: ${task.status}`}
      >
        {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditing(false); }}
            className="w-full text-sm border-b border-blue-400 outline-none bg-transparent text-gray-900 py-0.5"
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className={`text-sm cursor-text truncate block ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}
          >
            {task.title || '(untitled)'}
          </span>
        )}

        {/* Source email */}
        {task.sourceLink && (
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
        )}
      </div>

      {/* Deadline */}
      {task.deadline && (
        <span className="text-xs text-gray-500 shrink-0 hidden sm:block">
          {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </span>
      )}

      {/* Custom field values */}
      {fields.map((f) => (
        <span key={f.id} className="text-xs text-gray-500 shrink-0 hidden md:block max-w-[80px] truncate">
          {task.customFields?.[f.id] ?? '—'}
        </span>
      ))}

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
  onOpenEmail,
  loading,
}: TaskPanelProps) {
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<TaskFieldDefinition['type']>('text');

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    onAddField({ name: newFieldName.trim(), type: newFieldType });
    setNewFieldName('');
    setNewFieldType('text');
    setShowFieldForm(false);
  };

  const todoCount = tasks.filter((t) => t.status !== 'done').length;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
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
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400 flex-1 min-w-[100px]"
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

      {/* Column headers */}
      {fields.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
          <div className="w-4 shrink-0" />
          <div className="flex-1">Task</div>
          {fields.map((f) => (
            <div key={f.id} className="w-20 shrink-0 hidden md:block truncate">{f.name}</div>
          ))}
          <div className="w-4 shrink-0" />
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
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
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              fields={fields}
              onUpdate={(updates) => onTaskUpdate(task.id, updates)}
              onDelete={() => onTaskDelete(task.id)}
              onOpenEmail={onOpenEmail}
            />
          ))
        )}
      </div>

      {/* Add task button */}
      <div className="px-4 py-3 border-t border-gray-200 shrink-0">
        <button
          onClick={() => {
            const title = prompt('Task title:');
            if (title?.trim()) {
              // Emit a synthetic "add" by calling onTaskUpdate with a temp id
              // Callers should handle id='' as a new task creation signal
              onTaskUpdate('', {
                title: title.trim(),
                status: 'todo',
                description: '',
                customFields: {},
              } as Partial<EmailTask>);
            }
          }}
          className="flex items-center gap-2 w-full text-sm text-[#1a73e8] hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors"
        >
          <Plus size={16} />
          Add new task
        </button>
      </div>
    </div>
  );
}
