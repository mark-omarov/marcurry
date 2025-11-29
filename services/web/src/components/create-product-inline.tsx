'use client';

import { useState } from 'react';
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
import { createProductWithEnvsAction } from '@/app/actions/productActions';
import { useToast } from '@/components/ui/toast';
import { PlusCircle, Trash2 } from 'lucide-react';

export function CreateProductInline() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const [envRows, setEnvRows] = useState<Array<{ id: string; name: string; description?: string }>>([
    { id: crypto.randomUUID(), name: '', description: '' },
  ]);

  const trimmedNames = envRows.map((r) => r.name.trim()).filter((n) => n.length > 0);
  const hasAtLeastOneEnv = trimmedNames.length > 0;
  const lowerNames = trimmedNames.map((n) => n.toLowerCase());
  const hasDuplicates = new Set(lowerNames).size !== lowerNames.length;
  const canSubmit = hasAtLeastOneEnv && !hasDuplicates && !submitting;

  function addEnvRow() {
    setEnvRows((rows) => [...rows, { id: crypto.randomUUID(), name: '', description: '' }]);
  }

  function updateEnvRow(id: string, patch: Partial<{ name: string; description?: string }>) {
    setEnvRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeEnvRow(id: string) {
    setEnvRows((rows) => rows.filter((r) => r.id !== id));
  }

  async function action(formData: FormData) {
    setSubmitting(true);
    try {
      // Serialize and validate environments (require at least one)
      const envs = envRows
        .map((r) => ({ name: r.name.trim(), description: r.description?.trim() || undefined }))
        .filter((r) => r.name.length > 0);
      const namesLower = envs.map((e) => e.name.toLowerCase());
      const dup = new Set(namesLower).size !== namesLower.length;
      if (envs.length === 0) {
        showToast('Please add at least one environment');
        return;
      }
      if (dup) {
        showToast('Duplicate environment names are not allowed');
        return;
      }
      formData.set('environments', JSON.stringify(envs));
      await createProductWithEnvsAction(formData);
      setOpen(false);
      showToast('Product created successfully');
      setEnvRows([]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form action={action} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Add a new product and define at least one environment</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="My Product" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Optional description" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Environments</Label>
              <Button type="button" size="sm" variant="outline" onClick={addEnvRow}>
                <PlusCircle className="mr-1 h-4 w-4" /> Add Environment
              </Button>
            </div>
            <div className="space-y-2">
              {envRows.map((row) => {
                const isDuplicate =
                  row.name.trim().length > 0 &&
                  lowerNames.filter((n) => n === row.name.trim().toLowerCase()).length > 1;
                return (
                  <div
                    key={row.id}
                    className={`grid gap-3 rounded border p-3 md:grid-cols-[1fr_1fr_auto] ${
                      isDuplicate ? 'border-destructive' : ''
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <Label>Name</Label>
                      <Input
                        placeholder="Production"
                        value={row.name}
                        onChange={(e) => updateEnvRow(row.id, { name: e.target.value })}
                        required={false}
                      />
                      <div className="min-h-[18px]">
                        {isDuplicate ? (
                          <div className="text-destructive text-xs">Duplicate environment name.</div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label>Description</Label>
                      <Input
                        placeholder="Optional"
                        value={row.description ?? ''}
                        onChange={(e) => updateEnvRow(row.id, { description: e.target.value })}
                      />
                      {/* Reserve space for helper/error text to keep row height consistent and avoid jumping */}
                      <div className="min-h-[18px]" />
                    </div>
                    <div className="self-start md:mt-6">
                      <Button type="button" className="h-10" variant="destructive" onClick={() => removeEnvRow(row.id)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!hasAtLeastOneEnv && (
                <div className="text-destructive text-sm">At least one environment is required.</div>
              )}
              {hasDuplicates && <div className="text-destructive text-sm">Environment names must be unique.</div>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              <Sparkles className="mr-1 h-4 w-4" />
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
