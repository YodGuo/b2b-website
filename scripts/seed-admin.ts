/**
 * 管理员 Seed 脚本
 *
 * 使用方法（需要先启动 dev server）：
 *   npm run dev  (在另一个终端)
 *   npx tsx scripts/seed-admin.ts
 *
 * 或者直接调用 API：
 *   curl -X POST https://cms.xxxx.com/api/admin/seed \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer YOUR_BETTER_AUTH_SECRET" \
 *     -d '{"email":"admin@xxx.com","password":"yourpassword","name":"Admin"}'
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

function loadEnvVars(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.dev.vars');
  const env: Record<string, string> = {};

  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        env[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim();
      }
    }
  } catch {
    console.warn('⚠ .dev.vars not found, using process.env');
  }

  return { ...process.env, ...env } as Record<string, string>;
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

async function main() {
  const env = loadEnvVars();

  if (!env.BETTER_AUTH_SECRET) {
    console.error('❌ BETTER_AUTH_SECRET not set in .dev.vars');
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const email = await question(rl, '📧 Admin email: ');
  const password = await question(rl, '🔑 Admin password (min 8 chars): ');
  const name = await question(rl, '👤 Admin name (default: Admin): ');
  rl.close();

  if (!email || !password) {
    console.error('❌ Email and password are required');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  const baseUrl = env.BETTER_AUTH_URL || 'http://localhost:4321';

  console.log('\n🔧 Creating admin user...');
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${name || 'Admin'}`);
  console.log(`   Target: ${baseUrl}/api/admin/seed`);

  try {
    const response = await fetch(`${baseUrl}/api/admin/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.BETTER_AUTH_SECRET}`,
      },
      body: JSON.stringify({ email, password, name: name || 'Admin' }),
    });

    const data = await response.json() as any;

    if (response.ok) {
      console.log('\n✅ Admin user created successfully!');
      console.log(`   ID: ${data.user?.id}`);
      console.log(`   Email: ${data.user?.email}`);
      console.log(`   Name: ${data.user?.name}`);
      console.log('\n👉 You can now log in at /admin/login');
    } else {
      console.error(`\n❌ Failed: ${data.error}`);
      if (response.status === 409) {
        console.log('   Hint: User may already exist. Try a different email.');
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Connection failed. Make sure the dev server is running:');
    console.error('   npm run dev');
    console.error(`\n   Error: ${error}`);
    process.exit(1);
  }
}

main();
