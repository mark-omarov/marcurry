import { NextResponse } from 'next/server';
import { getFeatureFlagById, updateFeatureFlagById, deleteFeatureFlagById } from '@/lib/apiHandlers';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const f = await getFeatureFlagById(params.id);
  if (!f) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(f);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await updateFeatureFlagById(params.id, body);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await deleteFeatureFlagById(params.id);
  return NextResponse.json({}, { status: 204 });
}
