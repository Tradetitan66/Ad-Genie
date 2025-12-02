// Script to set up RLS policies for output-images bucket
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

// SQL for RLS policies only (bucket already created)
const policiesSQL = `
-- Policy: Users can upload to their own folder structure {userId}/{campaignId}/{filename}
DROP POLICY IF EXISTS "Users can upload output images to own folder" ON storage.objects;
CREATE POLICY "Users can upload output images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'output-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own output images
DROP POLICY IF EXISTS "Users can view own output images" ON storage.objects;
CREATE POLICY "Users can view own output images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'output-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own output images
DROP POLICY IF EXISTS "Users can update own output images" ON storage.objects;
CREATE POLICY "Users can update own output images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'output-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'output-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own output images
DROP POLICY IF EXISTS "Users can delete own output images" ON storage.objects;
CREATE POLICY "Users can delete own output images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'output-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
`;

async function setupPolicies() {
  console.log('🔧 Setting up RLS policies for output-images bucket...\n');

  try {
    // Execute the SQL to create policies
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql: policiesSQL 
    });

    if (error) {
      // If exec_sql doesn't exist, we need to use direct SQL execution
      // For now, just print the SQL for manual execution
      console.log('⚠️  Cannot execute SQL programmatically.');
      console.log('📋 Please run this SQL in Supabase Dashboard > SQL Editor:\n');
      console.log(policiesSQL);
      console.log('\n💡 Copy the SQL above and run it in Supabase SQL Editor');
      return;
    }

    console.log('✅ RLS policies created successfully!');
    console.log('   - Users can upload output images to own folder');
    console.log('   - Users can view own output images');
    console.log('   - Users can update own output images');
    console.log('   - Users can delete own output images');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:\n');
    console.log(policiesSQL);
  }
}

setupPolicies();















