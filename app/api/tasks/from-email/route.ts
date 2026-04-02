import { NextRequest, NextResponse } from 'next/server';
import { getMessage, inferTaskFromEmail } from '@/lib/email/nylasClient';
import { createTask, getTaskBySourceEmailId } from '@/lib/tasks/taskStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId } = body as { messageId: string };

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const existingTask = await getTaskBySourceEmailId(messageId);
    if (existingTask) {
      return NextResponse.json(existingTask);
    }

    const message = await getMessage(messageId);
    const inference = inferTaskFromEmail(message);

    const sender =
      message.from?.[0]?.name
        ? `${message.from[0].name} <${message.from[0].email}>`
        : (message.from?.[0]?.email ?? 'Unknown');

    const task = await createTask({
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
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      String((err as { code: unknown }).code) === '23505'
    ) {
      return NextResponse.json({ error: 'Task already exists for this email' }, { status: 409 });
    }

    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
