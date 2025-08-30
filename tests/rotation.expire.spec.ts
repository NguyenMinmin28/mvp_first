// Tests for auto-expire functionality
// @ts-nocheck
import { resetDb, createSkill, createDeveloper, createProject, createBatch, createCandidate } from './helpers';
import { RotationService } from '@/core/services/rotation.service';
import { ExpiryService } from '@/core/services/expiry.service';
import { prisma } from '@/core/database/db';

beforeEach(async () => {
  await resetDb();
});

describe('RotationService.expirePendingCandidates', () => {
  it('expires candidates past their deadline', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    // Create developers
    for (let i = 0; i < 5; i++) {
      await createDeveloper(i, 'FRESHER', [js.id]);
    }

    const batch = await RotationService.generateBatch(project.id);

    // Set all candidates to past deadline
    await prisma.assignmentCandidate.updateMany({
      where: { batchId: batch.batchId },
      data: { acceptanceDeadline: new Date(Date.now() - 60_000) } // 1 minute ago
    });

    const expiredCount = await RotationService.expirePendingCandidates();
    expect(expiredCount).toBeGreaterThan(0);

    // Verify all candidates are expired
    const candidatesAfter = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch.batchId }
    });

    for (const candidate of candidatesAfter) {
      expect(candidate.responseStatus).toBe('expired');
      expect(candidate.respondedAt).toBeTruthy(); // Should have respondedAt for stats
    }
  });

  it('does not expire candidates still within deadline', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    await createDeveloper(1, 'FRESHER', [js.id]);
    const batch = await RotationService.generateBatch(project.id);

    // Candidates should have future deadline by default
    const expiredCount = await RotationService.expirePendingCandidates();
    expect(expiredCount).toBe(0);

    // Verify candidates are still pending
    const candidatesAfter = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch.batchId }
    });

    for (const candidate of candidatesAfter) {
      expect(candidate.responseStatus).toBe('pending');
      expect(candidate.respondedAt).toBeNull();
    }
  });

  it('only expires pending candidates, not accepted/rejected ones', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    const developers = [];
    for (let i = 0; i < 3; i++) {
      developers.push(await createDeveloper(i, 'MID', [js.id]));
    }

    const batch = await RotationService.generateBatch(project.id);
    const candidates = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch.batchId }
    });

    // Manually set one to accepted, one to rejected
    await prisma.assignmentCandidate.update({
      where: { id: candidates[0].id },
      data: { 
        responseStatus: 'accepted',
        respondedAt: new Date(),
        isFirstAccepted: true
      }
    });

    await prisma.assignmentCandidate.update({
      where: { id: candidates[1].id },
      data: { 
        responseStatus: 'rejected',
        respondedAt: new Date()
      }
    });

    // Set all to past deadline
    await prisma.assignmentCandidate.updateMany({
      where: { batchId: batch.batchId },
      data: { acceptanceDeadline: new Date(Date.now() - 60_000) }
    });

    const expiredCount = await RotationService.expirePendingCandidates();
    expect(expiredCount).toBe(1); // Only the remaining pending one

    // Verify final states
    const candidatesAfter = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch.batchId },
      orderBy: { assignedAt: 'asc' }
    });

    expect(candidatesAfter[0].responseStatus).toBe('accepted');
    expect(candidatesAfter[1].responseStatus).toBe('rejected');
    expect(candidatesAfter[2].responseStatus).toBe('expired');
  });

  it('sets respondedAt for accurate response time statistics', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    await createDeveloper(1, 'MID', [js.id]);
    const batch = await RotationService.generateBatch(project.id);

    const beforeExpire = new Date();
    
    // Set to past deadline
    await prisma.assignmentCandidate.updateMany({
      where: { batchId: batch.batchId },
      data: { acceptanceDeadline: new Date(Date.now() - 60_000) }
    });

    await RotationService.expirePendingCandidates();

    const candidateAfter = await prisma.assignmentCandidate.findFirst({
      where: { batchId: batch.batchId }
    });

    expect(candidateAfter?.responseStatus).toBe('expired');
    expect(candidateAfter?.respondedAt).toBeTruthy();
    expect(candidateAfter!.respondedAt!.getTime()).toBeGreaterThanOrEqual(beforeExpire.getTime());
  });

  it('handles multiple batches and projects correctly', async () => {
    const js = await createSkill('js', 'JavaScript');
    
    // Create two projects with candidates
    const project1 = await createProject('client1@test.com', [js.id]);
    const project2 = await createProject('client2@test.com', [js.id]);
    
    for (let i = 0; i < 3; i++) {
      await createDeveloper(i, 'MID', [js.id]);
      await createDeveloper(100 + i, 'MID', [js.id]);
    }

    const batch1 = await RotationService.generateBatch(project1.id);
    const batch2 = await RotationService.generateBatch(project2.id);

    // Expire only batch1 candidates
    await prisma.assignmentCandidate.updateMany({
      where: { batchId: batch1.batchId },
      data: { acceptanceDeadline: new Date(Date.now() - 60_000) }
    });

    const expiredCount = await RotationService.expirePendingCandidates();
    
    // Should only expire batch1 candidates
    const batch1CandidatesAfter = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch1.batchId }
    });
    const batch2CandidatesAfter = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch2.batchId }
    });

    // All batch1 candidates should be expired
    for (const candidate of batch1CandidatesAfter) {
      expect(candidate.responseStatus).toBe('expired');
    }

    // All batch2 candidates should still be pending
    for (const candidate of batch2CandidatesAfter) {
      expect(candidate.responseStatus).toBe('pending');
    }

    expect(expiredCount).toBe(batch1CandidatesAfter.length);
  });
});

