import { NextRequest, NextResponse } from 'next/server';
import { listTasks, createTask } from '@/lib/tasks/taskStore';

export async function GET() {
  try {
    const tasks = listTasks();
    return NextResponse.json(tasks);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task = createTask({
      sourceEmailId: body.sourceEmailId ?? '',
      sourceThreadId: body.sourceThreadId,
      sourceLink: body.sourceLink ?? {
        messageId: '',
        threadId: '',
        sender: '',
        subject: '',
      },
      title: body.title ?? 'New Task',
      description: body.description ?? '',
      deadline: body.deadline,
      status: body.status ?? 'todo',
      customFields: body.customFields ?? {},
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
