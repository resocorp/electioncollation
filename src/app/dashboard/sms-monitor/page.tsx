'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Phone, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SMSLog {
  id: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  message: string;
  status: 'received' | 'sent' | 'failed';
  created_at: string;
  metadata?: {
    request_id?: string;
    event_type?: string;
    goip_line?: string;
    recv_time?: string;
    duration_ms?: number;
    error?: string;
  };
}

export default function SMSMonitorPage() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (phoneFilter) {
        params.set('phone', phoneFilter);
      }

      const response = await fetch(`/api/sms/logs?${params}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [phoneFilter]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, phoneFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getEventTypeBadge = (eventType?: string) => {
    if (!eventType) return null;

    const colors: Record<string, string> = {
      help_request: 'bg-blue-500',
      status_request: 'bg-purple-500',
      result_submission: 'bg-green-500',
      incident_report: 'bg-orange-500',
      unknown_agent: 'bg-red-500',
      validation_failed: 'bg-red-600',
      webhook_error: 'bg-red-700',
      fatal_error: 'bg-red-900',
    };

    return (
      <Badge className={`${colors[eventType] || 'bg-gray-500'} text-white text-xs`}>
        {eventType.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Webhook Monitor</h1>
          <p className="text-gray-500 mt-1">Real-time SMS webhook request monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? 'default' : 'secondary'}>
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Filter by phone number (e.g., 2348066137843)"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="max-w-md"
              />
            </div>
            {phoneFilter && (
              <Button variant="ghost" size="sm" onClick={() => setPhoneFilter('')}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent SMS Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No SMS logs found</p>
                <p className="text-sm mt-2">
                  {phoneFilter ? 'Try a different phone number' : 'Send a test SMS to see logs here'}
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`border rounded-lg p-4 ${
                    log.direction === 'inbound' ? 'bg-blue-50' : 'bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(log.status)}
                        <Badge variant={log.direction === 'inbound' ? 'default' : 'secondary'}>
                          {log.direction.toUpperCase()}
                        </Badge>
                        {log.metadata?.event_type && getEventTypeBadge(log.metadata.event_type)}
                        <span className="text-xs text-gray-500">
                          {log.metadata?.request_id || log.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="font-mono text-sm">{log.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{formatTimestamp(log.created_at)}</span>
                        </div>
                      </div>

                      <div className="bg-white rounded p-3 mb-2">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 mt-1" />
                          <span className="text-sm flex-1 font-medium">{log.message}</span>
                        </div>
                      </div>

                      {log.metadata && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {log.metadata.goip_line && (
                            <div>
                              <span className="text-gray-500">Line:</span>{' '}
                              <span className="font-mono">{log.metadata.goip_line}</span>
                            </div>
                          )}
                          {log.metadata.duration_ms !== undefined && (
                            <div>
                              <span className="text-gray-500">Duration:</span>{' '}
                              <span className="font-mono">{log.metadata.duration_ms}ms</span>
                            </div>
                          )}
                          {log.metadata.recv_time && (
                            <div>
                              <span className="text-gray-500">Recv:</span>{' '}
                              <span className="font-mono">{log.metadata.recv_time}</span>
                            </div>
                          )}
                          {log.metadata.error && (
                            <div className="col-span-2 md:col-span-4">
                              <span className="text-red-500">Error:</span>{' '}
                              <span className="font-mono text-red-600">{log.metadata.error}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold mb-1">✅ Webhook is Working If:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>New logs appear here when SMS is sent</li>
              <li>Request IDs are present (format: REQ-YYYYMMDD-XXXXX)</li>
              <li>Status shows "received" for inbound messages</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1 text-red-600">❌ Webhook NOT Working If:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>No new logs appear when SMS is sent to registered number</li>
              <li>DBL shows received SMS but nothing here</li>
            </ul>
            <p className="text-sm mt-2 text-red-600 font-medium">
              → Check: DBL webhook URL configuration and ngrok tunnel
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">📋 Common Event Types:</h4>
            <div className="flex flex-wrap gap-2">
              {getEventTypeBadge('help_request')}
              {getEventTypeBadge('status_request')}
              {getEventTypeBadge('result_submission')}
              {getEventTypeBadge('unknown_agent')}
              {getEventTypeBadge('validation_failed')}
              {getEventTypeBadge('webhook_error')}
            </div>
          </div>

          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600">
              For detailed troubleshooting, see{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">SMS_WEBHOOK_MONITORING.md</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
