# RBAC Quick Start Guide

## 🎯 Current Status

### ✅ What's Working
- **6 Role Types Defined**: `pu_agent`, `ward_agent`, `lga_agent`, `state_agent`, `ccc_supervisor`, `admin`
- **Database Schema**: Roles enforced at DB level with CHECK constraint
- **Role Selection**: Agent form now includes role dropdown
- **Default Admin**: Phone `2348000000000`, Password `Admin123!`

### ⚠️ What Needs Improvement
- **No Password Hashing**: Currently using plain text (CRITICAL SECURITY ISSUE)
- **No JWT Tokens**: Using simple string tokens
- **No Route Protection**: All users can access all pages
- **No API Authorization**: No role checks on API endpoints
- **Weak RLS Policies**: All authenticated users can see everything

---

## 🚀 Quick Actions

### 1. Create Your First Admin (3 Methods)

#### Method A: Use the Script (Recommended)
```bash
# Interactive mode
node scripts/create-admin.js

# Or with parameters
node scripts/create-admin.js \
  --name "Your Name" \
  --phone "08012345678" \
  --email "admin@yourdomain.com" \
  --password "SecurePass123!"
```

This generates SQL that you run in Supabase SQL Editor.

#### Method B: Use the API Endpoint
```bash
curl -X POST http://localhost:3000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "phone_number": "08012345678",
    "email": "admin@yourdomain.com",
    "password": "SecurePass123!",
    "role": "admin"
  }'
```

#### Method C: Direct SQL in Supabase
```sql
INSERT INTO agents (
  phone_number, email, name, password_hash,
  polling_unit_code, ward, lga, state, role, status
) VALUES (
  '2348012345678',
  'admin@yourdomain.com',
  'Your Name',
  'SecurePass123!',  -- TEMPORARY: Use bcrypt hash in production
  'ADMIN', 'Central', 'Central', 'Anambra',
  'admin', 'active'
);
```

### 2. Login as Admin
1. Go to `http://localhost:3000/login`
2. Enter phone: `2348000000000` (or your created admin phone)
3. Enter password: `Admin123!` (or your created admin password)
4. Click Login

### 3. Create Agents with Different Roles
1. Login as admin
2. Go to Dashboard → Agents
3. Click "Add New Agent"
4. Fill in the form
5. **Select the appropriate role** from the dropdown
6. Submit

---

## 📋 Role Hierarchy & Permissions

### Role Levels (Highest to Lowest)

1. **Admin** (`admin`)
   - Full system access
   - Can create/edit/delete all agents
   - Can view all data across all states
   - Can access all features
   - Can create other admins

2. **State Agent** (`state_agent`)
   - Manages entire state
   - Can view all LGAs, wards, and PUs in their state
   - Can validate results
   - Can assign ward/LGA agents

3. **CCC Supervisor** (`ccc_supervisor`)
   - Command & Control Center supervisor
   - Monitors SMS lines
   - Views real-time dashboards
   - Can escalate incidents

4. **LGA Agent** (`lga_agent`)
   - Manages specific LGA
   - Can view all wards and PUs in their LGA
   - Can validate ward results
   - Can assign ward agents

5. **Ward Agent** (`ward_agent`)
   - Manages specific ward
   - Can view all PUs in their ward
   - Can validate PU results
   - Can assign PU agents

6. **Polling Unit Agent** (`pu_agent`)
   - Field agent at specific polling unit
   - Can submit results for their PU
   - Can report incidents
   - Can receive SMS instructions

### Recommended Permissions Matrix

| Feature | Admin | State | CCC | LGA | Ward | PU |
|---------|-------|-------|-----|-----|------|-----|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Electoral Map | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| Manage Agents | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ❌ |
| View All Results | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Validate Results | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Submit Results | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| View Incidents | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Manage Incidents | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| SMS Lines | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| SMS Simulator | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Config | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full access
- ⚠️ Limited to their jurisdiction (state/LGA/ward/PU)
- ❌ No access

---

## 🔒 Security Improvements Needed

### Priority 1: CRITICAL (Do Before Production)

1. **Implement Password Hashing**
   ```bash
   npm install bcryptjs
   npm install --save-dev @types/bcryptjs
   ```

   Update `src/app/api/auth/login/route.ts`:
   ```typescript
   import bcrypt from 'bcryptjs';
   
   // When creating user
   const hashedPassword = await bcrypt.hash(password, 12);
   
   // When logging in
   const isValid = await bcrypt.compare(password, agent.password_hash);
   ```

2. **Implement JWT Tokens**
   ```bash
   npm install jsonwebtoken
   npm install --save-dev @types/jsonwebtoken
   ```

   Create `src/lib/jwt.ts`:
   ```typescript
   import jwt from 'jsonwebtoken';
   
   const JWT_SECRET = process.env.JWT_SECRET!;
   
   export function signToken(payload: any) {
     return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
   }
   
   export function verifyToken(token: string) {
     return jwt.verify(token, JWT_SECRET);
   }
   ```

