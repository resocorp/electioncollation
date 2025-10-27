# RBAC Implementation Guide

## Current RBAC Implementation

### 1. **Database Schema** (`supabase/schema.sql`)

The system has role-based access control defined at the database level:

```sql
role TEXT NOT NULL CHECK (role IN ('pu_agent', 'ward_agent', 'lga_agent', 'state_agent', 'ccc_supervisor', 'admin'))
```

**Available Roles:**
- `pu_agent` - Polling Unit Agent (field agents at individual polling units)
- `ward_agent` - Ward Agent (supervisors at ward level)
- `lga_agent` - LGA Agent (supervisors at local government level)
- `state_agent` - State Agent (supervisors at state level)
- `ccc_supervisor` - Command & Control Center Supervisor
- `admin` - System Administrator (full access)

### 2. **Authentication** (`src/app/api/auth/login/route.ts`)

**Current Implementation:**
- Simple password-based authentication (NOT production-ready)
- Admin default password: `Admin123!`
- Other agents default password: `password123`
- No bcrypt hashing implemented (TODO)
- Simple token generation (needs JWT)

**Security Issues:**
- ❌ Plain text password comparison
- ❌ No password hashing
- ❌ No JWT tokens
- ❌ No session management

### 3. **Role Assignment** (`src/components/add-agent-form.tsx`)

**Current Limitation:**
- The form hardcodes role to `pu_agent` (line 39)
- No role selection dropdown in the UI
- All agents created through the form are polling unit agents

```typescript
role: 'pu_agent'  // Hardcoded!
```

### 4. **Authorization** (NOT IMPLEMENTED)

**Missing Features:**
- ❌ No middleware to check user roles
- ❌ No API route protection based on roles
- ❌ No UI component visibility based on roles
- ❌ All navigation items visible to all users
- ❌ No permission checks on actions

### 5. **Row Level Security (RLS)**

**Current State:**
- RLS is enabled on all tables
- BUT policies allow all operations for all authenticated users
- No role-based filtering

```sql
CREATE POLICY "Allow all for authenticated users" ON agents FOR ALL USING (true);
```

---

## How to Create Admins with Passwords

### Option 1: Direct Database Insert (Recommended for First Admin)

1. **Generate bcrypt hash** for your password:
   ```bash
   # Using Node.js
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourSecurePassword123!', 12));"
   ```

2. **Insert admin user** in Supabase SQL Editor:
   ```sql
   INSERT INTO agents (
     phone_number, 
     email, 
     name, 
     password_hash, 
     polling_unit_code, 
     ward, 
     lga, 
     state, 
     role, 
     status
   ) VALUES (
     '2348123456789',
     'admin@yourdomain.com',
     'System Administrator',
     '$2a$12$YOUR_BCRYPT_HASH_HERE',
     'ADMIN',
     'Central',
     'Central',
     'Anambra',
     'admin',
     'active'
   );
   ```

### Option 2: Create Admin Management Script

We'll create a script to manage admin users with proper password hashing.

### Option 3: Admin Creation API (Most Secure)

Create a protected API endpoint that only existing admins can use to create new admins.

---

## Recommended RBAC Improvements

### 1. **Add Role Selection to Agent Form**

Update `add-agent-form.tsx` to include role dropdown:

```typescript
// Add to form state
const [formData, setFormData] = useState({
  // ... existing fields
  role: 'pu_agent'
});

// Add role dropdown in form
<div>
  <Label htmlFor="role">Role *</Label>
  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
    <SelectTrigger id="role">
      <SelectValue placeholder="Select role" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="pu_agent">Polling Unit Agent</SelectItem>
      <SelectItem value="ward_agent">Ward Agent</SelectItem>
      <SelectItem value="lga_agent">LGA Agent</SelectItem>
      <SelectItem value="state_agent">State Agent</SelectItem>
      <SelectItem value="ccc_supervisor">CCC Supervisor</SelectItem>
      <SelectItem value="admin">Administrator</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### 2. **Implement Proper Password Hashing**

Install bcrypt:
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

Update login route to use bcrypt:
```typescript
import bcrypt from 'bcryptjs';

// In login handler
const isValidPassword = await bcrypt.compare(password, agent.password_hash);
if (!isValidPassword) {
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
```

### 3. **Create Middleware for Route Protection**

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

### 4. **Role-Based UI Rendering**

Update `dashboard-layout.tsx`:
```typescript
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['all'] },
  { name: 'Electoral Map', href: '/dashboard/electoral-map', icon: Map, roles: ['admin', 'state_agent', 'ccc_supervisor'] },
  { name: 'Agents', href: '/dashboard/agents', icon: Users, roles: ['admin', 'ward_agent', 'lga_agent', 'state_agent'] },
  { name: 'Results', href: '/dashboard/results', icon: FileText, roles: ['all'] },
  { name: 'Incidents', href: '/dashboard/incidents', icon: AlertTriangle, roles: ['all'] },
  { name: 'SMS Lines', href: '/dashboard/sms-lines', icon: Antenna, roles: ['admin', 'ccc_supervisor'] },
  { name: 'SMS Simulator', href: '/dashboard/sms-simulator', icon: MessageSquare, roles: ['admin'] },
].filter(item => item.roles.includes('all') || item.roles.includes(user.role));
```

### 5. **API Route Protection**

Create a helper function `src/lib/auth.ts`:
```typescript
export function checkRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    
    if (!user || !checkRole(user.role, allowedRoles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return null; // Allowed
  };
}
```

### 6. **Proper RLS Policies**

Update Supabase policies:
```sql
-- Agents can only see agents in their jurisdiction
CREATE POLICY "Agents view based on role" ON agents FOR SELECT USING (
  CASE 
    WHEN role = 'admin' THEN true
    WHEN role = 'state_agent' THEN state = (SELECT state FROM agents WHERE id = auth.uid())
    WHEN role = 'lga_agent' THEN lga = (SELECT lga FROM agents WHERE id = auth.uid())
    WHEN role = 'ward_agent' THEN ward = (SELECT ward FROM agents WHERE id = auth.uid())
    ELSE polling_unit_code = (SELECT polling_unit_code FROM agents WHERE id = auth.uid())
  END
);
```

---

## Quick Setup Steps

1. **Install dependencies:**
   ```bash
   npm install bcryptjs jsonwebtoken
   npm install --save-dev @types/bcryptjs @types/jsonwebtoken
   ```

2. **Create your first admin** (see Option 1 above)

3. **Update authentication** to use bcrypt

4. **Add role selection** to agent form

5. **Implement middleware** for route protection

6. **Update navigation** to be role-based

7. **Add API protection** for sensitive endpoints

---

## Testing RBAC

1. **Create test users** with different roles
2. **Login as each role** and verify:
   - Navigation items visible
   - API endpoints accessible
   - Data filtered correctly
3. **Test unauthorized access** attempts
4. **Verify password security**

---

## Security Best Practices

✅ **DO:**
- Use bcrypt with salt rounds ≥ 12
- Implement JWT tokens with expiration
- Store tokens in httpOnly cookies
- Validate roles on both client and server
- Use RLS policies in Supabase
- Log all admin actions
- Require strong passwords
- Implement 2FA for admins

❌ **DON'T:**
- Store passwords in plain text
- Trust client-side role checks
- Use simple string tokens
- Allow role escalation
- Expose admin endpoints publicly
- Hardcode credentials

---

## Next Steps

Would you like me to:
1. Create the admin management script?
2. Update the authentication to use bcrypt?
3. Add role selection to the agent form?
4. Implement middleware for route protection?
5. Update the UI to be role-aware?

Let me know which improvements you'd like to implement first!
