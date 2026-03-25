import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/email/nylasClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await sendMessage({
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      body: body.body,
      replyToMessageId: body.replyToMessageId,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
