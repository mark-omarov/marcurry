import type { Environment, Feature, FeatureEnvConfig, FeatureFlag, ID, Product } from './types';

export interface StorageAdapter {
  createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
  getProduct(id: ID): Promise<Product | null>;
  updateProduct(id: ID, patch: Partial<Omit<Product, 'id' | 'name' | 'createdAt'>>): Promise<Product>;
  deleteProduct(id: ID): Promise<void>;
  listProducts(): Promise<Product[]>;

  createEnvironment(env: Omit<Environment, 'id' | 'createdAt'>): Promise<Environment>;
  getEnvironment(id: ID): Promise<Environment | null>;
  updateEnvironment(id: ID, patch: Partial<Omit<Environment, 'id' | 'name' | 'createdAt'>>): Promise<Environment>;
  deleteEnvironment(id: ID): Promise<void>;
  listEnvironments(productId?: ID): Promise<Environment[]>;

  getEnabledFlagsForActor(productId: ID, envId: ID, actorId: string): Promise<FeatureFlag[]>;

  createFeature(feature: Omit<Feature, 'id' | 'createdAt'>): Promise<Feature>;
  getFeature(id: ID): Promise<Feature | null>;
  updateFeature(id: ID, patch: Partial<Omit<Feature, 'id' | 'productId' | 'createdAt'>>): Promise<Feature>;
  deleteFeature(id: ID): Promise<void>;
  listFeatures(productId?: ID): Promise<Feature[]>;

  upsertFeatureEnvConfig(config: FeatureEnvConfig): Promise<FeatureEnvConfig>;
  getFeatureEnvConfig(featureId: ID, envId: ID): Promise<FeatureEnvConfig | null>;
  deleteFeatureEnvConfig(featureId: ID, envId: ID): Promise<void>;
  listFeatureEnvConfigs(featureId?: ID, envId?: ID): Promise<FeatureEnvConfig[]>;
}
