// ─── Email Types ─────────────────────────────────────────────────────────────

export interface EmailAddress {
  name?: string;
  email: string;
}

/** Lightweight summary shown in the inbox list */
export interface MessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: EmailAddress[];
  to: EmailAddress[];
  snippet: string;
  date: number; // unix timestamp
  unread: boolean;
  starred: boolean;
  labels?: string[];
  folders?: string[];
}

/** Full message detail including body */
export interface MessageDetail extends MessageSummary {
  body: string;
  bodyPlain?: string;
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress[];
  attachments?: Attachment[];
}

/** Email thread (collection of messages) */
export interface Thread {
  id: string;
  subject: string;
  participants: EmailAddress[];
  messageIds: string[];
  snippet: string;
  firstMessageTimestamp: number;
  lastMessageTimestamp: number;
  unread: boolean;
  starred: boolean;
  folders?: string[];
  labels?: string[];
  messages?: MessageDetail[];
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface Folder {
  id: string;
  name: string;
  displayName?: string;
  totalCount?: number;
  unreadCount?: number;
}

export interface Label {
  id: string;
  name: string;
  displayName?: string;
  color?: string;
}

// ─── Compose / Send ──────────────────────────────────────────────────────────

export interface SendMessageParams {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  replyToMessageId?: string;
}

// ─── Task Types ───────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskFieldType = 'text' | 'date' | 'select' | 'number';

/** Definition of a user-defined custom column */
export interface TaskFieldDefinition {
  id: string;
  name: string;
  type: TaskFieldType;
  options?: string[]; // for select type
}

/** Link between a task and its source email */
export interface TaskSourceLink {
  messageId: string;
  threadId?: string;
  sender: string;
  subject: string;
}

/** An email-linked task */
export interface EmailTask {
  id: string;
  sourceEmailId: string;
  sourceThreadId?: string;
  sourceLink: TaskSourceLink;
  title: string;
  description: string;
  deadline?: string; // ISO date string
  status: TaskStatus;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  customFields: Record<string, string>;
}

/** Result of heuristic / AI task inference from an email */
export interface TaskInferenceResult {
  title: string;
  description: string;
  deadline?: string;
  suggestedFields: Record<string, string>;
  confidence: 'high' | 'medium' | 'low';
}

// ─── API pagination ──────────────────────────────────────────────────────────

export interface PaginatedMessages {
  messages: MessageSummary[];
  total?: number;
  offset: number;
  limit: number;
  nextCursor?: string;
}

export interface ListMessagesParams {
  folder?: string;
  limit?: number;
  offset?: number;
  query?: string;
}
