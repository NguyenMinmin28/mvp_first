import { NextResponse } from "next/server";
import { checkEnvironmentVariables } from "@/core/utils/env-check";
import { prisma } from "@/core/database/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check environment variables
    const envStatus = checkEnvironmentVariables();
    
    // Test database connection
    let dbStatus = 'unknown';
    let dbError = null;
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
      dbError = error instanceof Error ? error.message : 'Unknown database error';
    }
    
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
      },
      variables: {
        allPresent: envStatus.allPresent,
        missing: envStatus.missing,
        present: envStatus.present,
      },
      database: {
        status: dbStatus,
        error: dbError,
      },
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    };
    
    // Return 200 if everything is healthy, 503 if there are issues
    const statusCode = envStatus.allPresent && dbStatus === 'connected' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
