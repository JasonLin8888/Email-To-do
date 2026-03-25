import { NextRequest, NextResponse } from 'next/server';
import { getMessage, inferTaskFromEmail } from '@/lib/email/nylasClient';
import { createTask } from '@/lib/tasks/taskStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId } = body as { messageId: string };

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const message = await getMessage(messageId);
    const inference = inferTaskFromEmail(message);

    const sender =
      message.from?.[0]?.name
        ? `${message.from[0].name} <${message.from[0].email}>`
        : (message.from?.[0]?.email ?? 'Unknown');

    const task = createTask({
      sourceEmailId: messageId,
      sourceThreadId: message.threadId,
      sourceLink: {
        messageId,
        threadId: message.threadId,
        sender,
        subject: message.subject,
      },
      title: body.title ?? inference.title,
      description: body.description ?? inference.description,
      deadline: body.deadline ?? inference.deadline,
      status: 'todo',
      customFields: {
        ...inference.suggestedFields,
        ...(body.customFields ?? {}),
      },
    });

    return NextResponse.json(task);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
