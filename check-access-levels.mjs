// Check all access levels in AdGenie Supabase project
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
    const env = {};
    envFile.split('\n').forEach(line => {
      const cleanLine = line.split('#')[0].trim();
      if (!cleanLine) return;
      const match = cleanLine.match(/^([^=]+)=(.+)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim().replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    });
    return env;
  } catch (err) {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken = env.SUPABASE_ACCESS_TOKEN;

console.log('🔐 Checking Your Access Levels in AdGenie Supabase\n');
console.log('='.repeat(70));

// Check what credentials are available
console.log('\n📋 Available Credentials:');
console.log('─'.repeat(70));
console.log(`✅ VITE_SUPABASE_URL: ${supabaseUrl ? 'Configured' : '❌ Missing'}`);
console.log(`✅ VITE_SUPABASE_ANON_KEY: ${anonKey ? 'Configured' : '❌ Missing'}`);
console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? 'Configured' : '❌ Missing'}`);
console.log(`✅ SUPABASE_ACCESS_TOKEN: ${accessToken ? 'Configured' : '❌ Missing'}`);

// Create clients
const supabaseAnon = anonKey ? createClient(supabaseUrl, anonKey) : null;
const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
}) : null;

async function checkAccessLevels() {
  console.log('\n\n🔍 Access Level Analysis:\n');
  console.log('='.repeat(70));

  // 1. Management API Access
  console.log('\n1️⃣ Management API Access (SUPABASE_ACCESS_TOKEN)');
  console.log('─'.repeat(70));
  if (accessToken) {
    console.log('✅ You have Management API access');
    console.log('   Can do:');
    console.log('   • List all projects');
    console.log('   • Get project details');
    console.log('   • Check project status');
    console.log('   • View project settings');
    console.log('   • Manage project configuration');
    
    try {
      const response = await fetch(`https://api.supabase.com/v1/projects/aciqulnrrllslassbgox`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const project = await response.json();
        console.log(`\n   📊 Project Status: ${project.status}`);
        console.log(`   🌍 Region: ${project.region}`);
      }
    } catch (err) {
      console.log('   ⚠️  Could not verify API access');
    }
  } else {
    console.log('❌ No Management API access');
  }

  // 2. Database Access - Anon Key (Frontend)
  console.log('\n2️⃣ Database Access - Anon Key (Frontend/App)');
  console.log('─'.repeat(70));
  if (supabaseAnon) {
    console.log('✅ You have anon key access');
    console.log('   Access level: User-level (subject to RLS policies)');
    console.log('   Can do:');
    console.log('   • Query data (if RLS allows)');
    console.log('   • Insert data (if RLS allows)');
    console.log('   • Update data (if RLS allows)');
    console.log('   • Delete data (if RLS allows)');
    console.log('   • Access storage (if policies allow)');
    console.log('\n   ⚠️  Limitations:');
    console.log('   • Must follow Row Level Security (RLS) policies');
    console.log('   • Can only access data you have permission for');
    console.log('   • Safe for frontend use');
    
    // Test anon access
    try {
      const { data, error } = await supabaseAnon.from('users').select('count').limit(1);
      if (error) {
        console.log(`\n   ⚠️  Test query: ${error.message}`);
      } else {
        console.log(`\n   ✅ Test query: Success (RLS policies applied)`);
      }
    } catch (err) {
      console.log(`\n   ⚠️  Test query: ${err.message}`);
    }
  } else {
    console.log('❌ No anon key access');
  }

  // 3. Database Access - Service Role Key (Admin)
  console.log('\n3️⃣ Database Access - Service Role Key (Admin)');
  console.log('─'.repeat(70));
  if (supabaseAdmin) {
    console.log('✅ You have ADMIN access');
    console.log('   Access level: Full admin (bypasses RLS)');
    console.log('   Can do:');
    console.log('   • Query ALL data (bypasses RLS)');
    console.log('   • Insert/Update/Delete ANY record');
    console.log('   • Bypass all security policies');
    console.log('   • Full storage access');
    console.log('   • Bulk operations');
    console.log('   • Database maintenance');
    console.log('\n   ⚠️  Security:');
    console.log('   • NEVER use in frontend code');
    console.log('   • Only use in backend/server scripts');
    console.log('   • Keep it secret!');
    
    // Test admin access
    try {
      const { data, error } = await supabaseAdmin.from('users').select('*').limit(1);
      if (error) {
        console.log(`\n   ⚠️  Test query: ${error.message}`);
      } else {
        console.log(`\n   ✅ Test query: Success (RLS bypassed)`);
        console.log(`   📊 Found ${data.length} record(s) with admin access`);
      }
    } catch (err) {
      console.log(`\n   ⚠️  Test query: ${err.message}`);
    }
  } else {
    console.log('❌ No admin access');
  }

  // 4. Summary
  console.log('\n\n📊 Access Summary');
  console.log('='.repeat(70));
  
  const accessLevels = [];
  if (accessToken) accessLevels.push('Management API');
  if (anonKey) accessLevels.push('Database (User-level)');
  if (serviceRoleKey) accessLevels.push('Database (Admin-level)');
  
  console.log(`\n✅ You have ${accessLevels.length} access level(s):`);
  accessLevels.forEach((level, index) => {
    console.log(`   ${index + 1}. ${level}`);
  });

  console.log('\n🎯 Recommended Usage:');
  console.log('─'.repeat(70));
  console.log('   Frontend/App: Use anon key (VITE_SUPABASE_ANON_KEY)');
  console.log('   Backend/Admin: Use service_role key (SUPABASE_SERVICE_ROLE_KEY)');
  console.log('   Project Management: Use access token (SUPABASE_ACCESS_TOKEN)');

  // Check database content
  if (supabaseAdmin) {
    console.log('\n\n📦 Database Content Overview');
    console.log('='.repeat(70));
    const tables = ['users', 'brand_profiles', 'preferences', 'campaigns'];
    for (const table of tables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });
        if (!error) {
          console.log(`   ${table}: ${count} record(s)`);
        }
      } catch (err) {
        // Ignore errors
      }
    }
  }

  console.log('\n' + '='.repeat(70));
}

checkAccessLevels().catch(console.error);












