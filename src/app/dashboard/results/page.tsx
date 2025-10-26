'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, Search, Phone, Mail, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
}

interface Result {
  id: string;
  reference_id: string;
  party_votes: Record<string, number>;
  total_votes: number;
  submitted_at: string;
  agent: Agent | null;
}

interface PollingUnit {
  id: string;
  polling_unit_code: string;
  polling_unit_name: string;
  ward: string;
  lga: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  registered_voters: number;
  result: Result | null;
}

export default function ResultsPage() {
  const [pollingUnits, setPollingUnits] = useState<PollingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lgaFilter, setLgaFilter] = useState<string>('');
  const [wardFilter, setWardFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('polling_unit_code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [lgas, setLgas] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchLGAs();
  }, []);

  useEffect(() => {
    if (lgaFilter) {
      fetchWards(lgaFilter);
    } else {
      setWards([]);
      setWardFilter('');
    }
  }, [lgaFilter]);

  useEffect(() => {
    fetchPollingUnits();
  }, [searchTerm, lgaFilter, wardFilter, sortBy, sortOrder]);

  const fetchLGAs = async () => {
    try {
      const response = await fetch('/api/polling-units?type=lgas&state=Anambra');
      const data = await response.json();
      setLgas(data.lgas || []);
    } catch (error) {
      console.error('Error fetching LGAs:', error);
    }
  };

  const fetchWards = async (lga: string) => {
    try {
      const response = await fetch(`/api/polling-units?type=wards&state=Anambra&lga=${encodeURIComponent(lga)}`);
      const data = await response.json();
      setWards(data.wards || []);
    } catch (error) {
      console.error('Error fetching wards:', error);
    }
  };

  const fetchPollingUnits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (lgaFilter) params.append('lga', lgaFilter);
      if (wardFilter) params.append('ward', wardFilter);
      if (searchTerm) params.append('search', searchTerm);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('limit', '1000');
      
      const response = await fetch(`/api/polling-units/results?${params}`);
      const data = await response.json();
      setPollingUnits(data.polling_units || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching polling units:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch polling units',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLgaFilter('');
    setWardFilter('');
    setSortBy('polling_unit_code');
    setSortOrder('asc');
  };

  const getResultStatus = (pu: PollingUnit) => {
    if (pu.result) {
      return <Badge className="bg-green-600">Submitted</Badge>;
    }
    return <Badge variant="outline" className="text-gray-500">Pending</Badge>;
  };

  const resultsSubmitted = pollingUnits.filter(pu => pu.result !== null).length;
  const resultsPending = pollingUnits.filter(pu => pu.result === null).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Election Results</h1>
          <p className="text-gray-500 mt-1">View all polling units and their submitted results</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Total Polling Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Results Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resultsSubmitted.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{resultsPending.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Submission Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {total > 0 ? ((resultsSubmitted / total) * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search PU code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={lgaFilter} onValueChange={setLgaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by LGA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All LGAs</SelectItem>
                  {lgas.map((lga) => (
                    <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={wardFilter} onValueChange={setWardFilter} disabled={!lgaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {wards.map((ward) => (
                    <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Polling Units ({pollingUnits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading polling units...</p>
            ) : pollingUnits.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No polling units found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('polling_unit_code')} className="-ml-3">
                          PU Code
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('polling_unit_name')} className="-ml-3">
                          Polling Unit Name
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('ward')} className="-ml-3">
                          Ward
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('lga')} className="-ml-3">
                          LGA
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Agent Contact</TableHead>
                      <TableHead>Party Votes</TableHead>
                      <TableHead>Total Votes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pollingUnits.map((pu) => (
                      <TableRow key={pu.id}>
                        <TableCell className="font-mono text-sm font-medium">{pu.polling_unit_code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pu.polling_unit_name}</p>
                            {pu.latitude && pu.longitude && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {pu.latitude.toFixed(6)}, {pu.longitude.toFixed(6)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{pu.ward}</TableCell>
                        <TableCell>{pu.lga}</TableCell>
                        <TableCell>
                          {pu.result?.agent ? (
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{pu.result.agent.name}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="h-3 w-3" />
                                <span>{pu.result.agent.phone_number}</span>
                              </div>
                              {pu.result.agent.email && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Mail className="h-3 w-3" />
                                  <span>{pu.result.agent.email}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No agent assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {pu.result ? (
                            <div className="text-sm space-y-1 min-w-[150px]">
                              {Object.entries(pu.result.party_votes).map(([party, votes]) => (
                                <div key={party} className="flex justify-between gap-4">
                                  <span className="font-semibold">{party}:</span>
                                  <span>{votes}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {pu.result ? (
                            <span className="font-bold">{pu.result.total_votes}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getResultStatus(pu)}</TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {pu.result ? formatDate(pu.result.submitted_at) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
