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

export class InMemoryAdapter implements StorageAdapter {
  private products = new Map<ID, Product>();
  private environments = new Map<ID, Environment>();
  // New decoupled storage
  private features = new Map<ID, Feature>();
  private featureEnvConfigs = new Map<string, FeatureEnvConfig>(); // key: featureId::envId

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

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>) {
    const id = toSnakeCase(product.name);
    const r: Product = { id, createdAt: nowIso(), ...product };
    this.products.set(id, r);
    return r;
  }

  async getProduct(id: ID) {
    return this.products.get(id) ?? null;
  }

  async updateProduct(id: ID, patch: Partial<Omit<Product, 'id' | 'name' | 'createdAt'>>) {
    const cur = this.products.get(id);
    if (!cur) throw new Error(`product not found: ${id}`);
    const updated = { ...cur, description: patch.description ?? cur.description };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: ID) {
    // delete related environments
    for (const [envId, env] of this.environments.entries()) {
      if (env.productId === id) this.environments.delete(envId);
    }

    // delete related features and their configs
    for (const [featureId, feature] of this.features.entries()) {
      if (feature.productId === id) {
        // remove configs for this feature
        for (const key of Array.from(this.featureEnvConfigs.keys())) {
          if (key.startsWith(`${featureId}::`)) this.featureEnvConfigs.delete(key);
        }
        this.features.delete(featureId);
      }
    }

    this.products.delete(id);
  }

  async listProducts() {
    return Array.from(this.products.values());
  }

  async createEnvironment(env: Omit<Environment, 'id' | 'createdAt'>) {
    const id = toSnakeCase(env.name);
    const r: Environment = { id, createdAt: nowIso(), ...env };
    this.environments.set(id, r);
    return r;
  }

  async getEnvironment(id: ID) {
    return this.environments.get(id) ?? null;
  }

  async updateEnvironment(id: ID, patch: Partial<Omit<Environment, 'id' | 'name' | 'createdAt'>>) {
    const cur = this.environments.get(id);
    if (!cur) throw new Error(`environment not found: ${id}`);
    const updated = { ...cur, description: patch.description ?? cur.description };
    this.environments.set(id, updated);
    return updated;
  }

  async deleteEnvironment(id: ID) {
    // remove all configs tied to this env
    for (const [key, cfg] of this.featureEnvConfigs.entries()) {
      if (cfg.envId === id) this.featureEnvConfigs.delete(key);
    }
    this.environments.delete(id);
  }

  async listEnvironments(productId?: ID) {
    const all = Array.from(this.environments.values());
    return typeof productId === 'undefined' ? all : all.filter((e) => e.productId === productId);
  }

  async getEnabledFlagsForActor(productId: ID, envId: ID, actorId: string) {
    // Build flags from decoupled model for the specific product + environment
    const features = (await this.listFeatures(productId)) as Feature[];
    const result: FeatureFlag[] = [];
    for (const feature of features) {
      const cfg = this.featureEnvConfigs.get(this.cfgKey(feature.id, envId));
      const effectiveCfg: FeatureEnvConfig = cfg ?? { featureId: feature.id, envId, enabled: false, gates: [] };
      const flag = this.makeFlag(feature, effectiveCfg);
      if (this.flagEnabledForActor(flag, actorId)) {
        result.push(flag);
      }
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

  // New decoupled API implementations
  async createFeature(feature: Omit<Feature, 'id' | 'createdAt'>): Promise<Feature> {
    if (!this.products.has(feature.productId)) throw new Error(`product not found: ${feature.productId}`);
    const id = toSnakeCase(feature.label);
    if (this.features.has(id)) throw new Error(`feature already exists: ${id}`);
    const r: Feature = { id, createdAt: nowIso(), ...feature };
    this.features.set(id, r);
    return r;
  }

  async getFeature(id: ID): Promise<Feature | null> {
    return this.features.get(id) ?? null;
  }

  async updateFeature(
    id: ID,
    patch: Partial<Omit<Feature, 'id' | 'productId' | 'createdAt'>>
  ): Promise<Feature> {
    const cur = this.features.get(id);
    if (!cur) throw new Error(`feature not found: ${id}`);
    const updated = {
      ...cur,
      label: typeof patch.label === 'undefined' ? cur.label : patch.label,
      description: typeof patch.description === 'undefined' ? cur.description : patch.description,
    };
    this.features.set(id, updated);
    return updated;
  }

  async deleteFeature(id: ID): Promise<void> {
    for (const key of Array.from(this.featureEnvConfigs.keys())) {
      if (key.startsWith(`${id}::`)) this.featureEnvConfigs.delete(key);
    }
    this.features.delete(id);
  }

  async listFeatures(productId?: ID): Promise<Feature[]> {
    const all = Array.from(this.features.values());
    return productId ? all.filter((f) => f.productId === productId) : all;
  }

  async upsertFeatureEnvConfig(config: FeatureEnvConfig): Promise<FeatureEnvConfig> {
    if (!this.features.has(config.featureId)) throw new Error(`feature not found: ${config.featureId}`);
    if (!this.environments.has(config.envId)) throw new Error(`environment not found: ${config.envId}`);
    const key = this.cfgKey(config.featureId, config.envId);
    this.featureEnvConfigs.set(key, { ...config, gates: config.gates ?? [] });
    return this.featureEnvConfigs.get(key)!;
  }

  async getFeatureEnvConfig(featureId: ID, envId: ID): Promise<FeatureEnvConfig | null> {
    return this.featureEnvConfigs.get(this.cfgKey(featureId, envId)) ?? null;
  }

  async deleteFeatureEnvConfig(featureId: ID, envId: ID): Promise<void> {
    this.featureEnvConfigs.delete(this.cfgKey(featureId, envId));
  }

  async listFeatureEnvConfigs(featureId?: ID, envId?: ID): Promise<FeatureEnvConfig[]> {
    return Array.from(this.featureEnvConfigs.values()).filter(
      (c) => (featureId ? c.featureId === featureId : true) && (envId ? c.envId === envId : true)
    );
  }
}

export default InMemoryAdapter;
