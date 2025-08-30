// @ts-nocheck
import { spawn } from 'child_process';

const CRON_SECRET = process.env.CRON_SECRET || 'test-secret';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Cron job configurations
const cronJobs = [
  {
    name: 'expire-candidates',
    path: '/api/cron/expire-candidates',
    interval: 60 * 1000, // 1 minute
    description: 'Expire candidates that have passed their deadline'
  },
  {
    name: 'reconcile-subscriptions',
    path: '/api/cron/reconcile-subscriptions',
    interval: 5 * 60 * 1000, // 5 minutes
    description: 'Reconcile subscription states with PayPal'
  }
];

function runCronJob(job: typeof cronJobs[0]) {
  const url = `${BASE_URL}${job.path}`;
  
  console.log(`🔄 Running ${job.name}...`);
  
  const curl = spawn('curl', [
    '-X', 'POST',
    url,
    '-H', 'Content-Type: application/json',
    '-H', `Authorization: Bearer ${CRON_SECRET}`,
    '-s' // Silent mode
  ]);

  let output = '';
  let errorOutput = '';

  curl.stdout.on('data', (data) => {
    output += data.toString();
  });

  curl.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  curl.on('close', (code) => {
    if (code === 0) {
      try {
        const result = JSON.parse(output);
        if (result.success) {
          console.log(`✅ ${job.name} completed successfully`);
          if (result.data?.expiredCount !== undefined) {
            console.log(`   Expired candidates: ${result.data.expiredCount}`);
          }
          if (result.data?.processed !== undefined) {
            console.log(`   Processed subscriptions: ${result.data.processed}`);
          }
        } else {
          console.log(`❌ ${job.name} failed: ${result.error}`);
        }
      } catch (e) {
        console.log(`❌ ${job.name} failed to parse response: ${output}`);
      }
    } else {
      console.log(`❌ ${job.name} failed with code ${code}: ${errorOutput}`);
    }
  });
}

function startCronJobs() {
  console.log('🚀 Starting local cron jobs...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Cron Secret: ${CRON_SECRET}`);
  console.log('');
  
  cronJobs.forEach(job => {
    console.log(`⏰ Scheduling ${job.name}: ${job.description}`);
    console.log(`   Interval: ${job.interval / 1000} seconds`);
    console.log(`   Endpoint: ${job.path}`);
    console.log('');
    
    // Run immediately
    runCronJob(job);
    
    // Schedule recurring runs
    setInterval(() => {
      runCronJob(job);
    }, job.interval);
  });
  
  console.log('✅ All cron jobs scheduled and running!');
  console.log('💡 Press Ctrl+C to stop');
  console.log('');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping cron jobs...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping cron jobs...');
  process.exit(0);
});

// Start the cron jobs
startCronJobs();
