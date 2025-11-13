import { NextResponse } from 'next/server';
import { getEnvironmentById, updateEnvironmentById, deleteEnvironmentById } from '@/lib/apiHandlers';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const e = await getEnvironmentById(params.id);
  if (!e) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(e);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await updateEnvironmentById(params.id, { name: body.name, description: body.description });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await deleteEnvironmentById(params.id);
  return NextResponse.json({}, { status: 204 });
}
