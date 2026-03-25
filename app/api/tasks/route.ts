import { NextResponse } from 'next/server';
import { listTasks } from '@/lib/tasks/taskStore';

export async function GET() {
  try {
    const tasks = listTasks();
    return NextResponse.json(tasks);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
