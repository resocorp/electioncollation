'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AddAgentForm } from '@/components/add-agent-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, UserPlus, Search, Edit2, Ban, CheckCircle, Trash2, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, [search]);

  const fetchAgents = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '100');
      
      const response = await fetch(`/api/agents?${params}`);
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgentSuccess = () => {
    toast({
      title: 'Agent added successfully',
      description: 'The agent has been registered.',
    });
    setShowAddForm(false);
    fetchAgents();
  };

  const handleToggleStatus = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Status updated',
          description: `Agent ${newStatus === 'active' ? 'activated' : 'suspended'} successfully.`,
        });
        fetchAgents();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update agent status',
        variant: 'destructive',
      });
    }
  };

  const handleEditAgent = async (updatedData: any) => {
    try {
      const response = await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        toast({
          title: 'Agent updated',
          description: 'Agent details have been updated successfully.',
        });
        setEditingAgent(null);
        fetchAgents();
      } else {
        throw new Error('Failed to update agent');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update agent',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete ${agentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Agent deleted',
          description: `${agentName} has been removed.`,
        });
        fetchAgents();
      } else {
        const data = await response.json();
        toast({
          title: 'Cannot delete',
          description: data.error || 'Failed to delete agent',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete agent',
        variant: 'destructive',
      });
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile) {
      toast({
        title: 'Error',
        description: 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const agents = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const agent: any = {};
        headers.forEach((header, index) => {
          agent[header] = values[index];
        });
        return agent;
      });

      const response = await fetch('/api/agents/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents }),
      });

      const data = await response.json();

      toast({
        title: 'Upload complete',
        description: `${data.success} agents added, ${data.failed} failed`,
        variant: data.failed > 0 ? 'destructive' : 'default',
      });

      if (data.failed > 0 && data.errors) {
        console.log('Upload errors:', data.errors);
      }

      setCsvFile(null);
      fetchAgents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process CSV file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'name,phone_number,email,polling_unit_code,ward,lga,role\nJohn Doe,08012345678,john@example.com,PU001AG,Aguata I,Aguata,pu_agent';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agents_template.csv';
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Agent Management</h1>
            <p className="text-gray-500 mt-1">Manage polling unit agents and coordinators</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Agent</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Select state, LGA, ward, and polling unit with GPS coordinates
              </p>
            </CardHeader>
            <CardContent>
              <AddAgentForm 
                onSuccess={handleAddAgentSuccess}
                onCancel={() => setShowAddForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Edit Agent Dialog */}
        <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Agent Details</DialogTitle>
              <DialogDescription>
                Update agent information. Changes will be saved immediately.
              </DialogDescription>
            </DialogHeader>
            {editingAgent && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleEditAgent({
                  name: formData.get('name'),
                  email: formData.get('email'),
                  phone_number: formData.get('phone_number'),
                });
              }} className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingAgent.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone Number *</Label>
                  <Input
                    id="edit-phone"
                    name="phone_number"
                    defaultValue={editingAgent.phone_number}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingAgent.email || ''}
                  />
                </div>
                <div className="col-span-2 bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Location:</strong> {editingAgent.ward}, {editingAgent.lga}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Polling Unit:</strong> {editingAgent.polling_unit_code}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Note: Location details cannot be changed. Create a new agent if needed.
                  </p>
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingAgent(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Agent List</TabsTrigger>
            <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Agents ({agents.length})</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search agents..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-64"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>PU Code</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>LGA</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell className="font-mono text-sm">{agent.phone_number}</TableCell>
                        <TableCell>{agent.polling_unit_code}</TableCell>
                        <TableCell>{agent.ward}</TableCell>
                        <TableCell>{agent.lga}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{agent.role.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
                            {agent.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Manage Agent</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setEditingAgent(agent)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(agent.id, agent.status)}>
                                {agent.status === 'active' ? (
                                  <>
                                    <Ban className="w-4 h-4 mr-2" />
                                    Suspend Agent
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Activate Agent
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteAgent(agent.id, agent.name)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Agent
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload Agents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Upload CSV File</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    CSV format: name, phone_number, email, polling_unit_code, ward, lga, role
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleBulkUpload} disabled={!csvFile || uploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Agents'}
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate}>
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