3. **Add Environment Variable**
   Add to `.env.local`:
   ```
   JWT_SECRET=your-super-secret-key-change-this-in-production
   ```

### Priority 2: HIGH (Do Soon)

4. **Create Middleware for Route Protection**
   Create `src/middleware.ts`:
   ```typescript
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';
   
   export function middleware(request: NextRequest) {
     const token = request.cookies.get('auth_token');
     
     if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
     
     return NextResponse.next();
   }
   
   export const config = {
     matcher: '/dashboard/:path*',
   };
   ```

5. **Add Role-Based UI Rendering**
   Update `src/components/dashboard-layout.tsx` to filter navigation based on role.

6. **Implement API Route Protection**
   Create helper functions to check roles before allowing API operations.

### Priority 3: MEDIUM (Nice to Have)

7. **Proper RLS Policies**
   Update Supabase policies to filter data based on user role and jurisdiction.

8. **Audit Logging**
   Log all admin actions to `audit_logs` table.

9. **2FA for Admins**
   Implement two-factor authentication for admin accounts.

10. **Password Reset Flow**
    Add forgot password functionality.

---

## 🧪 Testing RBAC

### Test Scenarios

1. **Create Test Users**
   ```sql
   -- Create one user for each role
   INSERT INTO agents (phone_number, email, name, password_hash, polling_unit_code, ward, lga, state, role, status) VALUES
   ('2348100000001', 'pu@test.com', 'PU Agent Test', 'test123', 'AWKAS_AMAWBIA-I_010', 'AMAWBIA I', 'AWKA SOUTH', 'Anambra', 'pu_agent', 'active'),
   ('2348100000002', 'ward@test.com', 'Ward Agent Test', 'test123', 'AWKAS_AMAWBIA-I_010', 'AMAWBIA I', 'AWKA SOUTH', 'Anambra', 'ward_agent', 'active'),
   ('2348100000003', 'lga@test.com', 'LGA Agent Test', 'test123', 'AWKAS_AMAWBIA-I_010', 'AMAWBIA I', 'AWKA SOUTH', 'Anambra', 'lga_agent', 'active'),
   ('2348100000004', 'state@test.com', 'State Agent Test', 'test123', 'CENTRAL', 'Central', 'Central', 'Anambra', 'state_agent', 'active'),
   ('2348100000005', 'ccc@test.com', 'CCC Supervisor Test', 'test123', 'CENTRAL', 'Central', 'Central', 'Anambra', 'ccc_supervisor', 'active');
   ```

2. **Test Login for Each Role**
   - Login with each test account
   - Verify correct role displayed in dashboard
   - Check which navigation items are visible

3. **Test Data Access**
   - PU Agent should only see their polling unit data
   - Ward Agent should see all PUs in their ward
   - LGA Agent should see all wards in their LGA
   - State Agent should see all LGAs in their state
   - Admin should see everything

4. **Test Actions**
   - Try creating agents with different roles
   - Try submitting results
   - Try validating results
   - Verify only authorized users can perform actions

---

## 📞 Support & Troubleshooting

### Common Issues

**Q: I forgot the admin password**
A: Run the create-admin script to create a new admin or reset password in database.

**Q: Can't login with phone number**
A: Ensure phone is in format `2348012345678` (13 digits starting with 234).

**Q: All agents have same role**
A: Check that you're selecting the role in the form. Default is `pu_agent`.

**Q: Users can access pages they shouldn't**
A: Middleware not implemented yet. This is a known security gap.

**Q: Password not working**
A: Currently using plain text passwords (temporary). Make sure you're entering exact password.

### Next Steps

1. ✅ Role selection added to agent form
2. ✅ Admin creation script created
3. ✅ Admin API endpoint created
4. ⏳ Implement password hashing (CRITICAL)
5. ⏳ Implement JWT tokens
6. ⏳ Add middleware for route protection
7. ⏳ Update UI to be role-aware
8. ⏳ Add API authorization checks
9. ⏳ Implement proper RLS policies

---

## 📚 Related Files

- **Schema**: `supabase/schema.sql` - Database structure with roles
- **Login**: `src/app/api/auth/login/route.ts` - Authentication logic
- **Agent Form**: `src/components/add-agent-form.tsx` - Create agents with roles
- **Dashboard**: `src/components/dashboard-layout.tsx` - Main UI layout
- **Admin API**: `src/app/api/admin/create-admin/route.ts` - Create admin users
- **Script**: `scripts/create-admin.js` - CLI tool for creating admins
- **Guide**: `RBAC_IMPLEMENTATION.md` - Detailed implementation guide

---

**Last Updated**: 2025-10-26
**Status**: Role selection implemented, security improvements pending
