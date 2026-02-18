import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/context/settings-context';
import { api } from '@/lib/api';

export function SettingsPage() {
  const { username, setUsername } = useSettings();
  const [draftUsername, setDraftUsername] = useState(username);
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['sync-status', username],
    queryFn: () => api.syncStatus(username || undefined)
  });

  const syncMutation = useMutation({
    mutationFn: () => api.sync({ username: draftUsername.trim() || username || undefined }),
    onSuccess: () => {
      toast.success('Sync completed');
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <h2 className="sr-only">Settings sections</h2>
        <p className="text-sm text-muted-foreground">
          Configurer le username et lancer la première sync.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chess.com username</CardTitle>
          <CardDescription>
            Si vide, le backend utilise <code>CHESSCOM_USERNAME</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={draftUsername}
              onChange={(event) => setDraftUsername(event.target.value)}
              placeholder="BigZoo92"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setUsername(draftUsername);
                toast.success('Username saved');
              }}
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? 'Syncing...' : 'Sync now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {statusQuery.isLoading ? (
            <p className="text-muted-foreground">Loading status...</p>
          ) : statusQuery.isError ? (
            <p className="text-rose-300">{statusQuery.error.message}</p>
          ) : (
            <div className="space-y-2">
              <p>
                <strong>Username:</strong> {statusQuery.data?.username || '-'}
              </p>
              <p>
                <strong>Last sync:</strong> {statusQuery.data?.lastSyncAt || '-'}
              </p>
              <p>
                <strong>Total games:</strong> {statusQuery.data?.totals.games || 0}
              </p>
              <p>
                <strong>isSyncing:</strong> {String(statusQuery.data?.isSyncing || false)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
