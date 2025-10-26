'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [allIncidents, setAllIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      // Fetch all incidents
      const response = await fetch(`/api/incidents?limit=1000`);
      const data = await response.json();
      const allIncidentsData = data.incidents || [];
      setAllIncidents(allIncidentsData);
      setIncidents(allIncidentsData);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCounts = () => {
    return {
      all: allIncidents.length,
      reported: allIncidents.filter(i => i.status === 'reported').length,
      investigating: allIncidents.filter(i => i.status === 'investigating').length,
      resolved: allIncidents.filter(i => i.status === 'resolved').length,
    };
  };

  const counts = getCounts();

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
        fetchIncidents();
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
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">All Incidents:</span>
              <Badge variant="secondary" className="text-base px-3 py-1">{counts.all}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Reported:</span>
              <Badge variant="destructive" className="text-base px-3 py-1">{counts.reported}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Investigating:</span>
              <Badge variant="warning" className="text-base px-3 py-1">{counts.investigating}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Resolved:</span>
              <Badge variant="success" className="text-base px-3 py-1">{counts.resolved}</Badge>
            </div>
          </div>
        </div>

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
                          <TableCell>
                            <span className={`font-mono text-sm font-semibold ${
                              incident.reference_id.includes('-') 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-500 text-xs'
                            }`}>
                              {incident.reference_id}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-base font-medium">{incident.description}</p>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{incident.polling_unit_code}</p>
                              <p className="text-gray-500">{incident.ward}, {incident.lga}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{incident.agents?.name}</p>
                              <p className="text-base font-semibold text-gray-700">{incident.agents?.phone_number}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                          <TableCell>{getStatusBadge(incident.status)}</TableCell>
                          <TableCell className="text-sm font-medium text-gray-700">
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
      </div>
    </DashboardLayout>
  );
}
