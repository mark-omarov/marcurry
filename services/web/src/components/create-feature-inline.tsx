'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Sparkles } from 'lucide-react';
import { createFeature } from '@/app/actions/featureActions';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CreateFeatureInline(props: { productId?: string; envId?: string; products?: Product[] }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const canPickProduct = !props.productId;
  const productOptions = useMemo(() => props.products ?? [], [props.products]);

  async function action(formData: FormData) {
    setSubmitting(true);
    try {
      if (!props.productId) {
        // ensure productId is present when creating from All Products
        const pid = selectedProductId || (productOptions[0]?.id ?? '');
        if (!pid) throw new Error('Please select a product');
        formData.set('productId', pid);
      }
      await createFeature(formData);
      setOpen(false);
      showToast('Feature created successfully');
      const pid = props.productId || selectedProductId;
      if (pid) router.push(`/?productId=${pid}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Feature
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} className="space-y-4">
          {props.productId ? <input type="hidden" name="productId" value={props.productId} /> : null}
          <DialogHeader>
            <DialogTitle>Create Feature</DialogTitle>
            <DialogDescription>Create a new product-scoped feature</DialogDescription>
          </DialogHeader>

          {canPickProduct && (
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger id="productId" className="w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input id="label" name="label" placeholder="My Feature" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Optional description" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              <Sparkles className="mr-1 h-4 w-4" />
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
