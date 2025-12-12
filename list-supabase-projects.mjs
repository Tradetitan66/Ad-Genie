// list-supabase-projects.mjs
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
    envFile.split('\n').forEach((line, index) => {
      const cleanLine = line.split('#')[0].trim();
      if (!cleanLine) return;
      // Match KEY=value (with or without quotes, handle values with underscores)
      const match = cleanLine.match(/^([^=]+)=(.+)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove surrounding quotes if present
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

const env = loadEnv();
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN || '';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('\n❌ SUPABASE_ACCESS_TOKEN not found!');
  console.error('   Make sure it\'s set in your .env file as:');
  console.error('   SUPABASE_ACCESS_TOKEN=sbp_...');
  process.exit(1);
}

async function listProjects() {
  console.log('🔍 Fetching your Supabase projects...\n');

  try {
    const response = await fetch('https://api.supabase.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || error.error || `HTTP ${response.status}`;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const projects = await response.json();

    if (!projects || projects.length === 0) {
      console.log('📭 No projects found in your account.');
      return;
    }

    console.log(`✅ Found ${projects.length} project(s):\n`);
    console.log('='.repeat(80));

    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. Project: ${project.name || 'Unnamed'}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Reference: ${project.ref || 'N/A'}`);
      console.log(`   Organization: ${project.organization_name || 'N/A'}`);
      console.log(`   Region: ${project.region || 'N/A'}`);
      console.log(`   Status: ${project.status || 'Unknown'}`);
      console.log(`   Created: ${project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}`);
      
      if (project.kps_enabled) {
        console.log(`   🔐 KPS Enabled: Yes`);
      }
      
      if (project.database) {
        console.log(`   💾 Database: ${project.database.version || 'N/A'}`);
      }
      
      if (project.ref) {
        console.log(`   🔗 URL: https://${project.ref}.supabase.co`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Summary: ${projects.length} total project(s)`);
    
    // Show which project is currently configured
    const currentUrl = env.VITE_SUPABASE_URL;
    if (currentUrl && currentUrl !== 'your_supabase_project_url') {
      const currentRef = currentUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
      if (currentRef) {
        const currentProject = projects.find(p => p.ref === currentRef);
        if (currentProject) {
          console.log(`\n🎯 Currently configured in this app: "${currentProject.name}" (${currentRef})`);
        } else {
          console.log(`\n⚠️  Configured project (${currentRef}) not found in your account`);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error fetching projects:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify your access token is correct');
    console.error('   2. Make sure token starts with "sbp_"');
    console.error('   3. Check if token has expired');
    console.error('   4. Verify you have internet connection');
    process.exit(1);
  }
}

listProjects();

