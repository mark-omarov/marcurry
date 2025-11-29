import { Redis } from 'ioredis';
import type {
  Environment,
  Feature,
  FeatureEnvConfig,
  FeatureFlag,
  GateActors,
  GateAll,
  ID,
  Product,
} from '../db/types';
import type { StorageAdapter } from '../db/StorageAdapter';
import { nowIso, toSnakeCase } from '../db/utils';

const H_PRODUCTS = 'products';
const H_ENVIRONMENTS = 'environments';
// New buckets (decoupled model)
const H_FEATURES = 'features';
const H_FEATURE_ENV_CONFIGS = 'feature_env_configs';

export class RedisAdapter implements StorageAdapter {
  private redis: Redis;

  private cfgKey(featureId: ID, envId: ID) {
    return `${featureId}::${envId}`;
  }

  private makeFlag(feature: Feature, cfg: FeatureEnvConfig): FeatureFlag {
    return {
      id: `${feature.id}__${cfg.envId}`,
      createdAt: feature.createdAt,
      productId: feature.productId,
      envId: cfg.envId,
      label: feature.label,
      description: feature.description,
      enabled: cfg.enabled,
      gates: cfg.gates ?? [],
    };
  }

  constructor(client: Redis) {
    this.redis = client;
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>) {
    const id = toSnakeCase(product.name);
    const r: Product = { id, createdAt: nowIso(), ...product };
    await this.redis.hset(H_PRODUCTS, id, JSON.stringify(r));
    return r;
  }

  async getProduct(id: ID) {
    const data = await this.redis.hget(H_PRODUCTS, id);
    return data ? (JSON.parse(data) as Product) : null;
  }

  async updateProduct(id: ID, patch: Partial<Omit<Product, 'id' | 'name' | 'createdAt'>>) {
    const data = await this.redis.hget(H_PRODUCTS, id);
    if (!data) throw new Error(`product not found: ${id}`);

    const cur = JSON.parse(data) as Product;
    const updated = { ...cur, description: patch.description ?? cur.description };

    await this.redis.hset(H_PRODUCTS, id, JSON.stringify(updated));
    return updated;
  }

  async deleteProduct(id: ID) {
    const allEnvs = await this.listEnvironments();
    const envIdsToDelete = allEnvs.filter((env) => env.productId === id).map((env) => env.id);

    const features = await this.listFeatures(id);
    const featureIdsToDelete = features.map((f) => f.id);

    const allCfgs = await this.listFeatureEnvConfigs();
    const cfgKeysToDelete = allCfgs.filter((c) => featureIdsToDelete.includes(c.featureId)).map((c) => this.cfgKey(c.featureId, c.envId));

    const multi = this.redis.multi();
    if (envIdsToDelete.length > 0) multi.hdel(H_ENVIRONMENTS, ...envIdsToDelete);
    if (featureIdsToDelete.length > 0) multi.hdel(H_FEATURES, ...featureIdsToDelete);
    if (cfgKeysToDelete.length > 0) multi.hdel(H_FEATURE_ENV_CONFIGS, ...cfgKeysToDelete);
    multi.hdel(H_PRODUCTS, id);

    await multi.exec();
  }

  async listProducts() {
    const all = await this.redis.hvals(H_PRODUCTS);
    return all.map((data) => JSON.parse(data) as Product);
  }

  async createEnvironment(env: Omit<Environment, 'id' | 'createdAt'>) {
    const id = toSnakeCase(env.name);
    const r: Environment = { id, createdAt: nowIso(), ...env };
    await this.redis.hset(H_ENVIRONMENTS, id, JSON.stringify(r));
    return r;
  }

  async getEnvironment(id: ID) {
    const data = await this.redis.hget(H_ENVIRONMENTS, id);
    return data ? (JSON.parse(data) as Environment) : null;
  }

  async updateEnvironment(id: ID, patch: Partial<Omit<Environment, 'id' | 'name' | 'createdAt'>>) {
    const data = await this.redis.hget(H_ENVIRONMENTS, id);
    if (!data) throw new Error(`environment not found: ${id}`);

    const cur = JSON.parse(data) as Environment;
    const updated = { ...cur, description: patch.description ?? cur.description };

    await this.redis.hset(H_ENVIRONMENTS, id, JSON.stringify(updated));
    return updated;
  }

  async deleteEnvironment(id: ID) {
    // Remove all feature env configs tied to this environment
    const allCfgs = await this.listFeatureEnvConfigs(undefined, id);
    const cfgKeysToDelete = allCfgs.map((c) => this.cfgKey(c.featureId, c.envId));
    const multi = this.redis.multi();
    if (cfgKeysToDelete.length > 0) multi.hdel(H_FEATURE_ENV_CONFIGS, ...cfgKeysToDelete);
    multi.hdel(H_ENVIRONMENTS, id);
    await multi.exec();
  }

  async listEnvironments(productId?: ID) {
    const all = await this.redis.hvals(H_ENVIRONMENTS);
    const allEnvs = all.map((data) => JSON.parse(data) as Environment);

    return typeof productId === 'undefined' ? allEnvs : allEnvs.filter((e) => e.productId === productId);
  }

