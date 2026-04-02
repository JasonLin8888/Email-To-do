import { createClient } from '@/utils/supabase/server';
import { EmailTask, TaskFieldDefinition, TaskStatus } from '../email/types';

type TaskRow = {
  id: string;
  source_email_id: string | null;
  source_thread_id: string | null;
  source_link: EmailTask['sourceLink'];
  title: string;
  description: string;
  deadline: string | null;
  status: TaskStatus;
  custom_fields: Record<string, string>;
  created_at: string;
  updated_at: string;
};

type FieldRow = {
  id: string;
  name: string;
  type: TaskFieldDefinition['type'];
  options: string[] | null;
};

const defaultFields: Omit<TaskFieldDefinition, 'id'>[] = [
  { name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
  { name: 'Status', type: 'select', options: ['Not Started', 'In Progress', 'Done'] },
  { name: 'Class', type: 'text' },
  { name: 'Teacher', type: 'text' },
  { name: 'Project', type: 'text' },
  { name: 'Group Members', type: 'text' },
];

function mapTaskRow(row: TaskRow): EmailTask {
  return {
    id: row.id,
    sourceEmailId: row.source_email_id ?? '',
    sourceThreadId: row.source_thread_id ?? undefined,
    sourceLink: row.source_link,
    title: row.title,
    description: row.description,
    deadline: row.deadline ?? undefined,
    status: row.status,
    customFields: row.custom_fields ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFieldRow(row: FieldRow): TaskFieldDefinition {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    options: row.options ?? undefined,
  };
}

async function ensureDefaultFields(): Promise<void> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('task_fields')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;

  if ((count ?? 0) > 0) return;

  const { error: insertError } = await supabase
    .from('task_fields')
    .insert(defaultFields.map((field) => ({
      name: field.name,
      type: field.type,
      options: field.options ?? [],
    })));
  if (insertError) throw insertError;
}

export async function listTasks(): Promise<EmailTask[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('email_tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as TaskRow[]).map(mapTaskRow);
}

export async function getTask(id: string): Promise<EmailTask | undefined> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('email_tasks')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTaskRow(data as TaskRow) : undefined;
}

export async function getTaskBySourceEmailId(sourceEmailId: string): Promise<EmailTask | undefined> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('email_tasks')
    .select('*')
    .eq('source_email_id', sourceEmailId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTaskRow(data as TaskRow) : undefined;
}

export async function createTask(
  data: Omit<EmailTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EmailTask> {
  const supabase = createClient();
  const { data: inserted, error } = await supabase
    .from('email_tasks')
    .insert({
      source_email_id: data.sourceEmailId || null,
      source_thread_id: data.sourceThreadId ?? null,
      source_link: data.sourceLink,
      title: data.title,
      description: data.description,
      deadline: data.deadline ?? null,
      status: data.status,
      custom_fields: data.customFields ?? {},
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapTaskRow(inserted as TaskRow);
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<EmailTask, 'id' | 'createdAt'>>
): Promise<EmailTask | null> {
  const supabase = createClient();
  const updatePayload: Record<string, unknown> = {};

  if (updates.sourceEmailId !== undefined) updatePayload.source_email_id = updates.sourceEmailId;
  if (updates.sourceThreadId !== undefined) updatePayload.source_thread_id = updates.sourceThreadId ?? null;
  if (updates.sourceLink !== undefined) updatePayload.source_link = updates.sourceLink;
  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.description !== undefined) updatePayload.description = updates.description;
  if (updates.deadline !== undefined) updatePayload.deadline = updates.deadline ?? null;
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.customFields !== undefined) updatePayload.custom_fields = updates.customFields;

  const { data, error } = await supabase
    .from('email_tasks')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? mapTaskRow(data as TaskRow) : null;
}

export async function removeTask(id: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('email_tasks')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<EmailTask | null> {
  return updateTask(id, { status });
}

export async function listFields(): Promise<TaskFieldDefinition[]> {
  await ensureDefaultFields();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('task_fields')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as FieldRow[]).map(mapFieldRow);
}

export async function addField(data: Omit<TaskFieldDefinition, 'id'>): Promise<TaskFieldDefinition> {
  const supabase = createClient();
  const { data: inserted, error } = await supabase
    .from('task_fields')
    .insert({
      name: data.name,
      type: data.type,
      options: data.options ?? [],
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapFieldRow(inserted as FieldRow);
}

export async function removeField(id: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('task_fields')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function updateField(
  id: string,
  updates: Partial<Omit<TaskFieldDefinition, 'id'>>
): Promise<TaskFieldDefinition | null> {
  const supabase = createClient();
  const updatePayload: Record<string, unknown> = {};

  if (updates.name !== undefined) updatePayload.name = updates.name;
  if (updates.type !== undefined) updatePayload.type = updates.type;
  if (updates.options !== undefined) updatePayload.options = updates.options;

  const { data, error } = await supabase
    .from('task_fields')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? mapFieldRow(data as FieldRow) : null;
}
