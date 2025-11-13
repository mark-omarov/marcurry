import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const adapter = getDb();

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const f = await adapter.getFeatureFlag(params.id);
  if (!f) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(f);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await adapter.updateFeatureFlag(params.id, {
      key: body.key,
      description: body.description,
      gates: body.gates,
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await adapter.deleteFeatureFlag(params.id);
  return NextResponse.json({}, { status: 204 });
}