  async getEnabledFlagsForActor(productId: ID, envId: ID, actorId: string) {
    // Build flags from decoupled model for the specific product + environment
    const features = await this.listFeatures(productId);
    const cfgs = await this.listFeatureEnvConfigs(undefined, envId);
    const cfgByFeature = new Map(cfgs.map((c) => [c.featureId, c] as const));
    const result: FeatureFlag[] = [];
    for (const f of features) {
      const cfg = cfgByFeature.get(f.id) ?? { featureId: f.id, envId, enabled: false, gates: [] };
      const flag = this.makeFlag(f, cfg);
      if (this.flagEnabledForActor(flag, actorId)) result.push(flag);
    }
    return result;
  }

  private flagEnabledForActor(flag: FeatureFlag, actorId: string) {
    if (!flag.enabled) return false;

    if (!flag.gates || flag.gates.length === 0) return false;

    for (const g of flag.gates) {
      if (g.type === 'all') {
        const ga = g as GateAll;
        if (ga.enabled) return true;
      }

      if (g.type === 'actors') {
        const gu = g as GateActors;
        if (gu.actorIds.includes(actorId)) return true;
      }
    }

    return false;
  }
  // New decoupled API
  async createFeature(feature: Omit<Feature, 'id' | 'createdAt'>): Promise<Feature> {
    const productExists = await this.redis.hexists(H_PRODUCTS, feature.productId);
    if (!productExists) throw new Error(`product not found: ${feature.productId}`);
    const id = toSnakeCase(feature.label);
    const exists = await this.redis.hexists(H_FEATURES, id);
    if (exists) throw new Error(`feature already exists: ${id}`);
    const r: Feature = { id, createdAt: nowIso(), ...feature };
    await this.redis.hset(H_FEATURES, id, JSON.stringify(r));
    return r;
  }

  async getFeature(id: ID): Promise<Feature | null> {
    const data = await this.redis.hget(H_FEATURES, id);
    return data ? (JSON.parse(data) as Feature) : null;
  }

  async updateFeature(
    id: ID,
    patch: Partial<Omit<Feature, 'id' | 'productId' | 'createdAt'>>
  ): Promise<Feature> {
    const data = await this.redis.hget(H_FEATURES, id);
    if (!data) throw new Error(`feature not found: ${id}`);
    const cur = JSON.parse(data) as Feature;
    const updated: Feature = {
      ...cur,
      label: typeof patch.label === 'undefined' ? cur.label : patch.label,
      description: typeof patch.description === 'undefined' ? cur.description : patch.description,
    };
    await this.redis.hset(H_FEATURES, id, JSON.stringify(updated));
    return updated;
  }

  async deleteFeature(id: ID): Promise<void> {
    const cfgs = await this.listFeatureEnvConfigs(id);
    const keys = cfgs.map((c) => this.cfgKey(c.featureId, c.envId));
    const multi = this.redis.multi();
    if (keys.length > 0) multi.hdel(H_FEATURE_ENV_CONFIGS, ...keys);
    multi.hdel(H_FEATURES, id);
    await multi.exec();
  }

  async listFeatures(productId?: ID): Promise<Feature[]> {
    const all = await this.redis.hvals(H_FEATURES);
    const features = all.map((d) => JSON.parse(d) as Feature);
    return productId ? features.filter((f) => f.productId === productId) : features;
  }

  async upsertFeatureEnvConfig(config: FeatureEnvConfig): Promise<FeatureEnvConfig> {
    const fExists = await this.redis.hexists(H_FEATURES, config.featureId);
    if (!fExists) throw new Error(`feature not found: ${config.featureId}`);
    const eExists = await this.redis.hexists(H_ENVIRONMENTS, config.envId);
    if (!eExists) throw new Error(`environment not found: ${config.envId}`);
    const key = this.cfgKey(config.featureId, config.envId);
    await this.redis.hset(H_FEATURE_ENV_CONFIGS, key, JSON.stringify({ ...config, gates: config.gates ?? [] }));
    const saved = await this.redis.hget(H_FEATURE_ENV_CONFIGS, key);
    return JSON.parse(saved!) as FeatureEnvConfig;
  }

  async getFeatureEnvConfig(featureId: ID, envId: ID): Promise<FeatureEnvConfig | null> {
    const data = await this.redis.hget(H_FEATURE_ENV_CONFIGS, this.cfgKey(featureId, envId));
    return data ? (JSON.parse(data) as FeatureEnvConfig) : null;
  }

  async deleteFeatureEnvConfig(featureId: ID, envId: ID): Promise<void> {
    await this.redis.hdel(H_FEATURE_ENV_CONFIGS, this.cfgKey(featureId, envId));
  }

  async listFeatureEnvConfigs(featureId?: ID, envId?: ID): Promise<FeatureEnvConfig[]> {
    const all = await this.redis.hvals(H_FEATURE_ENV_CONFIGS);
    const cfgs = all.map((d) => JSON.parse(d) as FeatureEnvConfig);
    return cfgs.filter((c) => (featureId ? c.featureId === featureId : true) && (envId ? c.envId === envId : true));
  }
}

export default RedisAdapter;
