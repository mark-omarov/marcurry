'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';
import type { Gate } from '@/lib/db/types';

interface GatesEditorProps {
  initialGates: Gate[];
  onChange?: (gates: Gate[]) => void;
}

type GateType = 'everyone' | 'actors';

export function GatesEditor({ initialGates, onChange }: GatesEditorProps) {
  // Determine initial gate type and actors
  const initialAllGate = initialGates.find((g) => g.type === 'all');
  const initialActorsGate = initialGates.find((g) => g.type === 'actors');

  const [gateType, setGateType] = useState<GateType>(
    initialAllGate ? 'everyone' : initialActorsGate ? 'actors' : 'everyone'
  );
  const [actors, setActors] = useState<string[]>(initialActorsGate?.actorIds || []);
  const [newActorInput, setNewActorInput] = useState('');

  // Convert UI state to gates array
  const getGatesFromState = (): Gate[] => {
    if (gateType === 'everyone') {
      return [{ type: 'all', enabled: true }];
    } else {
      return [{ type: 'actors', actorIds: actors }];
    }
  };

  const handleGateTypeChange = (type: GateType) => {
    setGateType(type);
    onChange?.(type === 'everyone' ? [{ type: 'all', enabled: true }] : [{ type: 'actors', actorIds: actors }]);
  };

  const addActor = () => {
    const trimmed = newActorInput.trim();
    if (trimmed && !actors.includes(trimmed)) {
      const newActors = [...actors, trimmed];
      setActors(newActors);
      setNewActorInput('');
      onChange?.([{ type: 'actors', actorIds: newActors }]);
    }
  };

  const removeActor = (actorToRemove: string) => {
    const newActors = actors.filter((a) => a !== actorToRemove);
    setActors(newActors);
    onChange?.([{ type: 'actors', actorIds: newActors }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addActor();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Access Control</Label>
        <p className="text-muted-foreground mt-1 text-xs">Control who can access this feature</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Gate type selector */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleGateTypeChange('everyone')}
              className={`flex w-full items-center justify-between rounded-lg border-2 p-4 transition-colors ${
                gateType === 'everyone'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/25'
              }`}
            >
              <div className="text-left">
                <div className="font-medium">Everyone</div>
                <div className="text-muted-foreground text-xs">All users have access to this feature</div>
              </div>
              <div
                className={`h-4 w-4 rounded-full border-2 ${
                  gateType === 'everyone' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}
              >
                {gateType === 'everyone' && <div className="bg-background h-full w-full scale-50 rounded-full" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleGateTypeChange('actors')}
              className={`flex w-full items-center justify-between rounded-lg border-2 p-4 transition-colors ${
                gateType === 'actors' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/25'
              }`}
            >
              <div className="text-left">
                <div className="font-medium">Specific Actors</div>
                <div className="text-muted-foreground text-xs">Only specified actors have access</div>
              </div>
              <div
                className={`h-4 w-4 rounded-full border-2 ${
                  gateType === 'actors' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}
              >
                {gateType === 'actors' && <div className="bg-background h-full w-full scale-50 rounded-full" />}
              </div>
            </button>
          </div>

          {/* Actors list */}
          {gateType === 'actors' && (
            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter actor ID (e.g., user-123)"
                  value={newActorInput}
                  onChange={(e) => setNewActorInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button type="button" size="sm" onClick={addActor} disabled={!newActorInput.trim()}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>

              {actors.length === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed py-4 text-center text-sm">
                  No actors added yet. Add actor IDs above.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs">
                    {actors.length} actor{actors.length !== 1 ? 's' : ''} with access:
                  </div>
                  <div className="space-y-1">
                    {actors.map((actor) => (
                      <div key={actor} className="bg-muted/30 flex items-center justify-between rounded border p-2">
                        <span className="font-mono text-sm">{actor}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeActor(actor)}
                          className="text-destructive h-7 w-7 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden input to submit gates as JSON */}
      <input type="hidden" name="gates" value={JSON.stringify(getGatesFromState())} />
    </div>
  );
}
