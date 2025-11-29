export type ID = string;

export interface Product {
  id: ID;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Environment {
  id: ID;
  productId: ID;
  name: string;
  description?: string;
  createdAt: string;
}

export type Gate = GateAll | GateActors;

export interface GateAll {
  type: 'all';
  enabled: boolean;
}

export interface GateActors {
  type: 'actors';
  actorIds: string[];
}

export interface Feature {
  id: ID;
  productId: ID;
  label: string;
  description?: string;
  createdAt: string;
}

export interface FeatureEnvConfig {
  featureId: ID;
  envId: ID;
  enabled: boolean;
  gates: Gate[];
}

export interface FeatureFlag {
  id: ID;
  productId: ID;
  envId: ID;
  label: string;
  description?: string;
  enabled: boolean;
  gates: Gate[];
  createdAt: string;
}
