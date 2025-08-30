// @ts-nocheck
// Test helpers for database seeding
import { prisma } from '@/core/database/db';
import { DevLevel, ProjectStatus, BatchStatus, ResponseStatus } from '@prisma/client';

export async function resetDb() {
  // Clean up data between tests
  // Note: Order matters due to foreign key constraints
  await prisma.assignmentCandidate.deleteMany({});
  // Unlink current batch from projects to avoid relation violations
  await prisma.project.updateMany({ data: { currentBatchId: null } });
  await prisma.assignmentBatch.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.contactRevealEvent.deleteMany({});
  await (prisma as any).rotationCursor.deleteMany({});
  await prisma.developerSkill.deleteMany({});
  await prisma.developerProfile.deleteMany({});
  await prisma.clientProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.reviewsAggregate.deleteMany({});
  
  console.log('🧹 Database reset completed');
}

export async function createSkill(id: string, name = id, category = 'General') {
  return prisma.skill.upsert({ 
    where: { name }, // Use name instead of id for unique constraint
    update: {}, 
    create: { 
      name, 
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'), 
      category,
      keywords: [name.toLowerCase()]
    } 
  });
}

export async function createUser(email: string, name = 'Test User') {
  return prisma.user.create({ 
    data: { 
      email, 
      name,
      emailVerified: new Date(),
    } 
  });
}

export async function createClient(userId: string) {
  return prisma.clientProfile.create({ 
    data: { 
      userId,
      companyName: 'Test Company',
    } 
  });
}

export async function createDeveloper(
  userIdx: number,
  level: DevLevel,
  skillIds: string[],
  opts: Partial<{ 
    approved: boolean; 
    status: 'available' | 'checking' | 'busy';
    email?: string;
    name?: string;
  }> = {}
) {
  const RUN_ID = (global as any).__TEST_RUN_ID__ || ((global as any).__TEST_RUN_ID__ = Date.now().toString());
  const email = opts.email || `dev${userIdx}-${RUN_ID}@test.com`;
  const name = opts.name || `Developer ${userIdx}`;
  
  const user = await createUser(email, name);
  
  // Create ReviewsAggregate first (required for DeveloperProfile)
  const reviewsSummary = await prisma.reviewsAggregate.create({
    data: {
      averageRating: 0,
      totalReviews: 0,
    },
  });
  
  const dp = await prisma.developerProfile.create({
    data: {
      userId: user.id,
      level,
      adminApprovalStatus: opts.approved === false ? 'pending' : 'approved',
      currentStatus: opts.status ?? 'available',
      reviewsSummaryId: reviewsSummary.id,
    }
  });
  
  // Add skills
  for (const skillId of skillIds) {
    await prisma.developerSkill.create({ 
      data: { 
        developerProfileId: dp.id, 
        skillId,
        years: level === 'FRESHER' ? 1 : level === 'MID' ? 3 : 5,
        rating: 0,
      } 
    });
  }
  
  return { user, dp, reviewsSummary };
}

export async function createProject(
  clientEmail: string, 
  skillsRequired: string[],
  opts: Partial<{
    title: string;
    description: string;
    status: ProjectStatus;
    budget: number;
  }> = {}
) {
  const RUN_ID = (global as any).__TEST_RUN_ID__ || ((global as any).__TEST_RUN_ID__ = Date.now().toString());
  const emailWithRun = clientEmail.includes('@') ? clientEmail.replace('@', `+${RUN_ID}@`) : `${clientEmail}-${RUN_ID}@test.com`;
  const user = await createUser(emailWithRun, 'Test Client');
  const client = await createClient(user.id);
  
  return prisma.project.create({
    data: {
      clientId: client.id,
      title: opts.title || 'Test Project',
      description: opts.description || 'Test project description',
      skillsRequired,
      status: (opts.status ?? 'submitted') as ProjectStatus,
      // Minimal fields only; schema does not have `budget`
    }
  });
}

export async function createBatch(projectId: string, opts: Partial<{
  status: BatchStatus;
  number: number;
}> = {}) {
  return prisma.assignmentBatch.create({
    data: {
      projectId,
      batchNumber: opts.number || 1,
      status: (opts.status ?? 'active') as BatchStatus,
      selection: {
        fresherCount: 5,
        midCount: 5,
        expertCount: 3,
      },
    }
  });
}

export async function createCandidate(
  batchId: string,
  developerId: string,
  opts: Partial<{
    status: ResponseStatus;
    deadline: Date;
    level: DevLevel;
    skillIds: string[];
  }> = {}
) {
  const deadline = opts.deadline || new Date(Date.now() + 15 * 60 * 1000); // 15 min from now
  const batch = await prisma.assignmentBatch.findUnique({
    where: { id: batchId },
    select: { projectId: true }
  });
  
  return prisma.assignmentCandidate.create({
    data: {
      batchId,
      projectId: batch!.projectId,
      developerId,
      level: opts.level || 'MID',
      // skillIds are not stored on candidate in current schema
      usualResponseTimeMsSnapshot: 60000, // 1 minute
      statusTextForClient: 'developer is checking',
      assignedAt: new Date(),
      acceptanceDeadline: deadline,
      responseStatus: (opts.status ?? 'pending') as ResponseStatus,
      isFirstAccepted: false,
    }
  });
}

export async function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to assert database state
export async function getProjectState(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
  });
}

export async function getCandidateState(candidateId: string) {
  return prisma.assignmentCandidate.findUnique({
    where: { id: candidateId },
    include: {
      batch: true,
      developer: {
        include: { user: true }
      }
    }
  });
}
