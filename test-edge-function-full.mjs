// Full test: Edge Function + Storage Upload
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
    const env = {};
    envFile.split('\n').forEach((line) => {
      const cleanLine = line.split('#')[0].trim();
      if (!cleanLine) return;
      const match = cleanLine.match(/^([^=]+)=(.+)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        value = value.replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    });
    return env;
  } catch (err) {
    return {};
  }
}

function imageToBase64(imagePath) {
  const imageBuffer = readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = imagePath.split('.').pop().toLowerCase();
  const mimeTypes = { 'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg' };
  const mimeType = mimeTypes[ext] || 'image/png';
  return `data:${mimeType};base64,${base64}`;
}

async function base64ToBlob(base64String) {
  const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
  const binaryString = Buffer.from(base64Data, 'base64');
  return new Blob([binaryString], { type: 'image/png' });
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

async function testFullFlow() {
  console.log('🧪 Full Test: Edge Function + Storage Upload\n');
  console.log('='.repeat(70));
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Find test image
  const imagePath = process.argv[2] || join(__dirname, 'public', 'photo_6050851829458864903_y.jpg');
  
  if (!existsSync(imagePath)) {
    console.error('❌ Image not found:', imagePath);
    console.error('   Usage: node test-edge-function-full.mjs <path-to-image>');
    process.exit(1);
  }
  
  console.log(`📷 Test image: ${imagePath}`);
  
  try {
    // Step 1: Convert to base64
    console.log('\n📤 Step 1: Converting image to base64...');
    const imageBase64 = imageToBase64(imagePath);
    const base64Data = imageBase64.split(',')[1];
    console.log(`✅ Converted (${base64Data.length} chars)`);
    
    // Step 2: Call Edge Function
    console.log('\n🚀 Step 2: Calling Edge Function (remove-background)...');
    console.log('⏳ This may take 10-30 seconds...');
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('remove-background', {
      body: { imageBase64: base64Data }
    });
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error('\n❌ Edge Function Error:', error.message);
      if (error.message?.includes('remove.bg')) {
        console.error('\n💡 Possible issues:');
        console.error('   1. REMOVE_BG_API_KEY not set in Supabase Dashboard');
        console.error('   2. API key is invalid or expired');
        console.error('   3. Image format not supported by remove.bg');
        console.error('\n   Check: Supabase Dashboard → Edge Functions → remove-background → Settings');
      }
      return;
    }
    
    if (!data?.imageBase64) {
      console.error('❌ No processed image in response');
      console.log('Response:', JSON.stringify(data, null, 2));
      return;
    }
    
    console.log(`✅ Background removed in ${duration}ms`);
    console.log(`   Processed image size: ${data.imageBase64.length} chars`);
    
    // Step 3: Convert to blob
    console.log('\n📦 Step 3: Converting to blob...');
    const blob = await base64ToBlob(data.imageBase64);
    console.log(`✅ Blob created (${blob.size} bytes)`);
    
    // Step 4: Upload to Supabase Storage
    console.log('\n☁️  Step 4: Uploading to Supabase Storage...');
    const fileName = `test-processed-${Date.now()}.png`;
    const filePath = `test/${fileName}`;
    
    const file = new File([blob], fileName, { type: 'image/png' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(filePath, file, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError.message);
      return;
    }
    
    console.log(`✅ Uploaded to: ${uploadData.path}`);
    
    // Step 5: Get public URL
    console.log('\n🔗 Step 5: Getting public URL...');
    const { data: urlData } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(uploadData.path);
    
    console.log('\n🎉 SUCCESS! Full flow completed!');
    console.log('='.repeat(70));
    console.log('📋 Results:');
    console.log(`   ✅ Background removed via Edge Function`);
    console.log(`   ✅ Image uploaded to Supabase Storage`);
    console.log(`   ✅ Public URL: ${urlData.publicUrl}`);
    console.log('\n💡 You can now enable background removal in your app!');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(0, 3).join('\n'));
    }
  }
}

testFullFlow();























