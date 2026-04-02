/**
 * nylasClient.ts
 *
 * Server-side only. All Nylas API v3 calls happen here.
 * Never import this module in client components.
 */

import {
  MessageSummary,
  MessageDetail,
  Folder,
  Label,
  SendMessageParams,
  ListMessagesParams,
  PaginatedMessages,
  TaskInferenceResult,
} from './types';

const API_KEY = process.env.NYLAS_API_KEY!;
const GRANT_ID = process.env.NYLAS_GRANT_ID!;
const MAX_MESSAGE_PAGE_SIZE = 40;

function normalizeNylasBaseUrl(rawBaseUrl?: string): string {
  const fallback = 'https://api.us.nylas.com';
  const base = (rawBaseUrl ?? fallback).trim();

  // Nylas v3 requires a regional host. `api.nylas.com` returns 404.
  if (/^https:\/\/api\.nylas\.com\/?$/i.test(base)) {
    return fallback;
  }

  return base.replace(/\/$/, '');
}

const BASE_URL = normalizeNylasBaseUrl(process.env.NYLAS_API_BASE_URL);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Base fetch helper ────────────────────────────────────────────────────────

async function nylasRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
    });

    if (res.ok) {
      if (res.status === 204) return {} as T;
      return res.json() as Promise<T>;
    }

    const text = await res.text();

    if (res.status === 429 && attempt < maxAttempts) {
      const retryAfterSeconds = Number(res.headers.get('retry-after') ?? '0');
      const waitMs = retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : Math.min(300 * (2 ** (attempt - 1)), 2000);
      await sleep(waitMs);
      continue;
    }

    throw new Error(`Nylas API error ${res.status}: ${text}`);
  }

  throw new Error('Nylas API error 429: retry attempts exhausted');
}

// ─── Message mapping ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessage(raw: any): MessageSummary {
  return {
    id: raw.id,
    threadId: raw.thread_id ?? '',
    subject: raw.subject ?? '(no subject)',
    from: raw.from ?? [],
    to: raw.to ?? [],
    snippet: raw.snippet ?? '',
    date: raw.date ?? 0,
    unread: raw.unread ?? false,
    starred: raw.starred ?? false,
    labels: raw.labels ?? [],
    folders: raw.folders ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessageDetail(raw: any): MessageDetail {
  return {
    ...mapMessage(raw),
    body: raw.body ?? '',
    bodyPlain: raw.body_plain ?? '',
    cc: raw.cc ?? [],
    bcc: raw.bcc ?? [],
    replyTo: raw.reply_to ?? [],
    attachments: (raw.attachments ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => ({
        id: a.id,
        filename: a.filename ?? 'attachment',
        contentType: a.content_type ?? 'application/octet-stream',
        size: a.size ?? 0,
      })
    ),
  };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function listMessages(
  params: ListMessagesParams = {}
): Promise<PaginatedMessages> {
  const { folder, limit = MAX_MESSAGE_PAGE_SIZE, offset = 0, query } = params;
  const safeLimit = Math.min(Math.max(limit, 1), MAX_MESSAGE_PAGE_SIZE);

  const qs = new URLSearchParams();
  qs.set('limit', String(safeLimit));
  qs.set('offset', String(offset));
  if (folder) qs.set('in', folder);
  if (query) qs.set('q', query);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await nylasRequest<any>(
    `/v3/grants/${GRANT_ID}/messages?${qs.toString()}`
  );

  const messages: MessageSummary[] = (data.data ?? []).map(mapMessage);
  return {
    messages,
    total: undefined, // Nylas v3 doesn't reliably return total count
    offset,
    limit: safeLimit,
    nextCursor: data.next_cursor,
  };
}

export async function getMessage(messageId: string): Promise<MessageDetail> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await nylasRequest<any>(
    `/v3/grants/${GRANT_ID}/messages/${messageId}`
  );
  return mapMessageDetail(data.data ?? data);
}

export async function getThread(threadId: string): Promise<MessageDetail[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await nylasRequest<any>(
    `/v3/grants/${GRANT_ID}/threads/${threadId}`
  );
  const raw = data.data ?? data;
  const messageIds: string[] = raw.message_ids ?? raw.draft_ids ?? [];
  // Fetch full messages sequentially to avoid concurrent-request rate limits.
  const messages: MessageDetail[] = [];
  for (const id of messageIds) {
    messages.push(await getMessage(id));
  }
  return messages;
}

export async function sendMessage(params: SendMessageParams): Promise<void> {
  await nylasRequest(`/v3/grants/${GRANT_ID}/messages/send`, {
    method: 'POST',
    body: JSON.stringify({
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      body: params.body,
      reply_to_message_id: params.replyToMessageId,
    }),
  });
}

export async function deleteMessage(messageId: string): Promise<void> {
  await nylasRequest(`/v3/grants/${GRANT_ID}/messages/${messageId}`, {
    method: 'DELETE',
  });
}

export async function archiveMessage(messageId: string): Promise<void> {
  // Nylas v3: move message to "archive" folder
  await nylasRequest(`/v3/grants/${GRANT_ID}/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ folders: ['archive'] }),
  });
}

export async function markRead(
  messageId: string,
  isRead: boolean
): Promise<void> {
  await nylasRequest(`/v3/grants/${GRANT_ID}/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ unread: !isRead }),
  });
}

