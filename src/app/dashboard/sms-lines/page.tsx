'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Wifi, WifiOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LineStatus {
  lineId: string;
  online: boolean;
  registered: boolean;
  registrationStatus: string;
  remainingSMS: string;
  dailyRemaining: string;
  status: 'active' | 'online_not_registered' | 'offline';
}

interface LineStatusSummary {
  total: number;
  active: number;
  online: number;
  offline: number;
  notRegistered: number;
}

export default function SMSLinesPage() {
  const [lines, setLines] = useState<LineStatus[]>([]);
  const [summary, setSummary] = useState<LineStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchLineStatus = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/sms/dbl/line-status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch line status');
      }

      const data = await response.json();
      setLines(data.lines || []);
      setSummary(data.summary || null);

      if (isRefresh) {
        toast({
          title: 'Refreshed',
          description: 'Line status updated successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch line status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLineStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLineStatus(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'online_not_registered':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><AlertCircle className="w-3 h-3 mr-1" />Not Registered</Badge>;
      case 'offline':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Offline</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">SMS Line Status</h1>
            <p className="text-gray-500 mt-1">Monitor DBL SMS Server and GoIP lines</p>
          </div>
          <Button 
            onClick={() => fetchLineStatus(true)} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Lines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.active}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Online</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{summary.online}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Offline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.offline}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Not Registered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{summary.notRegistered}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Line Status Grid */}
        {lines.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">
                No GoIP lines found. Check DBL SMS Server connection.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Ensure DBL_SMS_SERVER_IP is configured in environment variables.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lines.map((line) => (
              <Card key={line.lineId} className={line.status === 'active' ? 'border-green-200' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{line.lineId}</CardTitle>
                    {getStatusBadge(line.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Connection Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Connection:</span>
                    <div className="flex items-center gap-1">
                      {line.online ? (
                        <>
                          <Wifi className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600">Online</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600">Offline</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Registration Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">SIM Status:</span>
                    <span className={`text-sm font-medium ${
                      line.registered ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {line.registrationStatus || 'LOGOUT'}
                    </span>
                  </div>

                  {/* Remaining SMS */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Remaining SMS:</span>
                    <span className="text-sm font-medium">
                      {line.remainingSMS}
                    </span>
                  </div>

                  {/* Daily Remaining */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Daily Remaining:</span>
                    <span className="text-sm font-medium">
                      {line.dailyRemaining}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>About SMS Line Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-gray-600">Line is online and SIM is registered to network. Ready to send/receive SMS.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">Not Registered</p>
                <p className="text-sm text-gray-600">Line is online but SIM is not registered to cellular network. Check SIM card.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium">Offline</p>
                <p className="text-sm text-gray-600">GoIP device is not connected to DBL SMS Server. Check device power and network.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
