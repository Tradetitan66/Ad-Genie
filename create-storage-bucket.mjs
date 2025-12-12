// Script to create the brand-assets storage bucket in Supabase
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
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createBucket() {
  console.log('🔍 Checking storage buckets...\n');

  try {
    // List existing buckets
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }

    console.log(`📦 Found ${buckets.length} existing bucket(s):`);
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    // Check if brand-assets bucket exists
    const brandAssetsBucket = buckets.find(b => b.name === 'brand-assets');
    
    if (brandAssetsBucket) {
      console.log('\n✅ Bucket "brand-assets" already exists!');
      console.log(`   Public: ${brandAssetsBucket.public}`);
      console.log(`   Created: ${brandAssetsBucket.created_at}`);
      return;
    }

    console.log('\n📦 Creating "brand-assets" bucket...');

    // Create the bucket
    const { data, error } = await supabaseAdmin.storage.createBucket('brand-assets', {
      public: true, // Make it public so images can be accessed via URL
      fileSizeLimit: 10485760, // 10MB limit
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
    });

    if (error) {
      console.error('❌ Error creating bucket:', error.message);
      console.error('\n💡 If you get a permission error, you may need to:');
      console.error('   1. Create the bucket manually in Supabase Dashboard');
      console.error('   2. Go to Storage > New bucket');
      console.error('   3. Name: brand-assets');
      console.error('   4. Make it public');
      return;
    }

    console.log('✅ Bucket "brand-assets" created successfully!');
    console.log('   Public: true');
    console.log('   File size limit: 10MB');
    console.log('   Allowed types: JPEG, PNG, SVG, WebP');

    // Set up RLS policies (if needed)
    console.log('\n📋 Note: Make sure RLS policies are set up for the bucket');
    console.log('   You can do this in Supabase Dashboard > Storage > Policies');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createBucket();

