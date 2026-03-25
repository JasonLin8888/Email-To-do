# Email To-Do

A Gmail-inspired email client with a smart task-management workflow, built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and the **Nylas Email API v3**.

## Features

- **Gmail-like inbox** — familiar layout without category tabs (Primary / Social / Promotions)
- **Right-side task panel** — Notion-style task database integrated directly into the email workflow
- **Smart auto-extraction** — heuristic-based task inference from email content (subject, body, dates)
- **Hover row actions** — Add to To-Do, Archive, Delete, Mark Read from the inbox list
- **Inline task editing** — click to edit task title, status circle cycling, deadline display
- **Custom field columns** — add user-defined fields (Text, Date, Number, Select) to tasks
- **Source email linking** — each task links back to its originating email

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create or edit `.env` with your Nylas credentials:

```
NYLAS_API_KEY=your_nylas_api_key_here
NYLAS_GRANT_ID=your_nylas_grant_id_here
NYLAS_API_BASE_URL=https://api.us.nylas.com
```

### 3. Run in development mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Architecture

```
app/
  page.tsx                    ← Main layout (client component)
  layout.tsx                  ← Root layout
  globals.css                 ← Global styles
  api/
    messages/route.ts         ← GET /api/messages (list)
    messages/[id]/route.ts    ← GET/DELETE /api/messages/:id
    messages/[id]/read/       ← POST (mark read/unread)
    messages/[id]/archive/    ← POST (archive)
    send/route.ts             ← POST /api/send
    folders/route.ts          ← GET /api/folders
    tasks/route.ts            ← GET/POST /api/tasks
    tasks/[id]/route.ts       ← GET/PATCH/DELETE /api/tasks/:id
    tasks/from-email/         ← POST (create task from email with auto-inference)
    tasks/fields/route.ts     ← GET/POST/PATCH/DELETE custom field definitions

lib/
  email/
    nylasClient.ts            ← Server-side Nylas API v3 service layer
    types.ts                  ← Shared TypeScript interfaces
  tasks/
    taskStore.ts              ← In-memory task store (upgrade path to DB documented)

components/
  Sidebar.tsx                 ← Collapsible left nav
  SearchBar.tsx               ← Search input
  MailToolbar.tsx             ← Refresh, folder name, pagination controls
  MailList.tsx                ← Scrollable email list with skeletons
  MailRow.tsx                 ← Individual email row with hover actions
  MessageView.tsx             ← Full email detail view with DOMPurify sanitization
  ComposeModal.tsx            ← Compose new email modal
  TaskPanel.tsx               ← Right-side task panel with inline editing
  TaskEditor.tsx              ← Full task edit drawer
  CustomFieldManager.tsx      ← Add/remove custom column definitions
```

## Task Data Model

```typescript
interface EmailTask {
  id: string;
  sourceEmailId: string;
  sourceThreadId?: string;
  sourceLink: TaskSourceLink;  // sender, subject, messageId
  title: string;
  description: string;
  deadline?: string;           // ISO date string
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
  updatedAt: string;
  customFields: Record<string, string>;
}
```

## Task Auto-Extraction

The `inferTaskFromEmail()` function in `lib/email/nylasClient.ts` uses heuristics to extract task data from email content:

- **Title**: Subject line with "Re:", "Fwd:" prefixes stripped
- **Description**: First 200 chars of plain-text body
- **Deadline**: Regex patterns matching "due [date]", "by [date]", "deadline: [date]"
- **Custom fields**: Course codes (e.g. "CS101") → Class field, sender name → Sender field
- **Confidence**: `high` (deadline found), `medium` (action words found), `low` (otherwise)

> To replace with AI/NLP extraction, swap the body of `inferTaskFromEmail()` with a call to OpenAI, Anthropic, or similar.

## Upgrading the Task Store

The in-memory store in `lib/tasks/taskStore.ts` is designed for easy replacement. To use a real database:

1. Install Prisma/Drizzle/etc.
2. Replace the `Map<>` stores with DB queries
3. Keep the same exported function signatures — API routes need no changes

## Future Enhancements

- Task grouping and filtering
- AI confidence indicators on auto-extracted tasks
- Due-soon highlighting
- Multiple task views (kanban, calendar)
- Full thread view (multi-message conversation)
- Real-time sync via Nylas webhooks
