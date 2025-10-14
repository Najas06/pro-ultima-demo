/**
 * Link Staff to Supabase Auth Users
 * 
 * This script automatically creates Supabase Auth users for all staff
 * and links them via the auth_user_id column.
 * 
 * Usage:
 * 1. Set environment variables in .env.local:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 
 * 2. Run: npx tsx scripts/link-staff-to-auth.ts
 * 
 * Note: Make sure your .env.local file is in the project root
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]*)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Please ensure .env.local contains:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY // Use service role key for admin operations
);

async function linkStaffToAuth() {
  console.log('🔗 Starting staff-to-auth linking process...\n');

  // Get all staff without auth_user_id
  const { data: staffList, error: fetchError } = await supabase
    .from('staff')
    .select('*')
    .is('auth_user_id', null);

  if (fetchError) {
    console.error('❌ Error fetching staff:', fetchError);
    return;
  }

  if (!staffList || staffList.length === 0) {
    console.log('✅ All staff are already linked to auth users!');
    return;
  }

  console.log(`📋 Found ${staffList.length} staff members to link\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const staff of staffList) {
    try {
      console.log(`Processing: ${staff.email}...`);

      // Create auth user
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: staff.email,
        password: 'ChangeMe123!', // Temporary password - user should change on first login
        email_confirm: true,
        user_metadata: {
          name: staff.name,
          role: staff.role,
        },
      });

      if (createError) {
        console.error(`  ❌ Failed to create auth user: ${createError.message}`);
        errorCount++;
        continue;
      }

      // Link staff to auth user
      const { error: updateError } = await supabase
        .from('staff')
        .update({ auth_user_id: authUser.user.id })
        .eq('id', staff.id);

      if (updateError) {
        console.error(`  ❌ Failed to link staff: ${updateError.message}`);
        errorCount++;
        continue;
      }

      console.log(`  ✅ Linked ${staff.email} to auth user ${authUser.user.id}`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Error processing ${staff.email}:`, err);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`  ✅ Successfully linked: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log('\n⚠️  IMPORTANT: All staff should change their password on first login!');
    console.log('   Default password: ChangeMe123!');
  }
}

// Run the script
linkStaffToAuth()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

