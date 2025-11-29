import { Flag } from 'lucide-react';
import { ProductSelector } from '@/components/product-selector';
import { CreateProductInline } from '@/components/create-product-inline';
import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { CreateFeatureInline } from '@/components/create-feature-inline';
import { FeatureEnvMatrix } from '@/components/feature-env-matrix';

export default async function FeatureFlags({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; envId?: string }>;
}) {
  const params = await searchParams;
  const productId = params.productId;

  const products = await listProducts();

  // Load data depending on scope
  let totalFeaturesCount = 0;
  let scoped: null | {
    environments: Awaited<ReturnType<typeof listEnvironments>>;
    features: Awaited<ReturnType<typeof listFeatures>>;
    cfgsByFeature: Record<string, Awaited<ReturnType<typeof listFeatureEnvConfigs>>>;
  } = null;
  let grouped: null | Array<{
    productId: string;
    productName: string;
    environments: Awaited<ReturnType<typeof listEnvironments>>;
    features: Awaited<ReturnType<typeof listFeatures>>;
    cfgsByFeature: Record<string, Awaited<ReturnType<typeof listFeatureEnvConfigs>>>;
  }> = null;

  if (productId) {
    const [environments, features] = await Promise.all([listEnvironments({ productId }), listFeatures({ productId })]);
    totalFeaturesCount = features.length;
    const cfgsByFeature: Record<string, Awaited<ReturnType<typeof listFeatureEnvConfigs>>> = {};
    for (const f of features) {
      cfgsByFeature[f.id] = await listFeatureEnvConfigs({ featureId: f.id });
    }
    scoped = { environments, features, cfgsByFeature };
  } else {
    grouped = [];
    for (const p of products) {
      const [environments, features] = await Promise.all([
        listEnvironments({ productId: p.id }),
        listFeatures({ productId: p.id }),
      ]);
      totalFeaturesCount += features.length;
      const cfgsByFeature: Record<string, Awaited<ReturnType<typeof listFeatureEnvConfigs>>> = {};
      for (const f of features) {
        cfgsByFeature[f.id] = await listFeatureEnvConfigs({ featureId: f.id });
      }
      grouped.push({ productId: p.id, productName: p.name, environments, features, cfgsByFeature });
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex min-h-12 items-center justify-between">
        <div>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-muted-foreground">Overview of your feature flag management</p>
            {products.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalFeaturesCount} {totalFeaturesCount === 1 ? 'feature' : 'features'}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="bg-muted h-10 w-[200px] animate-pulse rounded" />}>
            <ProductSelector products={products} />
          </Suspense>
          {products.length > 0 ? (
            productId ? (
              <CreateFeatureInline productId={productId} />
            ) : (
              <CreateFeatureInline products={products} />
            )
          ) : (
            <CreateProductInline />
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="border-muted-foreground/25 flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <Flag className="text-muted-foreground/50 mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">No Products Yet</h2>
          <p className="text-muted-foreground mb-4">Get started by creating your first product</p>
          <CreateProductInline />
        </div>
      ) : productId && scoped ? (
        <div className="space-y-6">
          {scoped.features.length === 0 ? (
            <div className="border-muted-foreground/25 flex min-h-[160px] flex-col items-center justify-center rounded-lg border p-8 text-center">
              <h2 className="mb-2 text-xl font-semibold">No features yet</h2>
              <p className="text-muted-foreground">Create a feature to get started.</p>
            </div>
          ) : (
            scoped.features.map((f) => (
              <div key={f.id} className="space-y-2">
                <div>
                  <h2 className="text-xl font-semibold">{f.label}</h2>
                  {f.description ? <p className="text-muted-foreground text-sm">{f.description}</p> : null}
                </div>
                <FeatureEnvMatrix
                  feature={f}
                  environments={scoped.environments}
                  configs={scoped.cfgsByFeature[f.id] ?? []}
                />
              </div>
            ))
          )}
        </div>
      ) : grouped ? (
        <div className="space-y-10">
          {grouped.map((g) => (
            <div key={g.productId} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{g.productName}</h2>
              </div>
              {g.features.length === 0 ? (
                <div className="border-muted-foreground/25 flex min-h-[120px] flex-col items-center justify-center rounded-lg border p-6 text-center">
                  <p className="text-muted-foreground">No features for this product.</p>
                </div>
              ) : (
                g.features.map((f) => (
                  <div key={f.id} className="space-y-2">
                    <div>
                      <h3 className="text-xl font-semibold">{f.label}</h3>
                      {f.description ? <p className="text-muted-foreground text-sm">{f.description}</p> : null}
                    </div>
                    <FeatureEnvMatrix feature={f} environments={g.environments} configs={g.cfgsByFeature[f.id] ?? []} />
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
