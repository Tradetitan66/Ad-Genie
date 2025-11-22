// Admin Database Examples - Common admin operations
// ⚠️ WARNING: Uses service_role key - NEVER expose in frontend!

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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('📚 Admin Database Examples\n');
console.log('='.repeat(60));

// Example functions (uncomment the one you want to use)

async function example1_GetAllUsers() {
  console.log('\n📋 Example 1: Get All Users');
  const { data, error } = await supabaseAdmin.from('users').select('*');
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`Found ${data.length} users:`);
    console.table(data);
  }
}

async function example2_UpdateUser() {
  console.log('\n✏️  Example 2: Update User');
  const email = 'test@example.com'; // Change this
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ display_name: 'Updated Name' })
    .eq('email', email)
    .select();
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Updated:', data);
  }
}

async function example3_DeleteUser() {
  console.log('\n🗑️  Example 3: Delete User (CAREFUL!)');
  const email = 'test@example.com'; // Change this
  const { data, error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('email', email)
    .select();
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Deleted:', data);
  }
}

async function example4_BulkUpdate() {
  console.log('\n📦 Example 4: Bulk Update');
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ has_completed_onboarding: true })
    .eq('has_completed_onboarding', false)
    .select();
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`Updated ${data.length} records`);
  }
}

async function example5_ComplexQuery() {
  console.log('\n🔍 Example 5: Complex Query');
  const { data, error } = await supabaseAdmin
    .from('brand_profiles')
    .select(`
      *,
      users:user_id (
        email,
        display_name
      )
    `);
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`Found ${data.length} brand profiles with user info`);
    console.table(data);
  }
}

async function example6_CountRecords() {
  console.log('\n📊 Example 6: Count Records');
  const tables = ['users', 'brand_profiles', 'preferences', 'campaigns'];
  
  for (const table of tables) {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`  ${table}: Error - ${error.message}`);
    } else {
      console.log(`  ${table}: ${count} records`);
    }
  }
}

// Run examples
async function runExamples() {
  // Uncomment the example you want to run:
  
  // await example1_GetAllUsers();
  // await example2_UpdateUser();
  // await example3_DeleteUser(); // CAREFUL!
  // await example4_BulkUpdate();
  // await example5_ComplexQuery();
  await example6_CountRecords();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 To use other examples, uncomment them in the code');
}

runExamples().catch(console.error);

