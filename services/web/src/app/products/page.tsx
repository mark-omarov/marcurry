import { ProductsTable, type ProductRow } from '@/components/products-table';
import { CreateProductInline } from '@/components/create-product-inline';
import { EditProductDialog } from '@/components/edit-product-dialog';

export default async function ProductsPage() {
  const products = await listProducts();

  const rows: ProductRow[] = await Promise.all(
    products.map(async (product) => {
      const [envs, feats] = await Promise.all([
        listEnvironments({ productId: product.id }),
        listFeatures({ productId: product.id }),
      ]);
      return {
        product,
        envCount: envs.length,
        featureCount: feats.length,
      } satisfies ProductRow;
    })
  );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex min-h-12 items-center justify-between">
        <div>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-muted-foreground">Manage your products</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <CreateProductInline />
        </div>
      </div>

      <ProductsTable items={rows} actions={(row) => <EditProductDialog product={row.product} />} />
    </div>
  );
}
