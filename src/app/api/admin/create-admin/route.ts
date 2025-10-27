import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber } from '@/lib/utils';

/**
 * POST /api/admin/create-admin - Create a new admin user
 * 
 * This endpoint is protected and should only be accessible by existing admins.
 * 
 * Body: {
 *   name: string,
 *   phone_number: string,
 *   email: string,
 *   password: string,
 *   role: 'admin' | 'state_agent' | 'lga_agent' | 'ward_agent' | 'ccc_supervisor'
 * }
 * 
 * TODO: Add proper authentication middleware to verify the requesting user is an admin
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Verify requesting user is an admin
    // const requestingUser = await getUserFromRequest(request);
    // if (requestingUser.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const body = await request.json();
    const { name, phone_number, email, password, role = 'admin' } = body;

    // Validation
    if (!name || !phone_number || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: name, phone_number, email, password' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'state_agent', 'lga_agent', 'ward_agent', 'ccc_supervisor', 'pu_agent'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, number, and special character' },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone_number);

    // Check if phone number already exists
    const { data: existing } = await supabase
      .from('agents')
      .select('id, phone_number')
      .eq('phone_number', formattedPhone)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('agents')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // TODO: Hash password with bcrypt
    // const bcrypt = require('bcryptjs');
    // const password_hash = await bcrypt.hash(password, 12);
    
    // For now, store plain password (NOT PRODUCTION READY!)
    const password_hash = password; // TEMPORARY - MUST USE BCRYPT IN PRODUCTION

    // Create admin user
    const { data, error } = await supabase
      .from('agents')
      .insert({
        name,
        phone_number: formattedPhone,
        email,
        password_hash,
        polling_unit_code: role === 'admin' ? 'ADMIN' : 'CENTRAL',
        ward: 'Central',
        lga: 'Central',
        state: 'Anambra',
        role,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Remove sensitive data from response
    const { password_hash: _, ...adminData } = data;

    // TODO: Log admin creation in audit_logs
    // await supabase.from('audit_logs').insert({
    //   user_id: requestingUser.id,
    //   action: 'create_admin',
    //   resource_type: 'agent',
    //   resource_id: data.id,
    //   details: { created_user: adminData }
    // });

    // TODO: Send welcome email with credentials

    return NextResponse.json(
      {
        success: true,
        admin: adminData,
        message: 'Admin user created successfully',
        credentials: {
          phone: formattedPhone,
          email,
          password // Only return in response, never log this!
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in create-admin endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/create-admin - Get admin creation form requirements
 */
export async function GET() {
  return NextResponse.json({
    requirements: {
      name: 'Full name (required)',
      phone_number: 'Phone number in format 08012345678 or 2348012345678 (required)',
      email: 'Valid email address (required)',
      password: 'Minimum 8 characters with uppercase, lowercase, number, and special character (required)',
      role: 'One of: admin, state_agent, lga_agent, ward_agent, ccc_supervisor, pu_agent (default: admin)'
    },
    example: {
      name: 'John Doe',
      phone_number: '08012345678',
      email: 'admin@example.com',
      password: 'SecurePass123!',
      role: 'admin'
    }
  });
}
