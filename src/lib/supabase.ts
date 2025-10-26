import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          phone_number: string;
          email: string | null;
          name: string;
          password_hash: string | null;
          polling_unit_code: string;
          ward: string;
          lga: string;
          state: string;
          role: string;
          status: string;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone_number: string;
          email?: string | null;
          name: string;
          password_hash?: string | null;
          polling_unit_code: string;
          ward: string;
          lga: string;
          state: string;
          role: string;
          status?: string;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string;
          email?: string | null;
          name?: string;
          password_hash?: string | null;
          polling_unit_code?: string;
          ward?: string;
          lga?: string;
          state?: string;
          role?: string;
          status?: string;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      election_results: {
        Row: {
          id: string;
          reference_id: string;
          agent_id: string;
          polling_unit_code: string;
          ward: string;
          lga: string;
          state: string;
          party_votes: Record<string, number>;
          total_votes: number;
          validation_status: string;
          validated_by: string | null;
          validated_at: string | null;
          rejection_reason: string | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_id: string;
          agent_id: string;
          polling_unit_code: string;
          ward: string;
          lga: string;
          state: string;
          party_votes: Record<string, number>;
          total_votes: number;
          validation_status?: string;
          validated_by?: string | null;
          validated_at?: string | null;
          rejection_reason?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_id?: string;
          agent_id?: string;
          polling_unit_code?: string;
          ward?: string;
          lga?: string;
          state?: string;
          party_votes?: Record<string, number>;
          total_votes?: number;
          validation_status?: string;
          validated_by?: string | null;
          validated_at?: string | null;
          rejection_reason?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
      };
      incident_reports: {
        Row: {
          id: string;
          reference_id: string;
          agent_id: string;
          polling_unit_code: string;
          ward: string;
          lga: string;
          state: string;
          incident_type: string;
          description: string;
          severity: string;
          status: string;
          assigned_to: string | null;
          resolution_notes: string | null;
          reported_at: string;
          resolved_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_id: string;
          agent_id: string;
          polling_unit_code: string;
          ward: string;
          lga: string;
          state: string;
          incident_type: string;
          description: string;
          severity?: string;
          status?: string;
          assigned_to?: string | null;
          resolution_notes?: string | null;
          reported_at?: string;
          resolved_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_id?: string;
          agent_id?: string;
          polling_unit_code?: string;
          ward?: string;
          lga?: string;
          state?: string;
          incident_type?: string;
          description?: string;
          severity?: string;
          status?: string;
          assigned_to?: string | null;
          resolution_notes?: string | null;
          reported_at?: string;
          resolved_at?: string | null;
          updated_at?: string;
        };
      };
      sms_logs: {
        Row: {
          id: string;
          phone_number: string;
          direction: string;
          message: string;
          status: string;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone_number: string;
          direction: string;
          message: string;
          status: string;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string;
          direction?: string;
          message?: string;
          status?: string;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
      };
      parties: {
        Row: {
          id: string;
          acronym: string;
          full_name: string;
          logo_url: string | null;
          color: string | null;
          is_active: boolean;
          display_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          acronym: string;
          full_name: string;
          logo_url?: string | null;
          color?: string | null;
          is_active?: boolean;
          display_order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          acronym?: string;
          full_name?: string;
          logo_url?: string | null;
          color?: string | null;
          is_active?: boolean;
          display_order?: number | null;
          created_at?: string;
        };
      };
    };
  };
};
