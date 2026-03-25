import { NextRequest, NextResponse } from 'next/server';
import { listMessages } from '@/lib/email/nylasClient';

const MAX_MESSAGE_PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const folder = searchParams.get('folder') ?? undefined;
    const rawLimit = parseInt(searchParams.get('limit') ?? String(MAX_MESSAGE_PAGE_SIZE), 10);
    const limit = Number.isNaN(rawLimit)
      ? MAX_MESSAGE_PAGE_SIZE
      : Math.min(Math.max(rawLimit, 1), MAX_MESSAGE_PAGE_SIZE);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const query = searchParams.get('query') ?? undefined;

    const data = await listMessages({ folder, limit, offset, query });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
