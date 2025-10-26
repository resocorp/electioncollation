'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare } from 'lucide-react';

export default function SMSSimulatorPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<Array<{ type: 'sent' | 'received'; message: string; time: string }>>([]);
  const { toast } = useToast();

  const sendSMS = async () => {
    if (!phoneNumber || !message) {
      toast({
        title: 'Error',
        description: 'Phone number and message are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate DBL SMS Server webhook format
      const requestBody = {
        goip_line: 'G101',
        from_number: phoneNumber,
        content: message,
        recv_time: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      const response = await fetch('/api/sms/goip/incoming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // Add to logs
      setLogs([
        { type: 'sent', message: `${phoneNumber}: ${message}`, time: new Date().toLocaleTimeString() },
        ...logs
      ]);

      toast({
        title: 'SMS Sent',
        description: `Status: ${data.status}`,
      });

      // Clear message
      setMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send SMS',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickMessages = {
    result: 'R ADC:450 APC:320 APGA:500 LP:280 PDP:380 YPP:150',
    partialResult: 'R APC:320 PDP:380',
    allParties: 'R ADC:100 APC:200 APGA:300 LP:150 PDP:250 YPP:80 AA:20 ADP:15 AP:10 APM:5 BP:3 NNPP:25 NRM:8 PRP:12 SDP:18 ZLP:7',
    incident: 'I Vote buying observed at polling unit entrance',
    status: 'STATUS',
    help: 'HELP',
    yes: 'YES',
    no: 'NO'
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">SMS Simulator</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Test SMS functionality without DBL SMS Server</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Send Test SMS</CardTitle>
              <CardDescription>Simulate incoming SMS from agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-900 dark:text-gray-100">Phone Number (Agent)</Label>
                <Input
                  placeholder="2348011111101"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use a phone number from registered agents</p>
              </div>

              <div>
                <Label className="text-gray-900 dark:text-gray-100">Message</Label>
                <Input
                  placeholder="R ADC:450 APC:320 APGA:500 LP:280 PDP:380 YPP:150"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <Button onClick={sendSMS} disabled={loading} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Sending...' : 'Send SMS'}
              </Button>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Quick Messages:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(quickMessages).map(([key, msg]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage(msg)}
                    >
                      {key}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS Format Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">SMS Format Guide</CardTitle>
              <CardDescription>Valid SMS command formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Submit Results (Full or Partial)</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md font-mono text-sm text-gray-900 dark:text-gray-100">
                  R ADC:450 APC:320 APGA:500 LP:280 PDP:380 YPP:150
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md font-mono text-sm text-gray-900 dark:text-gray-100 mt-2">
                  R APC:320 PDP:380
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Format: R PARTY:VOTES PARTY:VOTES ... (1+ parties)</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Report Incident</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md font-mono text-sm text-gray-900 dark:text-gray-100">
                  I Vote buying at polling unit
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Format: I [description]</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Check Status</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md font-mono text-sm text-gray-900 dark:text-gray-100">
                  STATUS
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">View your submission status</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Get Help</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md font-mono text-sm text-gray-900 dark:text-gray-100">
                  HELP
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Get command instructions</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Confirm Submission</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md font-mono text-sm text-gray-900 dark:text-gray-100">
                  YES or NO
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Respond to confirmation prompts</p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">Valid Parties (16 Total):</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Main Parties (Top 6):</p>
                    <div className="flex flex-wrap gap-2">
                      {['ADC', 'APC', 'APGA', 'LP', 'PDP', 'YPP'].map(party => (
                        <span key={party} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded font-semibold">
                          {party}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Other Parties:</p>
                    <div className="flex flex-wrap gap-2">
                      {['AA', 'ADP', 'AP', 'APM', 'BP', 'NNPP', 'NRM', 'PRP', 'SDP', 'ZLP'].map(party => (
                        <span key={party} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                          {party}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SMS Logs */}
        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">SMS Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                    <MessageSquare className="w-4 h-4 mt-1 text-gray-400 dark:text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}
