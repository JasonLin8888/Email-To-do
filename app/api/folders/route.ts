import { NextResponse } from 'next/server';
import { listFolders } from '@/lib/email/nylasClient';

export async function GET() {
  try {
    const folders = await listFolders();
    return NextResponse.json(folders);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
