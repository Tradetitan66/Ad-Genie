// Script to create the output-images storage bucket in Supabase
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

    // Check if output-images bucket exists
    const outputImagesBucket = buckets.find(b => b.name === 'output-images');
    
    if (outputImagesBucket) {
      console.log('\n✅ Bucket "output-images" already exists!');
      console.log(`   Public: ${outputImagesBucket.public}`);
      console.log(`   Created: ${outputImagesBucket.created_at}`);
      console.log('\n📋 Note: Make sure RLS policies are set up correctly');
      return;
    }

    console.log('\n📦 Creating "output-images" bucket...');

    // Create the bucket (private bucket for security)
    const { data, error } = await supabaseAdmin.storage.createBucket('output-images', {
      public: false, // Private bucket for security
      fileSizeLimit: 10485760, // 10MB limit
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });

    if (error) {
      console.error('❌ Error creating bucket:', error.message);
      console.error('\n💡 If you get a permission error, you may need to:');
      console.error('   1. Create the bucket manually in Supabase Dashboard');
      console.error('   2. Go to Storage > New bucket');
      console.error('   3. Name: output-images');
      console.error('   4. Make it private');
      console.error('   5. Run the migration SQL to set up RLS policies');
      return;
    }

    console.log('✅ Bucket "output-images" created successfully!');
    console.log('   Public: false (private)');
    console.log('   File size limit: 10MB');
    console.log('   Allowed types: JPEG, PNG, WebP');
    console.log('\n📋 Next steps:');
    console.log('   1. Run the migration SQL to set up RLS policies');
    console.log('   2. Go to Supabase Dashboard > SQL Editor');
    console.log('   3. Run: supabase/migrations/20250123000000_create_output_images_bucket.sql');
    console.log('   Or run the SQL directly from the migration file');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createBucket();



































