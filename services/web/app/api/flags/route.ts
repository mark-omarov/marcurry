import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const adapter = getDb();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get('productId') ?? undefined;
  const envId = url.searchParams.get('envId') ?? undefined;
  const flags = await adapter.listFeatureFlags(productId as any, envId as any);
  return NextResponse.json(flags);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, envId, key, description, gates } = body;
    if (!productId || !envId || !key)
      return NextResponse.json({ error: 'productId, envId and key are required' }, { status: 400 });
    const f = await adapter.createFeatureFlag({
      productId: String(productId),
      envId: String(envId),
      key: String(key),
      description,
      gates: gates ?? [],
    });
    return NextResponse.json(f, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 400 });
  }
}
