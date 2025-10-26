'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2 } from 'lucide-react';

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
}

interface AddAgentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddAgentForm({ onSuccess, onCancel }: AddAgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    polling_unit_code: '',
    ward: '',
    lga: '',
    state: '',
    latitude: null as number | null,
    longitude: null as number | null,
    role: 'pu_agent'
  });

  // Dropdown data
  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [pollingUnits, setPollingUnits] = useState<PollingUnit[]>([]);

  // Loading states
  const [loadingLgas, setLoadingLgas] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingPUs, setLoadingPUs] = useState(false);

  // Load Nigerian states on mount
  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await fetch('/api/polling-units?type=states');
      const data = await response.json();
      setStates(data.states || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchLGAs = async (state: string) => {
    setLoadingLgas(true);
    try {
      const url = `/api/polling-units?type=lgas&state=${encodeURIComponent(state)}`;
      console.log('🔍 Fetching LGAs from:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('✅ LGAs received:', data.lgas?.length || 0, 'items');
      console.log('📋 LGAs list:', data.lgas);
      setLgas(data.lgas || []);
      setWards([]);
      setPollingUnits([]);
    } catch (error) {
      console.error('❌ Error fetching LGAs:', error);
    } finally {
      setLoadingLgas(false);
    }
  };

  const fetchWards = async (state: string, lga: string) => {
    setLoadingWards(true);
    try {
      const response = await fetch(`/api/polling-units?type=wards&state=${encodeURIComponent(state)}&lga=${encodeURIComponent(lga)}`);
      const data = await response.json();
      setWards(data.wards || []);
      setPollingUnits([]);
    } catch (error) {
      console.error('Error fetching wards:', error);
    } finally {
      setLoadingWards(false);
    }
  };

  const fetchPollingUnits = async (state: string, lga: string, ward: string) => {
    setLoadingPUs(true);
    try {
      const response = await fetch(`/api/polling-units?type=polling_units&state=${encodeURIComponent(state)}&lga=${encodeURIComponent(lga)}&ward=${encodeURIComponent(ward)}`);
      const data = await response.json();
      setPollingUnits(data.polling_units || []);
    } catch (error) {
      console.error('Error fetching polling units:', error);
    } finally {
      setLoadingPUs(false);
    }
  };

  const handleStateChange = (state: string) => {
    setFormData({
      ...formData,
      state,
      lga: '',
      ward: '',
      polling_unit_code: '',
      latitude: null,
      longitude: null
    });
    fetchLGAs(state);
  };

  const handleLGAChange = (lga: string) => {
    setFormData({
      ...formData,
      lga,
      ward: '',
      polling_unit_code: '',
      latitude: null,
      longitude: null
    });
    fetchWards(formData.state, lga);
  };

  const handleWardChange = (ward: string) => {
    setFormData({
      ...formData,
      ward,
      polling_unit_code: '',
      latitude: null,
      longitude: null
    });
    fetchPollingUnits(formData.state, formData.lga, ward);
  };

  const handlePollingUnitChange = (puCode: string) => {
    const selectedPU = pollingUnits.find(pu => pu.polling_unit_code === puCode);
    setFormData({
      ...formData,
      polling_unit_code: puCode,
      latitude: selectedPU?.latitude || null,
      longitude: selectedPU?.longitude || null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to add agent'}`);
      }
    } catch (error) {
      alert('An error occurred while adding the agent');
    } finally {
      setLoading(false);
    }
  };

  const selectedPU = pollingUnits.find(pu => pu.polling_unit_code === formData.polling_unit_code);

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      {/* Name */}
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Enter full name"
        />
      </div>

      {/* Phone Number */}
      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          required
          placeholder="08012345678"
        />
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@example.com"
        />
      </div>

      {/* State */}
      <div>
        <Label htmlFor="state">State *</Label>
        <Select value={formData.state} onValueChange={handleStateChange} required>
          <SelectTrigger id="state">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* LGA */}
      <div>
        <Label htmlFor="lga">LGA * ({lgas.length} available)</Label>
        <select
          id="lga"
          value={formData.lga}
          onChange={(e) => handleLGAChange(e.target.value)}
          disabled={!formData.state || loadingLgas}
          required
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">{loadingLgas ? "Loading LGAs..." : "Select LGA"}</option>
          {lgas.map((lga) => (
            <option key={lga} value={lga}>
              {lga}
            </option>
          ))}
        </select>
      </div>

      {/* Ward */}
      <div>
        <Label htmlFor="ward">Ward *</Label>
        <Select 
          value={formData.ward} 
          onValueChange={handleWardChange} 
          disabled={!formData.lga || loadingWards}
          required
        >
          <SelectTrigger id="ward">
            <SelectValue placeholder={loadingWards ? "Loading wards..." : "Select ward"} />
          </SelectTrigger>
          <SelectContent>
            {wards.map((ward) => (
              <SelectItem key={ward} value={ward}>
                {ward}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Polling Unit */}
      <div>
        <Label htmlFor="pu">Polling Unit *</Label>
        <Select 
          value={formData.polling_unit_code} 
          onValueChange={handlePollingUnitChange} 
          disabled={!formData.ward || loadingPUs}
          required
        >
          <SelectTrigger id="pu">
            <SelectValue placeholder={loadingPUs ? "Loading polling units..." : "Select polling unit"} />
          </SelectTrigger>
          <SelectContent>
            {pollingUnits.map((pu) => (
              <SelectItem key={pu.id} value={pu.polling_unit_code}>
                {pu.polling_unit_name} ({pu.polling_unit_code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* GPS Coordinates (auto-populated, read-only) */}
      {selectedPU && selectedPU.latitude && selectedPU.longitude && (
        <div className="col-span-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>
              <strong>GPS Location:</strong> {selectedPU.latitude}, {selectedPU.longitude}
              {selectedPU.registered_voters > 0 && (
                <span className="ml-3">
                  <strong>Registered Voters:</strong> {selectedPU.registered_voters.toLocaleString()}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="col-span-2 flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Add Agent
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
