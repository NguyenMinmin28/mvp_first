// Tests for security guards and business rule enforcement
import { resetDb, createSkill, createDeveloper, createProject } from './helpers';
import { RotationService } from '@/core/services/rotation.service';
import { prisma } from '@/core/database/db';

beforeEach(async () => {
  await resetDb();
});

describe('RotationService Security Guards', () => {
  describe('Self-Assignment Prevention', () => {
    it('blocks developer from accepting their own project', async () => {
      const js = await createSkill('js', 'JavaScript');
      
      // Create a user who is both client and developer
      const user = await prisma.user.create({
        data: {
          email: 'selfuser@test.com',
          name: 'Self User'
        }
      });

      // Create client profile
      const client = await prisma.clientProfile.create({
        data: {
          userId: user.id,
          companyName: 'Self Company'
        }
      });

      // Create project
      const project = await prisma.project.create({
        data: {
          clientId: client.id,
          title: 'Self Project',
          description: 'Test',
          skillsRequired: [js.id],
          status: 'submitted',
        }
      });

      // Create developer profile for same user
      const reviewsSummary = await prisma.reviewsAggregate.create({
        data: { averageRating: 0, totalReviews: 0 }
      });
      
      const developerProfile = await prisma.developerProfile.create({
        data: {
          userId: user.id,
          level: 'MID',
          adminApprovalStatus: 'approved',
          currentStatus: 'available',
          reviewsSummaryId: reviewsSummary.id,
        }
      });

      await prisma.developerSkill.create({
        data: {
          developerProfileId: developerProfile.id,
          skillId: js.id,
          years: 3,
          rating: 0,
        }
      });

      // Create other developers to generate a valid batch
      for (let i = 0; i < 5; i++) {
        await createDeveloper(i, 'MID', [js.id]);
      }

      const batch = await RotationService.generateBatch(project.id);
      
      // Try to find self-candidate (shouldn't exist due to filtering)
      const selfCandidate = await prisma.assignmentCandidate.findFirst({
        where: { 
          batchId: batch.batchId,
          developerId: developerProfile.id
        }
      });

      // Self should not be included in candidates
      expect(selfCandidate).toBeNull();
    });

    it('blocks accept attempt with mismatched user ID', async () => {
      const js = await createSkill('js', 'JavaScript');
      const project = await createProject('client@test.com', [js.id]);
      
      const dev1 = await createDeveloper(1, 'MID', [js.id]);
      const dev2 = await createDeveloper(2, 'MID', [js.id]);
      
      const batch = await RotationService.generateBatch(project.id);
      const candidate = await prisma.assignmentCandidate.findFirst({
        where: { 
          batchId: batch.batchId,
          developerId: dev1.dp.id
        }
      });

      // dev2 tries to accept dev1's candidate
      await expect(
        RotationService.acceptCandidate(candidate!.id, dev2.user.id)
      ).rejects.toThrow(/You can only accept your own assignments/);
    });
  });

  describe('Deadline Enforcement', () => {
    it('blocks accept after deadline', async () => {
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
        data: { acceptanceDeadline: new Date(Date.now() - 60_000) }
      });

      await expect(
        RotationService.acceptCandidate(candidate!.id, dev.user.id)
      ).rejects.toThrow(/Acceptance deadline has passed/);
    });

    it('allows reject even after deadline (better UX)', async () => {
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
        data: { acceptanceDeadline: new Date(Date.now() - 60_000) }
      });

      // Reject should still work (better UX than strict deadline enforcement)
      const result = await RotationService.rejectCandidate(candidate!.id, dev.user.id);
      expect(result.success).toBe(true);

      const candidateAfter = await prisma.assignmentCandidate.findUnique({
        where: { id: candidate!.id }
      });
      expect(candidateAfter?.responseStatus).toBe('rejected');
    });
  });

  describe('Batch State Guards', () => {
    it('blocks accept from inactive batch', async () => {
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

      // Manually set batch to completed
      await prisma.assignmentBatch.update({
        where: { id: batch.batchId },
        data: { status: 'completed' }
      });

      await expect(
        RotationService.acceptCandidate(candidate!.id, dev.user.id)
      ).rejects.toThrow(/Cannot accept candidate from completed batch/);
    });

    it('blocks accept when batch is no longer current for project', async () => {
      const js = await createSkill('js', 'JavaScript');
      const project = await createProject('client@test.com', [js.id]);
      
      const dev = await createDeveloper(1, 'MID', [js.id]);
      const batch1 = await RotationService.generateBatch(project.id);
      
      const candidate = await prisma.assignmentCandidate.findFirst({
        where: { 
          batchId: batch1.batchId,
          developerId: dev.dp.id
        }
      });

      // Generate new batch (changes currentBatchId)
      await createDeveloper(2, 'MID', [js.id]);
      await RotationService.refreshBatch(project.id);

      await expect(
        RotationService.acceptCandidate(candidate!.id, dev.user.id)
      ).rejects.toThrow(/Cannot accept candidate with status: invalidated/);
    });
  });

  describe('Response Status Guards', () => {
    it('blocks accept on already responded candidate', async () => {
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

      // Manually set to rejected
      await prisma.assignmentCandidate.update({
        where: { id: candidate!.id },
        data: { 
          responseStatus: 'rejected',
          respondedAt: new Date()
        }
      });

      await expect(
        RotationService.acceptCandidate(candidate!.id, dev.user.id)
      ).rejects.toThrow(/Cannot accept candidate with status: rejected/);
    });

    it('blocks reject on already responded candidate', async () => {
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

      // Manually set to accepted
      await prisma.assignmentCandidate.update({
        where: { id: candidate!.id },
        data: { 
          responseStatus: 'accepted',
          respondedAt: new Date(),
          isFirstAccepted: true
        }
      });

      await expect(
        RotationService.rejectCandidate(candidate!.id, dev.user.id)
      ).rejects.toThrow(/Cannot reject candidate with status: accepted/);
    });

    it('blocks accept on candidate marked as first accepted', async () => {
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

      // Manually mark as first accepted (simulate race condition aftermath)
      await prisma.assignmentCandidate.update({
        where: { id: candidate!.id },
        data: { isFirstAccepted: true }
      });

      await expect(
        RotationService.acceptCandidate(candidate!.id, dev.user.id)
      ).rejects.toThrow(/This candidate has already been marked as first accepted/);
    });
  });

  describe('Project Status Guards', () => {
    it('blocks batch generation for completed projects', async () => {
      const js = await createSkill('js', 'JavaScript');
      const project = await createProject('client@test.com', [js.id], {
        status: 'completed'
      });

      await createDeveloper(1, 'MID', [js.id]);

      await expect(
        RotationService.generateBatch(project.id)
      ).rejects.toThrow(/Cannot generate batch for project with status: completed/);
    });

    it('allows batch generation for submitted and assigning projects', async () => {
      const js = await createSkill('js', 'JavaScript');
      
      const submittedProject = await createProject('client1@test.com', [js.id], {
        status: 'submitted'
      });
      
      const assigningProject = await createProject('client2@test.com', [js.id], {
        status: 'assigning'
      });

      // Create enough developers for two separate batches
      for (let i = 0; i < 10; i++) {
        await createDeveloper(i, 'MID', [js.id]);
      }

      // Both should work
      const batch1 = await RotationService.generateBatch(submittedProject.id, {
        midCount: 3,
        fresherCount: 0,
        expertCount: 0,
      });
      const batch2 = await RotationService.generateBatch(assigningProject.id, {
        midCount: 3,
        fresherCount: 0,
        expertCount: 0,
      });

      expect(batch1.batchId).toBeDefined();
      expect(batch2.batchId).toBeDefined();
    });
  });

  describe('Candidate Not Found Guards', () => {
    it('handles non-existent candidate gracefully', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      await expect(
        RotationService.acceptCandidate(fakeId, 'user-123')
      ).rejects.toThrow(/Candidate not found/);

      await expect(
        RotationService.rejectCandidate(fakeId, 'user-123')
      ).rejects.toThrow(/Candidate not found/);
    });
  });

  describe('Admin Approval Guards', () => {
    it('excludes non-approved developers from batch generation', async () => {
      const js = await createSkill('js', 'JavaScript');
      const project = await createProject('client@test.com', [js.id]);
      
      // Create developers with different approval statuses
      await createDeveloper(1, 'MID', [js.id], { approved: true });
      await createDeveloper(2, 'MID', [js.id], { approved: false }); // pending
      
      // Also test draft status
      const reviewsSummary = await prisma.reviewsAggregate.create({
        data: { averageRating: 0, totalReviews: 0 }
      });
      
      const user = await prisma.user.create({
        data: { email: 'draft@test.com', name: 'Draft User' }
      });
      
      const draftProfile = await prisma.developerProfile.create({
        data: {
          userId: user.id,
          level: 'MID',
          adminApprovalStatus: 'draft',
          currentStatus: 'available',
          reviewsSummaryId: reviewsSummary.id,
        }
      });

      await prisma.developerSkill.create({
        data: {
          developerProfileId: draftProfile.id,
          skillId: js.id,
          years: 3,
          rating: 0,
        }
      });

      const batch = await RotationService.generateBatch(project.id);
      
      // Should only include the approved developer
      expect(batch.candidates.length).toBe(1);
      
      const candidates = await prisma.assignmentCandidate.findMany({
        where: { batchId: batch.batchId },
        include: {
          developer: true
        }
      });

      for (const candidate of candidates) {
        expect(candidate.developer.adminApprovalStatus).toBe('approved');
      }
    });

    it('excludes busy developers from batch generation', async () => {
      const js = await createSkill('js', 'JavaScript');
      const project = await createProject('client@test.com', [js.id]);
      
      await createDeveloper(1, 'MID', [js.id], { status: 'available' });
      await createDeveloper(2, 'MID', [js.id], { status: 'checking' });
      await createDeveloper(3, 'MID', [js.id], { status: 'busy' }); // Should be excluded

      const batch = await RotationService.generateBatch(project.id);
      
      // Should only include available and checking developers
      expect(batch.candidates.length).toBe(2);
      
      const candidates = await prisma.assignmentCandidate.findMany({
        where: { batchId: batch.batchId },
        include: {
          developer: true
        }
      });

      for (const candidate of candidates) {
        expect(['available', 'checking']).toContain(candidate.developer.currentStatus);
      }
    });
  });
});
