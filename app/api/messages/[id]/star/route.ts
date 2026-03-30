import { NextRequest, NextResponse } from 'next/server';
import { markStar } from '@/lib/email/nylasClient';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const isStarred = body.isStarred !== false; // defaults to true
    await markStar(id, isStarred);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
