import { env } from "@/core/config/env.mjs";

export function checkEnvironmentVariables() {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ];

  const missingVars: string[] = [];
  const presentVars: string[] = [];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    } else {
      presentVars.push(varName);
    }
  });

  return {
    missing: missingVars,
    present: presentVars,
    allPresent: missingVars.length === 0,
  };
}

export function logEnvironmentStatus() {
  const status = checkEnvironmentVariables();
  
  console.log('🔍 Environment Variables Status:');
  console.log('✅ Present:', status.present);
  
  if (status.missing.length > 0) {
    console.log('❌ Missing:', status.missing);
    console.log('⚠️  Some required environment variables are missing!');
  } else {
    console.log('✅ All required environment variables are present');
  }
  
  return status;
}

// Check if we're in a server environment
export function isServerEnvironment() {
  return typeof window === 'undefined';
}

// Safe environment variable access
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value || defaultValue || '';
}
