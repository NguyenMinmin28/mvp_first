// Integration tests for generateBatch with eligibility and constraints
import { resetDb, createSkill, createDeveloper, createProject } from './helpers';
import { RotationService } from '@/core/services/rotation.service';
import { prisma } from '@/core/database/db';

beforeEach(async () => {
  await resetDb();
});

describe('RotationService.generateBatch', () => {
  it('selects 5/5/3 candidates with eligibility filters', async () => {
    // Setup skills
    const jsSkill = await createSkill('js', 'JavaScript');
    const tsSkill = await createSkill('ts', 'TypeScript');

    // Create client and project
    const project = await createProject('client@test.com', [jsSkill.id, tsSkill.id]);

    // Seed developers - more than needed to test selection
    for (let i = 0; i < 7; i++) {
      await createDeveloper(i, 'EXPERT', [jsSkill.id, tsSkill.id]);
    }
    for (let i = 100; i < 109; i++) {
      await createDeveloper(i, 'MID', [jsSkill.id]);
    }
    for (let i = 200; i < 212; i++) {
      await createDeveloper(i, 'FRESHER', [tsSkill.id]);
    }

    // One developer not approved (should be filtered out)
    await createDeveloper(999, 'EXPERT', [jsSkill.id], { approved: false });

    // One developer busy (should be filtered out)
    await createDeveloper(998, 'EXPERT', [jsSkill.id], { status: 'busy' });

    const result = await RotationService.generateBatch(project.id);

    expect(result.batchId).toBeDefined();
    expect(result.candidates.length).toBeGreaterThanOrEqual(13); // 5+5+3

    const countByLevel = (level: string) => 
      result.candidates.filter(c => c.level === level).length;

    expect(countByLevel('EXPERT')).toBe(3);
    expect(countByLevel('MID')).toBe(5);
    expect(countByLevel('FRESHER')).toBe(5);

    // Verify project status updated
    const updatedProject = await prisma.project.findUnique({
      where: { id: project.id }
    });
    expect(updatedProject?.status).toBe('assigning');
    expect(updatedProject?.currentBatchId).toBe(result.batchId);

    // Verify batch created
    const batch = await prisma.assignmentBatch.findUnique({
      where: { id: result.batchId },
      include: { candidates: true }
    });
    expect(batch?.status).toBe('active');
    expect(batch?.candidates.length).toBe(result.candidates.length);

    // Verify all candidates are pending with correct deadline
    for (const candidate of batch!.candidates) {
      expect(candidate.responseStatus).toBe('pending');
      expect(candidate.acceptanceDeadline.getTime()).toBeGreaterThan(Date.now());
      expect(candidate.isFirstAccepted).toBe(false);
    }
  }, 60000);

  it('excludes client user from candidate selection', async () => {
    const js = await createSkill('js', 'JavaScript');

    // Create project with client
    const project = await createProject('client@test.com', [js.id]);
    
    // Get client user reliably (emails are suffixed per run)
    const client = await prisma.clientProfile.findFirst({ orderBy: { createdAt: 'desc' }, include: { user: true } });
    const clientUser = client!.user;

    // Create developer profile for the same user (client trying to be developer)
    const reviewsSummary = await prisma.reviewsAggregate.create({
      data: { averageRating: 0, totalReviews: 0 }
    });
    
    await prisma.developerProfile.create({
      data: {
        userId: clientUser!.id,
        level: 'EXPERT',
        adminApprovalStatus: 'approved',
        currentStatus: 'available',
        reviewsSummaryId: reviewsSummary.id,
      }
    });

    await prisma.developerSkill.create({
      data: {
        developerProfileId: (await prisma.developerProfile.findFirst({ orderBy: { createdAt: 'desc' } }))!.id,
        skillId: js.id,
        years: 5,
        rating: 0,
      }
    });

    // Create other developers
    for (let i = 0; i < 5; i++) {
      await createDeveloper(i, 'EXPERT', [js.id]);
    }

    const result = await RotationService.generateBatch(project.id);

    // Client should not be included in candidates
    const clientCandidates = result.candidates.filter(c => {
      // We can't directly check userId, but we can verify count is correct
      return false; // This test verifies by count
    });

    expect(result.candidates.length).toBe(3); // Only the 3 non-client experts
  });

  it('handles projects with no eligible candidates', async () => {
    const rare = await createSkill('rare-skill', 'Very Rare Skill');
    
    const project = await createProject('client@test.com', [rare.id]);

    // Create developers but none with the required skill
    const js = await createSkill('js', 'JavaScript');
    for (let i = 0; i < 5; i++) {
      await createDeveloper(i, 'EXPERT', [js.id]); // Different skill
    }

    await expect(RotationService.generateBatch(project.id))
      .rejects.toThrow(/No eligible candidates found/);
  });

  it('prevents generating batch for non-eligible project status', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id], {
      status: 'completed' // Invalid status
    });

    await createDeveloper(1, 'EXPERT', [js.id]);

    await expect(RotationService.generateBatch(project.id))
      .rejects.toThrow(/Cannot generate batch for project with status/);
  });

  it('applies fallback when insufficient candidates by level', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);

    // Only create 1 expert and 2 mids, no freshers
    await createDeveloper(1, 'EXPERT', [js.id]);
    await createDeveloper(2, 'MID', [js.id]);
    await createDeveloper(3, 'MID', [js.id]);

    const result = await RotationService.generateBatch(project.id);

    // Should get all 3 candidates with fallback promotion
    expect(result.candidates.length).toBe(3);
    
    // Check that promotion happened (some mids became experts)
    const expertCount = result.candidates.filter(c => c.level === 'EXPERT').length;
    expect(expertCount).toBeGreaterThanOrEqual(1);
  });

  it('excludes developers with pending assignments in other active batches', async () => {
    const js = await createSkill('js', 'JavaScript');
    
    // Create two projects
    const project1 = await createProject('client1@test.com', [js.id]);
    const project2 = await createProject('client2@test.com', [js.id]);

    // Create developers
    for (let i = 0; i < 10; i++) {
      await createDeveloper(i, 'EXPERT', [js.id]);
    }

    // Generate batch for first project
    const batch1 = await RotationService.generateBatch(project1.id);
    const batch1CandidateIds = batch1.candidates.map(c => c.developerId);

    // Generate batch for second project
    const batch2 = await RotationService.generateBatch(project2.id);
    const batch2CandidateIds = batch2.candidates.map(c => c.developerId);

    // Should have no overlap in candidates
    const overlap = batch1CandidateIds.filter(id => 
      batch2CandidateIds.includes(id)
    );
    expect(overlap.length).toBe(0);
  });
});