export async function markStar(
  messageId: string,
  isStarred: boolean
): Promise<void> {
  await nylasRequest(`/v3/grants/${GRANT_ID}/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ starred: isStarred }),
  });
}

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function listFolders(): Promise<Folder[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await nylasRequest<any>(
    `/v3/grants/${GRANT_ID}/folders`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data ?? []).map((f: any): Folder => ({
    id: f.id,
    name: f.name ?? f.id,
    displayName: f.display_name ?? f.name ?? f.id,
    totalCount: f.total_count,
    unreadCount: f.unread_count,
  }));
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export async function listLabels(): Promise<Label[]> {
  // Nylas v3 Gmail uses folders as labels; provide a stub for non-Gmail
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await nylasRequest<any>(
      `/v3/grants/${GRANT_ID}/labels`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.data ?? []).map((l: any): Label => ({
      id: l.id,
      name: l.name ?? l.id,
      displayName: l.display_name ?? l.name ?? l.id,
      color: l.color,
    }));
  } catch {
    // Non-Gmail accounts may not support labels — return empty
    return [];
  }
}

export async function createLabel(name: string): Promise<Label> {
  // TODO: implement via Nylas v3 when provider supports it
  // For Gmail this maps to creating a folder/label
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await nylasRequest<any>(
    `/v3/grants/${GRANT_ID}/labels`,
    {
      method: 'POST',
      body: JSON.stringify({ name }),
    }
  );
  const l = data.data ?? data;
  return {
    id: l.id,
    name: l.name ?? name,
    displayName: l.display_name ?? l.name ?? name,
    color: l.color,
  };
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export interface CalendarSummary {
  id: string;
  name: string;
  readOnly: boolean;
}

export async function listCalendars(): Promise<CalendarSummary[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await nylasRequest<any>(`/v3/grants/${GRANT_ID}/calendars`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data ?? []).map((calendar: any): CalendarSummary => ({
    id: calendar.id,
    name: calendar.name ?? calendar.id,
    readOnly: Boolean(calendar.read_only),
  }));
}

export async function createEvent(params: {
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: number;
  endTime: number;
}): Promise<{ id: string; title: string }> {
  const qs = new URLSearchParams({ calendar_id: params.calendarId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await nylasRequest<any>(
    `/v3/grants/${GRANT_ID}/events?${qs.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: params.title,
        description: params.description,
        location: params.location,
        when: {
          start_time: params.startTime,
          end_time: params.endTime,
        },
      }),
    }
  );

  const event = data.data ?? data;
  return {
    id: event.id,
    title: event.title ?? params.title,
  };
}

// ─── Task helpers (inference only — storage is in /lib/tasks/taskStore.ts) ───

/**
 * Heuristic-based task inference from an email message.
 *
 * In a future version, replace the heuristics below with a call to an
 * AI/NLP API (e.g., OpenAI, Anthropic) to extract structured task data.
 */
export function inferTaskFromEmail(
  message: MessageDetail | MessageSummary
): TaskInferenceResult {
  const subject = message.subject ?? '';
  const body = 'body' in message ? (message.body ?? '') : '';
  const plain = body.replace(/<[^>]*>/g, ' ');

  // ── Deadline extraction ──────────────────────────────────────────────────
  let deadline: string | undefined;

  // Look for "due [date]", "by [date]", "deadline: [date]"
  const duePhrases = [
    /\bdue\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)/i,
    /\bby\s+([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)/i,
    /\bdeadline[:\s]+([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)/i,
    /\bdue\s+(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i,
  ];

  const fullText = `${subject} ${plain}`;
  for (const pattern of duePhrases) {
    const match = fullText.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!Number.isNaN(parsed.getTime())) {
        deadline = parsed.toISOString().split('T')[0];
        break;
      }
    }
  }

  // ── Title ────────────────────────────────────────────────────────────────
  // Use the subject as the task title; strip "Re:", "Fwd:" prefixes
  const title = subject.replace(/^(Re|Fwd?):\s*/i, '').trim() || 'Untitled Task';

  // ── Description ─────────────────────────────────────────────────────────
  // Use first 200 chars of plaintext body as description
  const description = plain.trim().slice(0, 200).replace(/\s+/g, ' ');

  // ── Confidence ───────────────────────────────────────────────────────────
  const hasActionWords = /\b(please|submit|complete|send|finish|review|due|deadline|action required|todo|to-do|assignment)\b/i.test(fullText);
  const confidence: 'high' | 'medium' | 'low' = deadline
    ? 'high'
    : hasActionWords
    ? 'medium'
    : 'low';

  // ── Suggested custom fields ──────────────────────────────────────────────
  const suggestedFields: Record<string, string> = {};

  // Try to infer class name from subject (e.g., "CS101", "MATH 201")
  const classMatch = subject.match(/\b([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\b/);
  if (classMatch) suggestedFields['class'] = classMatch[1];

  // Infer sender as a suggested "teacher" or "contact"
  const sender =
    message.from?.[0]?.name ?? message.from?.[0]?.email ?? '';
  if (sender) suggestedFields['sender'] = sender;

  return { title, description, deadline, suggestedFields, confidence };
}
