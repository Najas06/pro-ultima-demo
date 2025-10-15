'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function DiagnosticsPage() {
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const supabase = createClient();

  useEffect(() => {
    const channels = [
      'maintenance-requests-realtime',
      'tasks-realtime',
      'staff-realtime',
      'teams-realtime',
      'team-members-realtime',
      'task-proofs-realtime',
      'cash-transactions-realtime',
    ];

    // Subscribe to all channels
    channels.forEach(channelName => {
      const channel = supabase
        .channel(channelName)
        .subscribe((status) => {
          setConnections(prev => ({ ...prev, [channelName]: status }));
          setLastUpdate(new Date());
        });
    });

    // Cleanup on unmount
    return () => {
      channels.forEach(name => {
        const channel = supabase.channel(name);
        supabase.removeChannel(channel);
      });
    };
  }, [supabase]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBSCRIBED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'CHANNEL_ERROR':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusVariant = (status: string): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'SUBSCRIBED':
        return 'default';
      case 'CHANNEL_ERROR':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const allConnected = Object.values(connections).every(status => status === 'SUBSCRIBED');
  const anyErrors = Object.values(connections).some(status => status === 'CHANNEL_ERROR');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Real-time Diagnostics</h1>
        <p className="text-muted-foreground">
          Monitor WebSocket connections and real-time synchronization status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {allConnected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">All Connected</span>
                </>
              ) : anyErrors ? (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">Errors Detected</span>
                </>
              ) : (
                <>
                  <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                  <span className="text-2xl font-bold text-yellow-500">Connecting...</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {Object.keys(connections).length}
              </span>
              <span className="text-muted-foreground">of {Object.keys(connections).length} channels</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {lastUpdate.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Details */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Status</CardTitle>
          <CardDescription>
            Real-time WebSocket connections for all database tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(connections).map(([channel, status]) => (
              <div
                key={channel}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <div>
                    <div className="font-medium">{channel}</div>
                    <div className="text-sm text-muted-foreground">
                      {status === 'SUBSCRIBED' && 'Connected and listening for changes'}
                      {status === 'CHANNEL_ERROR' && 'Connection failed - check console for errors'}
                      {status === 'TIMED_OUT' && 'Connection timed out'}
                      {status === 'CLOSED' && 'Connection closed'}
                      {!status && 'Initializing...'}
                    </div>
                  </div>
                </div>
                <Badge variant={getStatusVariant(status)}>
                  {status || 'PENDING'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Tips */}
      {anyErrors && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">⚠️ Connection Issues Detected</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-700 dark:text-red-400 space-y-2">
            <p>Some channels failed to connect. Please try the following:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Check your internet connection</li>
              <li>Verify Supabase Realtime is enabled in your project settings</li>
              <li>Ensure all tables are published for Realtime (run VERIFY_REALTIME_PUBLICATIONS.sql)</li>
              <li>Check browser console (F12) for detailed error messages</li>
              <li>Refresh the page to retry connections</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {allConnected && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">✅ All Systems Operational</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-700 dark:text-green-400">
            <p>All real-time channels are connected and working properly. Your application is fully synchronized across all tabs and browsers.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




