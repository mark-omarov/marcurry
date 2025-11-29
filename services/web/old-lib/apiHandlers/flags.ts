import { getDb } from '../db';

// Legacy flags CRUD removed. Only the enabled list remains for SDK usage.
export async function listEnabledFlags(query: { productId: string; envId: string; actorId: string }) {
  const adapter = getDb();
  return adapter.getEnabledFlagsForActor(query.productId, query.envId, query.actorId);
}
