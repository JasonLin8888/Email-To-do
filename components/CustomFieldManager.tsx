'use client';

import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import type { TaskFieldDefinition, TaskFieldType } from '@/lib/email/types';

interface CustomFieldManagerProps {
  fields: TaskFieldDefinition[];
  onAdd: (f: Omit<TaskFieldDefinition, 'id'>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const FIELD_TYPE_LABELS: Record<TaskFieldType, string> = {
  text: 'Text',
  date: 'Date',
  number: 'Number',
  select: 'Select',
};

export default function CustomFieldManager({
  fields,
  onAdd,
  onRemove,
  onClose,
}: CustomFieldManagerProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TaskFieldType>('text');
  const [optionsRaw, setOptionsRaw] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!name.trim()) {
      setError('Field name is required.');
      return;
    }
    const options =
      type === 'select'
        ? optionsRaw.split(',').map((o) => o.trim()).filter(Boolean)
        : undefined;
    onAdd({ name: name.trim(), type, options });
    setName('');
    setType('text');
    setOptionsRaw('');
    setError('');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Custom Fields</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Existing fields */}
          <div className="flex-1 overflow-y-auto max-h-64 divide-y divide-gray-100">
            {fields.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No custom fields yet.</p>
            ) : (
              fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">{field.name}</span>
                    <span className="text-xs text-gray-500">
                      {FIELD_TYPE_LABELS[field.type]}
                      {field.options && field.options.length > 0
                        ? ` — ${field.options.join(', ')}`
                        : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemove(field.id)}
                    className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    title="Remove field"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add new field form */}
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add New Field</p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Field name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskFieldType)}
                className="border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1a73e8] bg-white"
              >
                {(Object.keys(FIELD_TYPE_LABELS) as TaskFieldType[]).map((t) => (
                  <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {type === 'select' && (
              <input
                type="text"
                placeholder="Options (comma-separated)"
                value={optionsRaw}
                onChange={(e) => setOptionsRaw(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
              />
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 bg-[#1a73e8] text-white text-sm font-medium py-2.5 rounded-full hover:bg-[#1765cc] transition-colors"
            >
              <Plus size={15} />
              Add Field
            </button>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
