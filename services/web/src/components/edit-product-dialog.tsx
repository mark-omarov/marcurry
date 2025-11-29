'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { updateProductAction } from '@/app/actions/productActions';
import {
  createEnvironmentAction,
  deleteEnvironmentAction,
  updateEnvironmentAction,
  listEnvironmentsAction,
} from '@/app/actions/environmentActions';

export function EditProductDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [envs, setEnvs] = useState<Environment[] | null>(null);
  const [loadingEnvs, setLoadingEnvs] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoadingEnvs(true);
      try {
        const data = await listEnvironmentsAction(product.id);
        if (!cancelled) setEnvs(data);
      } catch (e) {
        showToast('Failed to load environments', 'error');
      } finally {
        if (!cancelled) setLoadingEnvs(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, product.id, showToast]);

  async function saveProduct(formData: FormData) {
    setSaving(true);
    try {
      await updateProductAction(formData);
      showToast('Product updated');
    } finally {
      setSaving(false);
    }
  }

  async function addEnv(ev: FormData) {
    setSaving(true);
    try {
      await createEnvironmentAction(ev);
      // refresh envs
      const data = await listEnvironmentsAction(product.id);
      setEnvs(data);
      showToast('Environment added');
    } finally {
      setSaving(false);
    }
  }

  async function updateEnv(ev: FormData) {
    setSaving(true);
    try {
      await updateEnvironmentAction(ev);
      const data = await listEnvironmentsAction(product.id);
      setEnvs(data);
      showToast('Environment updated');
    } finally {
      setSaving(false);
    }
  }

  async function removeEnv(id: string) {
    setSaving(true);
    try {
      await deleteEnvironmentAction(id);
      const data = await listEnvironmentsAction(product.id);
      setEnvs(data);
      showToast('Environment removed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="mr-1 h-4 w-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product info and manage environments</DialogDescription>
        </DialogHeader>

        {/* Product info */}
        <form action={saveProduct} className="space-y-3">
          <input type="hidden" name="id" value={product.id} />
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={product.name} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={product.description ?? ''} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>

        {/* Environments manager */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Environments</div>
              <div className="text-muted-foreground text-xs">Add or edit environments for this product</div>
            </div>
          </div>

          {/* Add environment */}
          <form action={addEnv} className="grid gap-3 rounded border p-3 md:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="productId" value={product.id} />
            <div className="flex-1 space-y-1">
              <Label htmlFor="new-env-name">Name</Label>
              <Input id="new-env-name" name="name" placeholder="Prod / Staging / Dev" required />
              {/* Reserve space for helper/error text to keep row height stable */}
              <div className="min-h-[18px]" />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="new-env-desc">Description</Label>
              <Input id="new-env-desc" name="description" placeholder="Optional" />
              {/* Reserve space for helper/error text to keep row height stable */}
              <div className="min-h-[18px]" />
            </div>
            <div className="self-start md:mt-6">
              <Button type="submit" className="h-10" disabled={saving}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </form>

          {/* Existing envs */}
          <div className="space-y-2">
            {loadingEnvs && <div className="text-muted-foreground text-sm">Loading environments…</div>}
            {!loadingEnvs && (envs?.length ?? 0) === 0 && (
              <div className="text-muted-foreground text-sm">No environments yet.</div>
            )}
            {envs?.map((e) => (
              <div key={e.id} className="grid gap-3 rounded border p-3 md:grid-cols-[1fr_auto]">
                <form action={updateEnv} className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="id" value={e.id} />
                  <div className="flex-1 space-y-1">
                    <Label>Name</Label>
                    <Input value={e.name} disabled readOnly />
                    {/* Reserve space for helper/error text to keep row height stable */}
                    <div className="min-h-[18px]" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label>Description</Label>
                    <Input name="description" defaultValue={e.description ?? ''} />
                    {/* Reserve space for helper/error text to keep row height stable */}
                    <div className="min-h-[18px]" />
                  </div>
                  <div className="self-start md:mt-6">
                    <Button type="submit" className="h-10" variant="outline" disabled={saving}>
                      Save
                    </Button>
                  </div>
                </form>
                <form
                  action={async () => {
                    await removeEnv(e.id);
                  }}
                  className="self-start md:mt-6"
                >
                  <Button type="submit" className="h-10" variant="destructive" disabled={saving}>
                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            <X className="mr-1 h-4 w-4" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
