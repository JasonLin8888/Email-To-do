'use client';

import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { EmailTask, TaskFieldDefinition, TaskStatus } from '@/lib/email/types';

interface TaskEditorProps {
  task: EmailTask;
  fields: TaskFieldDefinition[];
  onSave: (updates: Partial<EmailTask>) => void;
  onClose: () => void;
  onOpenEmail?: (messageId: string) => void;
}

function hasValidSourceLink(task: EmailTask): boolean {
  return Boolean(task.sourceLink?.messageId?.trim());
}

export default function TaskEditor({
  task,
  fields,
  onSave,
  onClose,
  onOpenEmail,
}: TaskEditorProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [deadline, setDeadline] = useState(task.deadline ?? '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [customFields, setCustomFields] = useState<Record<string, string>>(
    task.customFields ?? {}
  );

  const handleSave = () => {
    onSave({
      title: title.trim(),
      description,
      deadline: deadline || undefined,
      status,
      customFields,
    });
    onClose();
  };

  const setCustomField = (id: string, value: string) => {
    setCustomFields((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="font-semibold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] resize-none"
              placeholder="Add details…"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1a73e8] bg-white"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
            />
          </div>

          {/* Custom fields */}
          {fields.length > 0 && (
            <div className="flex flex-col gap-4 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Custom Fields
              </p>
              {fields.map((field) => (
                <div key={field.id} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600 font-medium">{field.name}</label>
                  {field.type === 'select' && field.options ? (
                    <select
                      value={customFields[field.id] ?? ''}
                      onChange={(e) => setCustomField(field.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1a73e8] bg-white"
                    >
                      <option value="">— select —</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                      value={customFields[field.id] ?? ''}
                      onChange={(e) => setCustomField(field.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Source email */}
          {hasValidSourceLink(task) && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Source Email
              </p>
              <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-1">
                <p className="text-sm text-gray-700 font-medium truncate">{task.sourceLink.subject}</p>
                <p className="text-xs text-gray-500 truncate">{task.sourceLink.sender}</p>
                {onOpenEmail && (
                  <button
                    onClick={() => onOpenEmail(task.sourceLink.messageId)}
                    className="flex items-center gap-1 text-xs text-[#1a73e8] hover:underline mt-1 w-fit"
                  >
                    <ExternalLink size={11} />
                    Open email
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-200 shrink-0">
          <button
            onClick={handleSave}
            className="flex-1 bg-[#1a73e8] text-white text-sm font-medium py-2.5 rounded-full hover:bg-[#1765cc] transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
