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
          <h1 className="text-3xl font-bold">SMS Simulator</h1>
          <p className="text-gray-500 mt-1">Test SMS functionality without DBL SMS Server</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulator */}
          <Card>
            <CardHeader>
              <CardTitle>Send Test SMS</CardTitle>
              <CardDescription>Simulate incoming SMS from agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Phone Number (Agent)</Label>
                <Input
                  placeholder="2348011111101"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Use a phone number from registered agents</p>
              </div>

              <div>
                <Label>Message</Label>
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

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Quick Messages:</p>
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
              <CardTitle>SMS Format Guide</CardTitle>
              <CardDescription>Valid SMS command formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Submit Results (Full or Partial)</h3>
                <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                  R ADC:450 APC:320 APGA:500 LP:280 PDP:380 YPP:150
                </div>
                <div className="bg-gray-50 p-3 rounded-md font-mono text-sm mt-2">
                  R APC:320 PDP:380
                </div>
                <p className="text-xs text-gray-600">Format: R PARTY:VOTES PARTY:VOTES ... (1+ parties)</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Report Incident</h3>
                <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                  I Vote buying at polling unit
                </div>
                <p className="text-xs text-gray-600">Format: I [description]</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Check Status</h3>
                <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                  STATUS
                </div>
                <p className="text-xs text-gray-600">View your submission status</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Get Help</h3>
                <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                  HELP
                </div>
                <p className="text-xs text-gray-600">Get command instructions</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Confirm Submission</h3>
                <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                  YES or NO
                </div>
                <p className="text-xs text-gray-600">Respond to confirmation prompts</p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold text-sm mb-2">Valid Parties (16 Total):</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Main Parties (Top 6):</p>
                    <div className="flex flex-wrap gap-2">
                      {['ADC', 'APC', 'APGA', 'LP', 'PDP', 'YPP'].map(party => (
                        <span key={party} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                          {party}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Other Parties:</p>
                    <div className="flex flex-wrap gap-2">
                      {['AA', 'ADP', 'AP', 'APM', 'BP', 'NNPP', 'NRM', 'PRP', 'SDP', 'ZLP'].map(party => (
                        <span key={party} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
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
              <CardTitle>SMS Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                    <MessageSquare className="w-4 h-4 mt-1 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{log.message}</p>
                      <p className="text-xs text-gray-500">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Agent Data */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Agent Phone Numbers</CardTitle>
            <CardDescription>Use these numbers for testing (from seed data)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { phone: '2348011111101', name: 'Chukwudi Okafor', lga: 'Aguata' },
                { phone: '2348011111201', name: 'Obiora Udoka', lga: 'Awka North' },
                { phone: '2348011111301', name: 'Nkechi Chukwu', lga: 'Awka South' },
                { phone: '2348011111401', name: 'Chika Onwurah', lga: 'Anambra East' },
              ].map((agent) => (
                <div key={agent.phone} className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium text-sm">{agent.name}</p>
                  <p className="font-mono text-xs text-gray-600">{agent.phone}</p>
                  <p className="text-xs text-gray-500">{agent.lga}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 text-xs"
                    onClick={() => setPhoneNumber(agent.phone)}
                  >
                    Use Number
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
