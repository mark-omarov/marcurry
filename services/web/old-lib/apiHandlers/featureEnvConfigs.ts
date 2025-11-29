import { getDb } from '../db';
import type { FeatureEnvConfig, ID } from '../db/types';

const adapter = getDb();

export async function upsertFeatureEnvConfig(body: unknown): Promise<FeatureEnvConfig> {
  const b = (body as Record<string, unknown>) ?? {};
  const { featureId, envId, enabled, gates } = b;
  if (!featureId || !envId || typeof enabled === 'undefined') {
    throw new Error('featureId, envId and enabled are required');
  }
  return adapter.upsertFeatureEnvConfig({
    featureId: String(featureId),
    envId: String(envId),
    enabled: Boolean(enabled),
    gates: Array.isArray(gates) ? (gates as unknown as FeatureEnvConfig['gates']) : [],
  });
}

export async function getFeatureEnvConfig(featureId: ID, envId: ID): Promise<FeatureEnvConfig | null> {
  return adapter.getFeatureEnvConfig(featureId, envId);
}

export async function deleteFeatureEnvConfig(featureId: ID, envId: ID): Promise<void> {
  return adapter.deleteFeatureEnvConfig(featureId, envId);
}

export async function listFeatureEnvConfigs(query: { featureId?: ID; envId?: ID } = {}): Promise<FeatureEnvConfig[]> {
  return adapter.listFeatureEnvConfigs(query.featureId, query.envId);
}
