'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchIncidents(activeTab);
  }, [activeTab]);

  const fetchIncidents = async (status: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.append('status', status);
      params.append('limit', '100');
      
      const response = await fetch(`/api/incidents?${params}`);
      const data = await response.json();
      setIncidents(data.incidents || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (incidentId: string, newStatus: string) => {
    let notes = '';
    if (newStatus === 'resolved' || newStatus === 'closed') {
      notes = prompt('Enter resolution notes:') || '';
      if (!notes) return;
    }

    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolution_notes: notes || undefined
        }),
      });

      if (response.ok) {
        toast({
          title: 'Incident updated',
          description: 'The incident status has been updated.',
        });
        fetchIncidents(activeTab);
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to update incident',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'investigating':
        return <Badge variant="warning">Investigating</Badge>;
      case 'reported':
        return <Badge variant="destructive">Reported</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Incident Reports</h1>
          <p className="text-gray-500 mt-1">Monitor and manage electoral incidents</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Incidents</TabsTrigger>
            <TabsTrigger value="reported">
              Reported <Badge variant="outline" className="ml-2">{incidents.filter(i => i.status === 'reported').length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="investigating">Investigating</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Incidents ({incidents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Loading incidents...</p>
                ) : incidents.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No incidents found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ref ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidents.map((incident) => (
                        <TableRow key={incident.id}>
                          <TableCell className="font-mono text-xs">{incident.reference_id}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{incident.incident_type.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm truncate">{incident.description}</p>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{incident.polling_unit_code}</p>
                              <p className="text-gray-500">{incident.ward}, {incident.lga}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{incident.agents?.name}</p>
                              <p className="text-gray-500">{incident.agents?.phone_number}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                          <TableCell>{getStatusBadge(incident.status)}</TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {formatDate(incident.reported_at)}
                          </TableCell>
                          <TableCell>
                            <Select
                              defaultValue={incident.status}
                              onValueChange={(value) => handleStatusUpdate(incident.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reported">Reported</SelectItem>
                                <SelectItem value="investigating">Investigating</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            {incident.resolution_notes && (
                              <p className="text-xs text-gray-600 mt-1">Notes: {incident.resolution_notes}</p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
