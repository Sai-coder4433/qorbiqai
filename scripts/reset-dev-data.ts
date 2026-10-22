#!/usr/bin/env tsx
/**
 * SAFE DEVELOPMENT DATABASE RESET UTILITY
 * 
 * Rules:
 * 1. ONLY executes when NODE_ENV=development
 * 2. ONLY executes when DEV_RESET_ENABLED=true
 * 3. Never deletes production data
 */

import dotenv from 'dotenv';
dotenv.config();

import { reviewFlowStore } from '../server/reviewflow/store.ts';

async function main() {
  console.log('----------------------------------------------------');
  console.log('ReviewFlow AI — Safe Development Reset Utility');
  console.log('----------------------------------------------------');

  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const isEnabled = process.env.DEV_RESET_ENABLED === 'true';

  if (!isDev) {
    console.error('❌ ABORTED: Reset can only run in development environment (NODE_ENV=development).');
    process.exit(1);
  }

  if (!isEnabled) {
    console.error('❌ ABORTED: Safety lock engaged. Set DEV_RESET_ENABLED=true to allow dev reset.');
    console.error('   Run with: DEV_RESET_ENABLED=true npm run reset-dev-data');
    process.exit(1);
  }

  try {
    const result = reviewFlowStore.resetDevData();
    console.log('✅ ' + result.message);
    console.log('Database Initialized With:');
    console.log(`- Users: ${result.details.users} (Admin, Sales, Client)`);
    console.log(`- Businesses: ${result.details.businesses}`);
    console.log(`- QR Codes: ${result.details.qrCodes}`);
    console.log(`- CRM Leads: ${result.details.crmLeads}`);
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error executing reset:', err.message);
    process.exit(1);
  }
}

main();
