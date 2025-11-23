// Test script to check if Edge Function is working with real image
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
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
    console.error('❌ Could not read .env file:', err.message);
    return {};
  }
}

// Convert image file to base64
function imageToBase64(imagePath) {
  try {
    const imageBuffer = readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    // Determine MIME type from extension
    const ext = imagePath.split('.').pop().toLowerCase();
    const mimeTypes = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    const mimeType = mimeTypes[ext] || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    throw new Error(`Failed to read image file: ${err.message}`);
  }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function testEdgeFunction() {
  console.log('🧪 Testing Supabase Edge Function: remove-background\n');
  console.log('='.repeat(70));
  
  // Try to find a test image
  const testImages = [
    join(__dirname, 'public', 'photo_6050851829458864903_y.jpg'),
    join(__dirname, 'public', 'enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png'),
  ];
  
  let imagePath = null;
  for (const path of testImages) {
    if (existsSync(path)) {
      imagePath = path;
      break;
    }
  }
  
  if (!imagePath) {
    console.error('❌ No test image found in public folder');
    console.error('   Please provide an image file path as argument');
    console.error('   Usage: node test-edge-function.mjs <path-to-image>');
    process.exit(1);
  }
  
  console.log(`📷 Using test image: ${imagePath}`);
  
  try {
    // Convert image to base64
    console.log('\n📤 Converting image to base64...');
    const imageBase64 = imageToBase64(imagePath);
    const base64Data = imageBase64.split(',')[1]; // Remove data URL prefix
    console.log(`✅ Image converted (${base64Data.length} characters)`);
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n🚀 Invoking Edge Function: remove-background');
    console.log('⏳ This may take 10-30 seconds...\n');
    
    const startTime = Date.now();
    const { data, error, response } = await supabase.functions.invoke('remove-background', {
      body: { imageBase64: base64Data }
    });
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error('\n❌ Edge Function Error:');
      console.error('   Message:', error.message);
      console.error('   Name:', error.name);
      
      // Try to get response body if available
      if (response) {
        try {
          const errorText = await response.text();
          console.error('   Response body:', errorText);
        } catch (e) {
          console.error('   Status:', response.status, response.statusText);
        }
      }
      
      if (error.message?.includes('Function not found') || error.message?.includes('404')) {
        console.error('\n💡 The Edge Function might not be deployed yet.');
        console.error('   Deploy it using: supabase functions deploy remove-background');
      } else if (error.message?.includes('500') || error.message?.includes('remove.bg')) {
        console.error('\n💡 Edge Function exists but has an internal error.');
        console.error('   Check Edge Function logs in Supabase Dashboard');
        console.error('   The function might be missing REMOVE_BG_API_KEY environment variable');
      }
      return;
    }
    
    console.log(`\n✅ Edge Function completed in ${duration}ms`);
    console.log('\n📥 Response received:');
    
    if (data?.imageBase64) {
      console.log('🎉 Success! Edge Function returned processed image (base64)');
      console.log(`   Image length: ${data.imageBase64.length} characters`);
      console.log(`   Format: ${data.imageBase64.substring(0, 20)}...`);
      
      // Test if we can convert it to a blob (simulating what the app would do)
      console.log('\n🧪 Testing base64 to blob conversion...');
      const base64Only = data.imageBase64.split(',')[1] || data.imageBase64;
      const binaryString = Buffer.from(base64Only, 'base64');
      console.log(`✅ Blob size: ${binaryString.length} bytes`);
      
      console.log('\n✅ Edge Function is working correctly!');
      console.log('   The processed image can be uploaded to Supabase Storage');
    } else if (data?.publicUrl) {
      console.log('🎉 Success! Edge Function returned a public URL:');
      console.log('   URL:', data.publicUrl);
    } else if (data?.success) {
      console.log('✅ Edge Function executed successfully');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('⚠️  Edge Function responded but format is unexpected');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (err) {
    console.error('\n❌ Error testing Edge Function:');
    console.error('   Error:', err.message);
    if (err.stack) {
      console.error('   Stack:', err.stack.split('\n').slice(0, 3).join('\n'));
    }
  }
}

// Allow image path as command line argument
const imageArg = process.argv[2];
if (imageArg && existsSync(imageArg)) {
  testEdgeFunction = async () => {
    const env = loadEnv();
    const SUPABASE_URL = env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const imageBase64 = imageToBase64(imageArg);
    const base64Data = imageBase64.split(',')[1];
    console.log('🧪 Testing with provided image:', imageArg);
    const { data, error } = await supabase.functions.invoke('remove-background', {
      body: { imageBase64: base64Data }
    });
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success!', data?.imageBase64 ? 'Got processed image' : 'Response:', data);
    }
  };
}

testEdgeFunction();

