'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';

export default function SendTestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSendSMS = async () => {
    if (!phoneNumber || !message) {
      toast({
        title: 'Error',
        description: 'Phone number and message are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      setResult(data);
      toast({
        title: 'SMS Sent',
        description: `Task ID: ${data.taskID || 'N/A'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send SMS',
        variant: 'destructive',
      });
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const quickMessages = [
    { label: 'result', text: 'R APGA:450 APC:320 PDP:280 LP:150' },
    { label: 'incident', text: 'I Vote buying at polling unit' },
    { label: 'status', text: 'STATUS' },
    { label: 'help', text: 'HELP' },
    { label: 'yes', text: 'YES' },
    { label: 'no', text: 'NO' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Send Test SMS</h1>
          <p className="text-gray-500 mt-1">Simulate sending SMS [Deep Sentinel]</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send SMS Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Test SMS</CardTitle>
              <CardDescription>Use phone number from registered agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number (Agent)</Label>
                <Input
                  id="phone"
                  placeholder="2348011111101"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="R APGA:450 APC:320 PDP:280 LP:150"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSendSMS} 
                disabled={loading} 
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send SMS
                  </>
                )}
              </Button>

              {result && (
                <div className={`p-4 rounded-md ${result.error ? 'bg-red-50' : 'bg-green-50'}`}>
                  <h4 className={`font-semibold mb-2 ${result.error ? 'text-red-800' : 'text-green-800'}`}>
                    {result.error ? 'Error' : 'SMS Sent'}
                  </h4>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Quick Messages:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickMessages.map((msg) => (
                    <Button
                      key={msg.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage(msg.text)}
                    >
                      {msg.label}
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
                <h3 className="font-semibold text-sm">Submit Results</h3>
                <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                  R APGA:450 APC:320 PDP:280 LP:150
                </div>
                <p className="text-xs text-gray-600">Format: R PARTY:VOTES PARTY:VOTES ...</p>
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

              <div className="pt-4 border-t">
                <h3 className="font-semibold text-sm mb-2">Valid Parties:</h3>
                <div className="flex flex-wrap gap-2">
                  {['APGA', 'APC', 'PDP', 'LP', 'NNPP', 'ADC', 'YPP', 'SDP'].map(party => (
                    <span key={party} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {party}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
