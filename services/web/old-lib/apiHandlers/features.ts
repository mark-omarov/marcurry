import { getDb } from '../db';
import type { Feature } from '../db/types';

const adapter = getDb();

export async function listFeatures(query: { productId?: string } = {}): Promise<Feature[]> {
  return adapter.listFeatures(query.productId);
}

export async function createFeature(body: unknown): Promise<Feature> {
  const b = (body as Record<string, unknown>) ?? {};
  const { productId, label, description } = b;
  if (!productId || !label) throw new Error('productId and label are required');
  return adapter.createFeature({
    productId: String(productId),
    label: String(label),
    description: typeof description === 'undefined' ? undefined : String(description),
  });
}

export async function getFeatureById(id: string): Promise<Feature | null> {
  return adapter.getFeature(id);
}

export async function updateFeatureById(id: string, body: unknown): Promise<Feature> {
  const b = (body as Record<string, unknown>) ?? {};
  return adapter.updateFeature(id, {
    label: typeof b.label === 'undefined' ? undefined : String(b.label),
    description: typeof b.description === 'undefined' ? undefined : String(b.description),
  });
}

export async function deleteFeatureById(id: string): Promise<void> {
  return adapter.deleteFeature(id);
}
