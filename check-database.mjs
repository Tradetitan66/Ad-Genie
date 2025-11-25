// Check database tables and data
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
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking database...\n');

  const tables = ['users', 'brand_profiles', 'preferences', 'campaigns'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        // Get actual count
        const { count: actualCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`✅ ${table}: ${actualCount || 0} record(s)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  // Check storage
  console.log('\n📦 Storage Buckets:');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      data.forEach(bucket => {
        console.log(`   ✅ ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
  } catch (err) {
    console.log(`❌ Storage error: ${err.message}`);
  }
}

checkDatabase();





