import { NextRequest, NextResponse } from 'next/server';
import { listMessages } from '@/lib/email/nylasClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const folder = searchParams.get('folder') ?? undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const query = searchParams.get('query') ?? undefined;

    const data = await listMessages({ folder, limit, offset, query });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
