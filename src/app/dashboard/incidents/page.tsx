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
        return <Badge variant="destructive" className="font-semibold">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-600 hover:bg-orange-700 font-semibold">High</Badge>;
      case 'medium':
        return <Badge variant="warning" className="font-semibold">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary" className="font-semibold">Low</Badge>;
      default:
        return <Badge className="font-semibold">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="success" className="font-semibold">✓ Resolved</Badge>;
      case 'investigating':
        return <Badge variant="warning" className="font-semibold">🔍 Investigating</Badge>;
      case 'reported':
        return <Badge variant="destructive" className="font-semibold">⚠ Reported</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="font-semibold">✕ Closed</Badge>;
      default:
        return <Badge className="font-semibold">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Incident Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and manage electoral incidents</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">All Incidents</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{counts.all}</p>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reported</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{counts.reported}</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Investigating</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{counts.investigating}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{counts.resolved}</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
              Incidents ({incidents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
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
                        <TableRow key={incident.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
