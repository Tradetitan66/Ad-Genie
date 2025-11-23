// Admin Database Script - Uses service_role key for full admin access
// ⚠️ WARNING: This script uses service_role key - NEVER expose this in frontend!

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
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
    console.error('❌ Could not read .env file:', err.message);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing credentials!');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Make sure both are set in your .env file');
  process.exit(1);
}

// Create admin client with service_role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔐 Admin Database Access Enabled');
console.log('⚠️  Using service_role key - RLS policies are BYPASSED\n');
console.log('='.repeat(60));

// Example admin operations
async function adminOperations() {
  try {
    // Example 1: Get all users (bypasses RLS)
    console.log('\n1️⃣ Getting all users (admin access):');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('   ❌ Error:', usersError.message);
    } else {
      console.log(`   ✅ Found ${users.length} user(s)`);
      users.forEach((user, index) => {
        console.log(`      ${index + 1}. ${user.email} (${user.display_name || 'No name'})`);
      });
    }

    // Example 2: Get all brand profiles
    console.log('\n2️⃣ Getting all brand profiles (admin access):');
    const { data: brands, error: brandsError } = await supabaseAdmin
      .from('brand_profiles')
      .select('*');
    
    if (brandsError) {
      console.error('   ❌ Error:', brandsError.message);
    } else {
      console.log(`   ✅ Found ${brands.length} brand profile(s)`);
      brands.forEach((brand, index) => {
        console.log(`      ${index + 1}. ${brand.brand_name} (${brand.industry})`);
      });
    }

    // Example 3: Get all preferences
    console.log('\n3️⃣ Getting all preferences (admin access):');
    const { data: prefs, error: prefsError } = await supabaseAdmin
      .from('preferences')
      .select('*');
    
    if (prefsError) {
      console.error('   ❌ Error:', prefsError.message);
    } else {
      console.log(`   ✅ Found ${prefs.length} preference record(s)`);
    }

    // Example 4: Get all campaigns
    console.log('\n4️⃣ Getting all campaigns (admin access):');
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('*');
    
    if (campaignsError) {
      console.error('   ❌ Error:', campaignsError.message);
    } else {
      console.log(`   ✅ Found ${campaigns.length} campaign(s)`);
    }

    // Example 5: Check storage buckets
    console.log('\n5️⃣ Checking storage buckets (admin access):');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   ❌ Error:', bucketsError.message);
    } else {
      console.log(`   ✅ Found ${buckets.length} bucket(s)`);
      buckets.forEach(bucket => {
        console.log(`      - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Admin operations completed successfully!');
    console.log('\n💡 You can now:');
    console.log('   - Query any data (bypasses RLS)');
    console.log('   - Update any record');
    console.log('   - Delete records');
    console.log('   - Perform bulk operations');
    console.log('   - Manage users and data');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run admin operations
adminOperations();


