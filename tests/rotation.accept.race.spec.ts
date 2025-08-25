// Race condition tests for atomic accept operations
import { resetDb, createSkill, createDeveloper, createProject } from './helpers';
import { RotationService } from '@/core/services/rotation.service';
import { prisma } from '@/core/database/db';

beforeEach(async () => {
  await resetDb();
});

describe('RotationService.acceptCandidate Race Conditions', () => {
  it('only one developer can first-accept under race condition', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    // Create multiple developers
    const developers = [];
    for (let i = 0; i < 5; i++) {
      developers.push(await createDeveloper(i, 'MID', [js.id]));
    }

    const batch = await RotationService.generateBatch(project.id);

    // Get first two candidates
    const candidates = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch.batchId },
      take: 2,
      include: {
        developer: {
          include: { user: true }
        }
      }
    });

    expect(candidates.length).toBe(2);

    // Simulate concurrent accept attempts
    const acceptPromise1 = RotationService.acceptCandidate(
      candidates[0].id, 
      candidates[0].developer.user.id
    );
    
    const acceptPromise2 = RotationService.acceptCandidate(
      candidates[1].id, 
      candidates[1].developer.user.id
    );

    const results = await Promise.allSettled([acceptPromise1, acceptPromise2]);

    // Exactly one should succeed, one should fail
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    expect(successful.length).toBe(1);
    expect(failed.length).toBe(1);

    // Verify project state
    const projectAfter = await prisma.project.findUnique({
      where: { id: project.id }
    });
    expect(projectAfter?.status).toBe('accepted');
    expect(projectAfter?.contactRevealEnabled).toBe(true);
    expect(projectAfter?.contactRevealedDeveloperId).toBeDefined();

    // Verify batch is completed
    const batchAfter = await prisma.assignmentBatch.findUnique({
      where: { id: batch.batchId }
    });
    expect(batchAfter?.status).toBe('completed');

    // Verify exactly one candidate is accepted and marked as first
    const candidatesAfter = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch.batchId }
    });
    
    const acceptedCandidates = candidatesAfter.filter(c => c.responseStatus === 'accepted');
    const firstAcceptedCandidates = candidatesAfter.filter(c => c.isFirstAccepted);
    
    expect(acceptedCandidates.length).toBe(1);
    expect(firstAcceptedCandidates.length).toBe(1);
    expect(acceptedCandidates[0].id).toBe(firstAcceptedCandidates[0].id);
  });

  it('prevents accept when project already accepted by another developer', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    const developers = [];
    for (let i = 0; i < 3; i++) {
      developers.push(await createDeveloper(i, 'MID', [js.id]));
    }

    const batch = await RotationService.generateBatch(project.id);
    const candidates = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch.batchId },
      include: {
        developer: { include: { user: true } }
      }
    });

    // First developer accepts
    await RotationService.acceptCandidate(
      candidates[0].id,
      candidates[0].developer.user.id
    );

    // Second developer tries to accept - should fail
    await expect(
      RotationService.acceptCandidate(
        candidates[1].id,
        candidates[1].developer.user.id
      )
    ).rejects.toThrow(/Cannot accept candidate from completed batch/);
  });

  it('handles concurrent accepts on same candidate gracefully', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    const dev = await createDeveloper(1, 'MID', [js.id]);
    const batch = await RotationService.generateBatch(project.id);
    
    const candidate = await prisma.assignmentCandidate.findFirst({
      where: { 
        batchId: batch.batchId,
        developerId: dev.dp.id
      },
      include: {
        developer: { include: { user: true } }
      }
    });

    expect(candidate).toBeTruthy();

    // Try to accept the same candidate twice simultaneously
    const promise1 = RotationService.acceptCandidate(candidate!.id, dev.user.id);
    const promise2 = RotationService.acceptCandidate(candidate!.id, dev.user.id);

    const results = await Promise.allSettled([promise1, promise2]);

    // One should succeed, one should fail
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    expect(successful.length).toBe(1);
    expect(failed.length).toBe(1);

    // The failure should be due to candidate no longer being pending
    const failedResult = failed[0] as PromiseRejectedResult;
    // In high contention, a deadlock error can occur from the project claim step
    expect(failedResult.reason.message).toMatch(/no longer pending|already taken|deadlock/i);
  });

  it('prevents accept when batch is no longer current', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    const dev = await createDeveloper(1, 'MID', [js.id]);
    
    // Generate first batch
    const batch1 = await RotationService.generateBatch(project.id);
    const candidate1 = await prisma.assignmentCandidate.findFirst({
      where: { 
        batchId: batch1.batchId,
        developerId: dev.dp.id
      }
    });

    // Create another developer and refresh batch
    await createDeveloper(2, 'MID', [js.id]);
    await RotationService.refreshBatch(project.id);

    // Try to accept candidate from old batch (should be invalidated)
    await expect(
      RotationService.acceptCandidate(candidate1!.id, dev.user.id)
    ).rejects.toThrow(/Cannot accept candidate with status: invalidated/);
  });

  it('maintains data consistency under high concurrent load', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    // Create many developers
    const developers = [];
    for (let i = 0; i < 10; i++) {
      developers.push(await createDeveloper(i, 'MID', [js.id]));
    }

    const batch = await RotationService.generateBatch(project.id);
    const candidates = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch.batchId },
      include: {
        developer: { include: { user: true } }
      }
    });

    // All developers try to accept their assignments simultaneously
    const acceptPromises = candidates.map(candidate =>
      RotationService.acceptCandidate(candidate.id, candidate.developer.user.id)
    );

    const results = await Promise.allSettled(acceptPromises);

    // Exactly one should succeed
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    expect(successful.length).toBe(1);
    expect(failed.length).toBe(candidates.length - 1);

    // Verify final state consistency
    const finalProject = await prisma.project.findUnique({
      where: { id: project.id }
    });
    expect(finalProject?.status).toBe('accepted');
    expect(finalProject?.contactRevealEnabled).toBe(true);

    const finalBatch = await prisma.assignmentBatch.findUnique({
      where: { id: batch.batchId }
    });
    expect(finalBatch?.status).toBe('completed');

    const finalCandidates = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch.batchId }
    });
    
    const acceptedCount = finalCandidates.filter(c => c.responseStatus === 'accepted').length;
    const firstAcceptedCount = finalCandidates.filter(c => c.isFirstAccepted).length;
    
    expect(acceptedCount).toBe(1);
    expect(firstAcceptedCount).toBe(1);
  });

  it('handles race between accept and expire correctly', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    const dev = await createDeveloper(1, 'MID', [js.id]);
    const batch = await RotationService.generateBatch(project.id);
    
    const candidate = await prisma.assignmentCandidate.findFirst({
      where: { 
        batchId: batch.batchId,
        developerId: dev.dp.id
      }
    });

    // Set deadline to past
    await prisma.assignmentCandidate.update({
      where: { id: candidate!.id },
      data: { acceptanceDeadline: new Date(Date.now() - 1000) }
    });

    // Try to accept and expire simultaneously
    const acceptPromise = RotationService.acceptCandidate(candidate!.id, dev.user.id);
    const expirePromise = RotationService.expirePendingCandidates();

    const results = await Promise.allSettled([acceptPromise, expirePromise]);

    // Either accept succeeds or expire succeeds, but not both
    const candidateAfter = await prisma.assignmentCandidate.findUnique({
      where: { id: candidate!.id }
    });

    expect(['accepted', 'expired']).toContain(candidateAfter?.responseStatus);
    
    // If accepted, project should be in accepted state
    if (candidateAfter?.responseStatus === 'accepted') {
      const projectAfter = await prisma.project.findUnique({
        where: { id: project.id }
      });
      expect(projectAfter?.status).toBe('accepted');
    }
  });
});
