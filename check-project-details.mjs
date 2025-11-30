// Check AdGenie project details
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
const SUPABASE_ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'aciqulnrrllslassbgox'; // AdGenie project

async function checkProject() {
  console.log('🔍 Checking AdGenie project details...\n');

  try {
    // Get project details
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const project = await response.json();

    console.log('📊 Project Details:');
    console.log('='.repeat(60));
    console.log(`Name: ${project.name}`);
    console.log(`ID: ${project.id}`);
    console.log(`Reference: ${project.ref}`);
    console.log(`Region: ${project.region}`);
    console.log(`Status: ${project.status}`);
    console.log(`Created: ${new Date(project.created_at).toLocaleString()}`);
    
    if (project.database) {
      console.log(`\n💾 Database:`);
      console.log(`   Version: ${project.database.version || 'N/A'}`);
      console.log(`   Size: ${project.database.size || 'N/A'}`);
    }

    if (project.organization_id) {
      console.log(`\n🏢 Organization ID: ${project.organization_id}`);
    }

    console.log(`\n🔗 URLs:`);
    console.log(`   API: https://${project.ref}.supabase.co`);
    console.log(`   Dashboard: https://supabase.com/dashboard/project/${project.ref}`);

    // Try to get database info
    console.log(`\n📈 Additional Info:`);
    if (project.plan) {
      console.log(`   Plan: ${project.plan.name || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProject();




















