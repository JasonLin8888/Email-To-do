/**
 * taskStore.ts
 *
 * In-memory task storage with a clear upgrade path to a real database.
 *
 * To replace with a database (e.g., Prisma, Drizzle, SQLite):
 * 1. Remove the in-memory Map stores below.
 * 2. Replace each function body with the corresponding DB query.
 * 3. Keep the same exported function signatures so API routes need no changes.
 */

import { EmailTask, TaskFieldDefinition, TaskStatus } from '../email/types';

// ─── Tiny UUID helper ─────────────────────────────────────────────────────────
function newId(): string {
  // crypto.randomUUID() is available in Node 19+ and modern browsers
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── In-memory stores ─────────────────────────────────────────────────────────

const tasks = new Map<string, EmailTask>();
const fields = new Map<string, TaskFieldDefinition>();

// Seed a few default custom field definitions
const defaultFields: TaskFieldDefinition[] = [
  { id: 'field-priority', name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
  { id: 'field-status-custom', name: 'Status', type: 'select', options: ['Not Started', 'In Progress', 'Done'] },
  { id: 'field-class', name: 'Class', type: 'text' },
  { id: 'field-teacher', name: 'Teacher', type: 'text' },
  { id: 'field-project', name: 'Project', type: 'text' },
  { id: 'field-group', name: 'Group Members', type: 'text' },
];
for (const f of defaultFields) fields.set(f.id, f);

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function listTasks(): EmailTask[] {
  return Array.from(tasks.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getTask(id: string): EmailTask | undefined {
  return tasks.get(id);
}

export function createTask(data: Omit<EmailTask, 'id' | 'createdAt' | 'updatedAt'>): EmailTask {
  const now = new Date().toISOString();
  const task: EmailTask = {
    ...data,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  };
  tasks.set(task.id, task);
  return task;
}

export function updateTask(
  id: string,
  updates: Partial<Omit<EmailTask, 'id' | 'createdAt'>>
): EmailTask | null {
  const existing = tasks.get(id);
  if (!existing) return null;
  const updated: EmailTask = {
    ...existing,
    ...updates,
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  tasks.set(id, updated);
  return updated;
}

export function removeTask(id: string): boolean {
  return tasks.delete(id);
}

export function updateTaskStatus(id: string, status: TaskStatus): EmailTask | null {
  return updateTask(id, { status });
}

// ─── Custom field definitions ─────────────────────────────────────────────────

export function listFields(): TaskFieldDefinition[] {
  return Array.from(fields.values());
}

export function addField(data: Omit<TaskFieldDefinition, 'id'>): TaskFieldDefinition {
  const field: TaskFieldDefinition = { ...data, id: newId() };
  fields.set(field.id, field);
  return field;
}

export function removeField(id: string): boolean {
  return fields.delete(id);
}

export function updateField(
  id: string,
  updates: Partial<Omit<TaskFieldDefinition, 'id'>>
): TaskFieldDefinition | null {
  const existing = fields.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates, id };
  fields.set(id, updated);
  return updated;
}
