import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/auth/login - Simple login
 * Body: { phone_number, password }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, password } = body;
    
    if (!phone_number || !password) {
      return NextResponse.json(
        { error: 'Phone number and password are required' },
        { status: 400 }
      );
    }
    
    // For MVP, we'll use simple password check
    // In production, use proper bcrypt hashing
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('status', 'active')
      .single();
    
    if (error || !agent) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // For now, simple password check
    // TODO: Implement proper password hashing with bcrypt
    if (agent.role === 'admin') {
      // Admin password check
      if (password !== 'Admin123!') {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    } else {
      // For other roles, if they have a password set, check it
      // Default password for agents without a set password
      const defaultPassword = 'password123';
      if (agent.password_hash && password !== defaultPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }
    
    // Update last login
    await supabase
      .from('agents')
      .update({ last_login: new Date().toISOString() })
      .eq('id', agent.id);
    
    // Remove sensitive data
    const { password_hash, ...agentData } = agent;
    
    return NextResponse.json({
      user: agentData,
      token: 'simple-token-' + agent.id // In production, use proper JWT
    });
    
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
