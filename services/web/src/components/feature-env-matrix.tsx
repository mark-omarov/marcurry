'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GatesEditor } from '@/components/gates-editor';
import { upsertFeatureEnv } from '@/app/actions/featureActions';

type Props = {
  feature: Feature;
  environments: Environment[];
  configs: FeatureEnvConfig[];
};

export function FeatureEnvMatrix({ feature, environments, configs }: Props) {
  const configMap = useMemo(() => new Map(configs.map((c) => [c.envId, c])), [configs]);

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Environment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gates</TableHead>
              <TableHead className="w-[1%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {environments.map((env) => (
              <EnvRow
                key={env.id}
                featureId={feature.id}
                envId={env.id}
                initialEnabled={configMap.get(env.id)?.enabled ?? false}
                initialGates={configMap.get(env.id)?.gates ?? []}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EnvRow({
  featureId,
  envId,
  initialEnabled,
  initialGates,
}: {
  featureId: string;
  envId: string;
  initialEnabled: boolean;
  initialGates: Gate[];
}) {
  const [enabled, setEnabled] = useState<boolean>(initialEnabled);
  const [open, setOpen] = useState(false);
  const [gates, setGates] = useState<Gate[]>(initialGates);
  const [saving, setSaving] = useState(false);

  async function toggleEnabled(next: boolean) {
    setEnabled(next);
    setSaving(true);
    const fd = new FormData();
    fd.set('featureId', featureId);
    fd.set('envId', envId);
    fd.set('enabled', next ? 'on' : 'off');
    // Preserve existing gates when toggling
    fd.set('gates', JSON.stringify(gates ?? []));
    try {
      await upsertFeatureEnv(fd);
    } finally {
      setSaving(false);
    }
  }

  async function saveGates() {
    setSaving(true);
    const fd = new FormData();
    fd.set('featureId', featureId);
    fd.set('envId', envId);
    fd.set('enabled', 'on');
    fd.set('gates', JSON.stringify(gates ?? []));
    try {
      await upsertFeatureEnv(fd);
      setEnabled(true);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const gatesSummary = gates?.length
    ? gates
        .map((g) => (g.type === 'all' ? (g.enabled ? 'everyone' : 'nobody') : `${(g.actorIds || []).length} actors`))
        .join(', ')
    : 'none';

  return (
    <TableRow>
      <TableCell className="font-mono">{envId}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={toggleEnabled} disabled={saving} />
          <Badge variant={enabled ? 'default' : 'secondary'}>{enabled ? 'On' : 'Off'}</Badge>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{gatesSummary}</TableCell>
      <TableCell className="text-right">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              Configure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure gates</DialogTitle>
            </DialogHeader>
            <GatesEditor initialGates={gates} onChange={setGates} />
            <DialogFooter>
              <Button onClick={() => setOpen(false)} variant="ghost" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveGates} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}
