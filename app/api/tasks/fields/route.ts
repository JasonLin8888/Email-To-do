import { NextRequest, NextResponse } from 'next/server';
import { listFields, addField, removeField, updateField } from '@/lib/tasks/taskStore';

export async function GET() {
  return NextResponse.json(await listFields());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const field = await addField({
      name: body.name,
      type: body.type ?? 'text',
      options: body.options,
    });
    return NextResponse.json(field, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const field = await updateField(id, updates);
    if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(field);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const deleted = await removeField(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
