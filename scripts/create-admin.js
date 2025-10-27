#!/usr/bin/env node

/**
 * Admin User Creation Script
 * 
 * This script helps you create admin users with properly hashed passwords.
 * 
 * Usage:
 *   node scripts/create-admin.js
 * 
 * Or with parameters:
 *   node scripts/create-admin.js --name "John Doe" --phone "2348123456789" --email "admin@example.com" --password "SecurePass123!"
 */

const readline = require('readline');
const crypto = require('crypto');

// Simple bcrypt-like hash function (for demo - use real bcrypt in production)
function hashPassword(password) {
  // In production, use: const bcrypt = require('bcryptjs'); return bcrypt.hashSync(password, 12);
  // For now, we'll generate a hash that you can use
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `$pbkdf2$${salt}$${hash}`;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    params[key] = value;
  }
  
  return params;
}

// Validate phone number
function validatePhone(phone) {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Should be 13 digits starting with 234 (Nigeria)
  if (cleaned.length === 13 && cleaned.startsWith('234')) {
    return cleaned;
  }
  
  // If 11 digits starting with 0, convert to international
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return '234' + cleaned.substring(1);
  }
  
  // If 10 digits, add 234
  if (cleaned.length === 10) {
    return '234' + cleaned;
  }
  
  throw new Error('Invalid phone number format. Use: 08012345678 or 2348012345678');
}

// Validate email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return email;
}

// Validate password strength
function validatePassword(password) {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    throw new Error('Password must contain uppercase, lowercase, number, and special character');
  }
  
  return password;
}

// Interactive prompt
async function promptUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('\n🔐 Admin User Creation Tool\n');
  console.log('This will generate SQL to create an admin user with a hashed password.\n');

  try {
    const name = await question('Full Name: ');
    if (!name.trim()) throw new Error('Name is required');

    const phoneInput = await question('Phone Number (e.g., 08012345678): ');
    const phone = validatePhone(phoneInput);

    const emailInput = await question('Email: ');
    const email = validateEmail(emailInput);

    const password = await question('Password (min 8 chars, mixed case, number, special char): ');
    validatePassword(password);

    const role = await question('Role [admin]: ') || 'admin';
    
    rl.close();

    return { name, phone, email, password, role };
  } catch (error) {
    rl.close();
    throw error;
  }
}

// Generate SQL
function generateSQL(userData) {
  const { name, phone, email, password, role } = userData;
  const passwordHash = hashPassword(password);

  const sql = `
-- ============================================
-- Admin User Creation SQL
-- ============================================
-- Generated: ${new Date().toISOString()}
-- Name: ${name}
-- Phone: ${phone}
-- Email: ${email}
-- Role: ${role}
-- ============================================

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
  '${phone}',
  '${email}',
  '${name}',
  '${passwordHash}',
  'ADMIN',
  'Central',
  'Central',
  'Anambra',
  '${role}',
  'active'
)
ON CONFLICT (phone_number) 
DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. This uses PBKDF2 hashing (demo). For production, use bcrypt!
-- 2. Run this SQL in your Supabase SQL Editor
-- 3. Keep this password safe: ${password}
-- 4. Delete this file after creating the admin
-- ============================================
`;

  return sql;
}

// Generate bcrypt command
function generateBcryptCommand(password) {
  return `
-- ============================================
-- For Production: Use Real Bcrypt Hash
-- ============================================
-- Install bcryptjs: npm install bcryptjs
-- Then run this command to generate a proper hash:

node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('${password}', 12));"

-- Replace the password_hash in the SQL above with the output
-- ============================================
`;
}

// Main function
async function main() {
  try {
    const args = parseArgs();
    
    let userData;
    
    if (args.name && args.phone && args.email && args.password) {
      // Use command line arguments
      userData = {
        name: args.name,
        phone: validatePhone(args.phone),
        email: validateEmail(args.email),
        password: validatePassword(args.password),
        role: args.role || 'admin'
      };
    } else {
      // Interactive mode
      userData = await promptUser();
    }

    console.log('\n✅ Validation successful!\n');
    console.log('📋 User Details:');
    console.log(`   Name: ${userData.name}`);
    console.log(`   Phone: ${userData.phone}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Password: ${'*'.repeat(userData.password.length)}`);

    const sql = generateSQL(userData);
    const bcryptCmd = generateBcryptCommand(userData.password);

    console.log('\n📝 SQL Generated:\n');
    console.log(sql);
    console.log(bcryptCmd);

    // Save to file
    const fs = require('fs');
    const filename = `admin-${Date.now()}.sql`;
    fs.writeFileSync(filename, sql + bcryptCmd);
    
    console.log(`\n💾 SQL saved to: ${filename}`);
    console.log('\n⚠️  SECURITY REMINDER:');
    console.log('   1. Run this SQL in Supabase SQL Editor');
    console.log('   2. Delete the generated .sql file after use');
    console.log('   3. For production, use bcrypt instead of PBKDF2');
    console.log('   4. Never commit passwords or SQL files to git\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { hashPassword, validatePhone, validateEmail, validatePassword };
