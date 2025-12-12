import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envPath = join(__dirname, '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  
  const lines = envContent.split('\n');
  const openRouterLine = lines.find(line => line.includes('VITE_OPENROUTER_API_KEY'));
  
  if (!openRouterLine) {
    console.log('❌ VITE_OPENROUTER_API_KEY not found in .env');
    process.exit(1);
  }
  
  const match = openRouterLine.match(/VITE_OPENROUTER_API_KEY=(.+)/);
  if (!match) {
    console.log('❌ Invalid format for VITE_OPENROUTER_API_KEY');
    process.exit(1);
  }
  
  const key = match[1].trim();
  
  console.log('\n📋 OpenRouter API Key Status:');
  console.log('─'.repeat(50));
  console.log(`Variable: VITE_OPENROUTER_API_KEY`);
  console.log(`Value: ${key.substring(0, 15)}...${key.substring(key.length - 4)}`);
  console.log(`Length: ${key.length} characters`);
  console.log(`Is Placeholder: ${key === 'your_openrouter_api_key_here' ? 'YES ❌' : 'NO ✅'}`);
  console.log(`Is Empty: ${key === '' ? 'YES ❌' : 'NO ✅'}`);
  console.log(`Meets Length Requirement (>=20): ${key.length >= 20 ? 'YES ✅' : 'NO ❌'}`);
  console.log('─'.repeat(50));
  
  if (key === 'your_openrouter_api_key_here' || key === '' || key.length < 20) {
    console.log('\n❌ API key is not properly configured!');
    console.log('\nTo fix:');
    console.log('1. Open your .env file');
    console.log('2. Find: VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here');
    console.log('3. Replace with: VITE_OPENROUTER_API_KEY=sk-or-v1-YOUR_ACTUAL_KEY_HERE');
    console.log('4. Restart your dev server (npm run dev)');
    process.exit(1);
  } else {
    console.log('\n✅ API key appears to be configured correctly!');
    console.log('⚠️  If you still see errors, make sure to restart your dev server.');
  }
} catch (error) {
  console.error('Error reading .env file:', error.message);
  process.exit(1);
}
