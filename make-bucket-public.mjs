// Make brand-assets bucket public
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
  console.error('❌ Missing credentials!');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function makeBucketPublic() {
  console.log('🔍 Checking bucket status...\n');

  try {
    // Check current bucket status
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error:', listError.message);
      return;
    }

    const bucket = buckets.find(b => b.name === 'brand-assets');
    if (!bucket) {
      console.error('❌ Bucket "brand-assets" not found!');
      return;
    }

    console.log(`📦 Current status: ${bucket.public ? 'Public' : 'Private'}`);

    if (bucket.public) {
      console.log('✅ Bucket is already public!');
      return;
    }

    console.log('\n🔓 Making bucket public...');

    // Update bucket to be public
    // Note: Supabase JS client doesn't have a direct updateBucket method
    // We need to use the Management API or do it manually in dashboard
    
    console.log('\n⚠️  Cannot update bucket via API. Please do it manually:');
    console.log('\n📋 Steps:');
    console.log('   1. Go to Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to Storage');
    console.log('   4. Click on "brand-assets" bucket');
    console.log('   5. Click "Settings" tab');
    console.log('   6. Toggle "Public bucket" to ON');
    console.log('   7. Save changes');
    
    console.log('\n💡 Alternative: Use Supabase Management API');
    console.log('   Or run this SQL in SQL Editor:');
    console.log('   UPDATE storage.buckets SET public = true WHERE name = \'brand-assets\';');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

makeBucketPublic();













