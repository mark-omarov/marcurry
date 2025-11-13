import { NextResponse } from 'next/server';
import { getProductById, updateProductById, deleteProductById } from '@/lib/apiHandlers';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const p = await getProductById(params.id);
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(p);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await updateProductById(params.id, { name: body.name, description: body.description });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await deleteProductById(params.id);
  return NextResponse.json({}, { status: 204 });
}
