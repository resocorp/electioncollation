'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileCheck, Clock, AlertTriangle, MessageSquare, Send, Inbox, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Top 6 main parties for dashboard display
const MAIN_PARTIES = ['ADC', 'APC', 'APGA', 'LP', 'PDP', 'YPP'];

// All party colors (16 registered parties)
const PARTY_COLORS: Record<string, string> = {
  // Main Parties (Top 6)
  ADC: '#228B22',
  APC: '#0066CC',
  APGA: '#006600',
  LP: '#DC143C',
  PDP: '#FF0000',
  YPP: '#4169E1',
  // Other Parties
  AA: '#800080',
  ADP: '#FFA500',
  AP: '#008080',
  APM: '#FF1493',
  BP: '#8B4513',
  NNPP: '#FF6600',
  NRM: '#00CED1',
  PRP: '#9370DB',
  SDP: '#FFD700',
  ZLP: '#20B2AA',
  // Others category
  OTHERS: '#999999',
};

/**
 * Group party votes into top 6 + Others
 */
function groupPartyVotes(partyVotes: Record<string, number>): Record<string, number> {
  const grouped: Record<string, number> = {};
  let othersTotal = 0;

  for (const [party, votes] of Object.entries(partyVotes)) {
    if (MAIN_PARTIES.includes(party)) {
      grouped[party] = votes;
    } else {
      othersTotal += votes;
    }
  }

  if (othersTotal > 0) {
    grouped['OTHERS'] = othersTotal;
  }

  return grouped;
}

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
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Group party votes for display (top 6 + Others)
  const groupedVotes = stats?.partyVotes ? groupPartyVotes(stats.partyVotes) : {};
  
  // Sort to ensure consistent order: main parties first, then OTHERS
  const sortedEntries = Object.entries(groupedVotes).sort(([a], [b]) => {
    if (a === 'OTHERS') return 1;
    if (b === 'OTHERS') return -1;
    return MAIN_PARTIES.indexOf(a) - MAIN_PARTIES.indexOf(b);
  });
  
  const chartData = sortedEntries.map(([party, votes]) => ({
    party,
    votes,
    fill: PARTY_COLORS[party] || '#999999'
  }));

  const pieData = sortedEntries.map(([party, votes]) => ({
    name: party,
    value: votes
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time election monitoring - Anambra 2025</p>
        </div>

        {/* Stats Grid - Enhanced Modern Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">PU Agents Profiled</CardTitle>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stats?.profiledAgents || 0}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  of {stats?.expectedTotalPUs || 0} total PUs
                </p>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {stats?.profilingPercentage || 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Results Submitted</CardTitle>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg group-hover:scale-110 transition-transform">
                <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {stats?.submittedCount || 0}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  vs {stats?.expectedTotalPUs || 0} expected
                </p>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {stats?.submissionPercentage || 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Votes Cast</CardTitle>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {stats?.totalVotes?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Across all submitted results
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Incidents</CardTitle>
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {stats?.totalIncidents || 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stats?.investigatingIncidents || 0} investigating, {stats?.resolvedIncidents || 0} resolved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SMS Statistics Section */}
        {stats?.smsStats && (
          <>
            <div className="mt-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">SMS Activity (Last 24 Hours)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</CardTitle>
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {stats.smsStats.totalSMS}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stats.smsStats.successRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {stats.smsStats.successRate}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Inbound SMS</CardTitle>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {stats.smsStats.inboundSMS}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    From agents
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Outbound SMS</CardTitle>
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Send className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {stats.smsStats.outboundSMS}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Responses sent
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</CardTitle>
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    {stats.smsStats.activeSessions}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last hour
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Charts - Enhanced with better styling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                Party Votes Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="party" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#E5E7EB' }} />
                    <Legend />
                    <Bar dataKey="votes" fill="#8884d8">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No results submitted yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-teal-500 rounded-full"></div>
                Vote Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#E5E7EB' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No results submitted yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Results Feed - Enhanced */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  Latest Results
                  <Badge variant="secondary" className="ml-2 animate-pulse">
                    Live
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time feed of submitted results</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {latestResults.length > 0 ? (
              <div className="space-y-3">
                {latestResults.map((result) => (
                  <div key={result.id} className="border-l-4 border-green-500 dark:border-green-400 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30 p-4 rounded-r-md hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{result.pollingUnit}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.ward}, {result.lga}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(result.submittedAt).toLocaleTimeString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {Object.entries(result.partyVotes as Record<string, number>)
                        .sort(([a], [b]) => {
                          // Sort: main parties first, then others
                          const aIsMain = MAIN_PARTIES.includes(a);
                          const bIsMain = MAIN_PARTIES.includes(b);
                          if (aIsMain && !bIsMain) return -1;
                          if (!aIsMain && bIsMain) return 1;
                          return a.localeCompare(b);
                        })
                        .map(([party, votes]) => (
                        <div key={party} className="flex items-center justify-between text-sm">
                          <span className="font-medium" style={{ color: PARTY_COLORS[party] || '#999999' }}>
                            {party}:
                          </span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{votes}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Total: {result.totalVotes} votes</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">By: {result.agentName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No results submitted yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Votes Summary - Enhanced */}
        {stats?.totalVotes > 0 && (
          <Card className="hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <div className="h-10 w-1.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
                <span>Total Votes: <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">{stats.totalVotes.toLocaleString()}</span></span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(groupedVotes).map(([party, votes]: [string, any]) => (
                  <div key={party} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-105">
                    <span className="font-semibold" style={{ color: PARTY_COLORS[party] }}>
                      {party}
                    </span>
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{votes.toLocaleString()}</span>
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
