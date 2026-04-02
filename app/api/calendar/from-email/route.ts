import { NextRequest, NextResponse } from 'next/server';
import {
  createEvent,
  getMessage,
  inferTaskFromEmail,
  listCalendars,
} from '@/lib/email/nylasClient';

function toUnixSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

function buildEventWindow(deadline?: string): { startTime: number; endTime: number } {
  if (deadline) {
    // Use 9AM UTC on the inferred date as a default planning block.
    const start = new Date(`${deadline}T09:00:00.000Z`).getTime();
    if (!Number.isNaN(start)) {
      return {
        startTime: toUnixSeconds(start),
        endTime: toUnixSeconds(start + 60 * 60 * 1000),
      };
    }
  }

  // Fallback: create a 1-hour event starting one hour from now.
  const now = Date.now();
  const start = now + 60 * 60 * 1000;
  return {
    startTime: toUnixSeconds(start),
    endTime: toUnixSeconds(start + 60 * 60 * 1000),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId } = body as { messageId?: string };

    if (!messageId?.trim()) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const message = await getMessage(messageId);
    const inference = inferTaskFromEmail(message);
    const calendars = await listCalendars();
    const targetCalendar = calendars.find((calendar) => !calendar.readOnly) ?? calendars[0];

    if (!targetCalendar) {
      return NextResponse.json({ error: 'No calendar available on this grant' }, { status: 400 });
    }

    const sender = message.from?.[0]?.name ?? message.from?.[0]?.email ?? 'Unknown sender';
    const eventTitle = (inference.title || message.subject || 'Follow up on email').slice(0, 120);
    const eventDescription = [
      `From: ${sender}`,
      `Subject: ${message.subject || '(no subject)'}`,
      '',
      (message.snippet || '').trim(),
    ].join('\n');

    const when = buildEventWindow(inference.deadline);
    const event = await createEvent({
      calendarId: targetCalendar.id,
      title: eventTitle,
      description: eventDescription,
      startTime: when.startTime,
      endTime: when.endTime,
    });

    return NextResponse.json({
      success: true,
      event,
      calendar: { id: targetCalendar.id, name: targetCalendar.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