describe('ExpiryService', () => {
  it('wraps expirePendingCandidates with proper logging and metrics', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    await createDeveloper(1, 'MID', [js.id]);
    const batch = await RotationService.generateBatch(project.id);

    // Set to past deadline
    await prisma.assignmentCandidate.updateMany({
      where: { batchId: batch.batchId },
      data: { acceptanceDeadline: new Date(Date.now() - 60_000) }
    });

    const result = await ExpiryService.expirePendingCandidates();

    expect(result.expiredCount).toBeGreaterThan(0);
    expect(result.processedAt).toBeInstanceOf(Date);
    expect(result.processedAt.getTime()).toBeGreaterThan(Date.now() - 5000); // Within last 5 seconds
  });

  it('handles empty expiry runs gracefully', async () => {
    // No expired candidates
    const result = await ExpiryService.expirePendingCandidates();

    expect(result.expiredCount).toBe(0);
    expect(result.processedAt).toBeInstanceOf(Date);
  });
});

describe('Refresh and Expire Integration', () => {
  it('refresh invalidates old pending candidates before they can be accepted', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    const dev1 = await createDeveloper(1, 'MID', [js.id]);
    const dev2 = await createDeveloper(2, 'MID', [js.id]);
    // Add extra eligible developers so refresh can form a new batch without re-invites
    await createDeveloper(3, 'MID', [js.id]);
    await createDeveloper(4, 'MID', [js.id]);
    
    // Generate first batch
    const batch1 = await RotationService.generateBatch(project.id, {
      expertCount: 0,
      midCount: 2,
      fresherCount: 0,
    });
    const oldCandidate = await prisma.assignmentCandidate.findFirst({
      where: { 
        batchId: batch1.batchId,
        developerId: dev1.dp.id
      }
    });

    // Refresh batch
    await RotationService.refreshBatch(project.id);

    // Old candidate should be invalidated, not expired
    const oldCandidateAfter = await prisma.assignmentCandidate.findUnique({
      where: { id: oldCandidate!.id }
    });
    expect(oldCandidateAfter?.responseStatus).toBe('invalidated');

    // Try to accept invalidated candidate - should fail
    await expect(
      RotationService.acceptCandidate(oldCandidate!.id, dev1.user.id)
    ).rejects.toThrow();

    // Running expire on invalidated candidates should not change them
    await RotationService.expirePendingCandidates();
    
    const stillInvalidated = await prisma.assignmentCandidate.findUnique({
      where: { id: oldCandidate!.id }
    });
    expect(stillInvalidated?.responseStatus).toBe('invalidated');
  });
});
