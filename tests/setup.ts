// @ts-nocheck
// Global test setup
import { beforeAll, afterAll } from '@jest/globals';
import { config } from 'dotenv';

// Load environment variables first
config();

// Ensure test environment variables are loaded (NODE_ENV set via Jest runner/CLI)
// Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not found in environment');
}

// Required for auth but not used in tests
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";

// Mock values for services not tested
process.env.WHATSAPP_TOKEN = "test-token";
process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "test-webhook-token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id";

console.log('🔧 Test DATABASE_URL:', process.env.DATABASE_URL);

beforeAll(async () => {
  // Any global setup can go here
  console.log('🔧 Test environment initialized');
});

afterAll(async () => {
  // Any global cleanup can go here
  console.log('🧹 Test environment cleaned up');
});
