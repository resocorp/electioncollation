'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileCheck, Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PARTY_COLORS: Record<string, string> = {
  APGA: '#006600',
  APC: '#0066CC',
  PDP: '#FF0000',
  LP: '#DC143C',
  NNPP: '#FF6600',
  ADC: '#228B22',
  YPP: '#4169E1',
  SDP: '#FFD700',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [latestResults, setLatestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchLatestResults();
    const statsInterval = setInterval(fetchStats, 60000); // Refresh every minute
    const resultsInterval = setInterval(fetchLatestResults, 30000); // Refresh every 30 seconds
    return () => {
      clearInterval(statsInterval);
      clearInterval(resultsInterval);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestResults = async () => {
    try {
      const response = await fetch('/api/dashboard/latest-results?limit=5');
      const data = await response.json();
      setLatestResults(data.results || []);
    } catch (error) {
      console.error('Error fetching latest results:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  const chartData = stats?.partyVotes ? Object.entries(stats.partyVotes).map(([party, votes]) => ({
    party,
    votes,
    fill: PARTY_COLORS[party] || '#999999'
  })) : [];

  const pieData = chartData.map(item => ({
    name: item.party,
    value: item.votes
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Real-time election monitoring - Anambra 2025</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">PU Agents Profiled</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.profiledAgents || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                of {stats?.expectedTotalPUs || 0} total PUs ({stats?.profilingPercentage || 0}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Results Submitted</CardTitle>
              <FileCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.submittedCount || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                vs {stats?.expectedTotalPUs || 0} expected ({stats?.submissionPercentage || 0}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Votes Cast</CardTitle>
              <FileCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalVotes?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Across all submitted results
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.totalIncidents || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.investigatingIncidents || 0} investigating, {stats?.resolvedIncidents || 0} resolved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Party Votes Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="party" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="votes" fill="#8884d8">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No results submitted yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vote Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PARTY_COLORS[entry.name] || '#999999'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No results submitted yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Results Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Results</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Real-time feed of submitted results</p>
          </CardHeader>
          <CardContent>
            {latestResults.length > 0 ? (
              <div className="space-y-3">
                {latestResults.map((result) => (
                  <div key={result.id} className="border-l-4 border-green-500 bg-gray-50 p-4 rounded-r-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{result.pollingUnit}</p>
                        <p className="text-xs text-gray-500">{result.ward}, {result.lga}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(result.submittedAt).toLocaleTimeString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {Object.entries(result.partyVotes as Record<string, number>).map(([party, votes]) => (
                        <div key={party} className="flex items-center justify-between text-sm">
                          <span className="font-medium" style={{ color: PARTY_COLORS[party] }}>
                            {party}:
                          </span>
                          <span className="font-bold">{votes}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-xs text-gray-600">Total: {result.totalVotes} votes</span>
                      <span className="text-xs text-gray-500">By: {result.agentName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No results submitted yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Votes Summary */}
        {stats?.totalVotes > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Total Votes: {stats.totalVotes.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.partyVotes || {}).map(([party, votes]: [string, any]) => (
                  <div key={party} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <span className="font-semibold" style={{ color: PARTY_COLORS[party] }}>
                      {party}
                    </span>
                    <span className="text-xl font-bold">{votes.toLocaleString()}</span>
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
