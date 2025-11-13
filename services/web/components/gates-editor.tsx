'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';
import type { Gate } from '@/lib/adapters/types';

interface GatesEditorProps {
  initialGates: Gate[];
  onChange?: (gates: Gate[]) => void;
}

type GateType = 'everyone' | 'actors';

export function GatesEditor({ initialGates, onChange }: GatesEditorProps) {
  // Determine initial gate type and actors
  const initialAllGate = initialGates.find(g => g.type === 'all');
  const initialActorsGate = initialGates.find(g => g.type === 'actors');

  const [gateType, setGateType] = useState<GateType>(
    initialAllGate ? 'everyone' : initialActorsGate ? 'actors' : 'everyone'
  );
  const [actors, setActors] = useState<string[]>(
    initialActorsGate?.actorIds || []
  );
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
    const newActors = actors.filter(a => a !== actorToRemove);
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
        <p className="text-xs text-muted-foreground mt-1">
          Control who can access this feature
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Gate type selector */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleGateTypeChange('everyone')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                gateType === 'everyone'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/25'
              }`}
            >
              <div className="text-left">
                <div className="font-medium">Everyone</div>
                <div className="text-xs text-muted-foreground">All users have access to this feature</div>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 ${
                gateType === 'everyone'
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              }`}>
                {gateType === 'everyone' && (
                  <div className="h-full w-full rounded-full bg-background scale-50" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleGateTypeChange('actors')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                gateType === 'actors'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/25'
              }`}
            >
              <div className="text-left">
                <div className="font-medium">Specific Actors</div>
                <div className="text-xs text-muted-foreground">Only specified actors have access</div>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 ${
                gateType === 'actors'
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              }`}>
                {gateType === 'actors' && (
                  <div className="h-full w-full rounded-full bg-background scale-50" />
                )}
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
                <Button
                  type="button"
                  size="sm"
                  onClick={addActor}
                  disabled={!newActorInput.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {actors.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg border-dashed">
                  No actors added yet. Add actor IDs above.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {actors.length} actor{actors.length !== 1 ? 's' : ''} with access:
                  </div>
                  <div className="space-y-1">
                    {actors.map((actor) => (
                      <div
                        key={actor}
                        className="flex items-center justify-between p-2 rounded border bg-muted/30"
                      >
                        <span className="text-sm font-mono">{actor}</span>
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
