import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const adapter = getDb();

export async function GET() {
  const products = await adapter.listProducts();
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const p = await adapter.createProduct({ name: String(body.name), description: body.description });
    return NextResponse.json(p, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
