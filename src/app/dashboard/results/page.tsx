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
import { ArrowUpDown, Search, Phone, Mail, MapPin, RefreshCw } from 'lucide-react';
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
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
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
    // Only fetch on initial load and auto-refresh
    // Don't fetch when filters change - user must click Search button
    fetchPollingUnits();
    // Auto-refresh every 5 minutes for live updates
    const interval = setInterval(fetchPollingUnits, 300000); // 5 minutes = 300000ms
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run on mount

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
      params.append('limit', '10000'); // Request all polling units
      
      const response = await fetch(`/api/polling-units/results?${params}`);
      const data = await response.json();
      setPollingUnits(data.polling_units || []);
      setTotal(data.total || 0);
      setLastRefresh(new Date());
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
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    // Automatically search when sorting changes
    setTimeout(() => fetchPollingUnits(), 50);
  };

  const handleSearch = () => {
    fetchPollingUnits();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLgaFilter('');
    setWardFilter('');
    setSortBy('polling_unit_code');
    setSortOrder('asc');
    // Fetch with cleared filters
    setTimeout(() => fetchPollingUnits(), 100);
  };

  const getResultStatus = (pu: PollingUnit) => {
    if (pu.result) {
      return <Badge className="bg-green-600 hover:bg-green-700 font-semibold shadow-sm">✓ Submitted</Badge>;
    }
    return <Badge variant="outline" className="text-gray-500 font-semibold">⏳ Pending</Badge>;
  };

  const resultsSubmitted = pollingUnits.filter(pu => pu.result !== null).length;
  const resultsPending = pollingUnits.filter(pu => pu.result === null).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Election Results</h1>
            <p className="text-gray-500 mt-1">View all polling units and their submitted results</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Auto-refreshing every 5 mins</span>
            <span className="text-xs">Last: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Summary Cards - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Polling Units</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{total.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform">
                  <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Results Submitted</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{resultsSubmitted.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Results</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{resultsPending.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Submission Rate</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                    {total > 0 ? ((resultsSubmitted / total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Enhanced */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search PU code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
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
              <Button onClick={handleSearch} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={clearFilters} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table - Enhanced */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-teal-500 rounded-full"></div>
              Polling Units ({pollingUnits.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
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
                      <TableRow key={pu.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
