import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const adapter = getDb();

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const e = await adapter.getEnvironment(params.id);
  if (!e) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(e);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await adapter.updateEnvironment(params.id, { name: body.name, description: body.description });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await adapter.deleteEnvironment(params.id);
  return NextResponse.json({}, { status: 204 });
}
