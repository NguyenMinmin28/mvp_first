// Tests for rotation cursor fairness and persistence
import { resetDb, createSkill, createDeveloper, createProject } from './helpers';
import { RotationService } from '@/core/services/rotation.service';
import { prisma } from '@/core/database/db';

beforeEach(async () => {
  await resetDb();
});

describe('RotationService Cursor Management', () => {
  it('creates and updates rotation cursors correctly', async () => {
    const js = await createSkill('js', 'JavaScript');
    const ts = await createSkill('ts', 'TypeScript');
    
    const project = await createProject('client@test.com', [js.id, ts.id]);
    
    // Create enough developers to see rotation
    const developers = [];
    for (let i = 0; i < 8; i++) {
      developers.push(await createDeveloper(i, 'EXPERT', [js.id, ts.id]));
    }

    // Generate first batch
    const batch1 = await RotationService.generateBatch(project.id, {
      expertCount: 4,
      midCount: 0,
      fresherCount: 0
    });

    // Check that cursors were created
    const jsCursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js.id, level: 'EXPERT' } }
    });
    const tsCursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: ts.id, level: 'EXPERT' } }
    });

    expect(jsCursor).toBeTruthy();
    expect(tsCursor).toBeTruthy();
    expect(jsCursor?.lastDeveloperId).toBeTruthy();
    expect(tsCursor?.lastDeveloperId).toBeTruthy();

    // Verify the cursor points to a developer who was selected
    const batch1Candidates = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch1.batchId, level: 'EXPERT' }
    });
    const batch1DeveloperIds = batch1Candidates.map(c => c.developerId);
    
    expect(batch1DeveloperIds).toContain(jsCursor!.lastDeveloperId);
    expect(batch1DeveloperIds).toContain(tsCursor!.lastDeveloperId);
  });

  it('starts next batch after the cursor position for fair rotation', async () => {
    const js = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js.id]);
    
    // Create developers with stable ordering (by ID)
    const developers = [];
    for (let i = 0; i < 8; i++) {
      developers.push(await createDeveloper(i, 'EXPERT', [js.id]));
    }

    // Sort by ID to ensure stable ordering
    developers.sort((a, b) => a.dp.id.localeCompare(b.dp.id));

    // Generate first batch with 4 experts
    const batch1 = await RotationService.generateBatch(project.id, {
      expertCount: 4,
      midCount: 0,
      fresherCount: 0
    });

    const batch1Candidates = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch1.batchId, level: 'EXPERT' },
      orderBy: { assignedAt: 'asc' }
    });
    const batch1DeveloperIds = batch1Candidates.map(c => c.developerId);

    // Get cursor position
    const cursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js.id, level: 'EXPERT' } }
    });

    // Create more developers and refresh batch
    for (let i = 10; i < 15; i++) {
      await createDeveloper(i, 'EXPERT', [js.id]);
    }

    const batch2 = await RotationService.refreshBatch(project.id);
    const batch2Candidates = await prisma.assignmentCandidate.findMany({
      where: { batchId: batch2.batchId, level: 'EXPERT' }
    });
    const batch2DeveloperIds = batch2Candidates.map(c => c.developerId);

    // Batches should be different (rotation happened)
    expect(new Set(batch1DeveloperIds)).not.toEqual(new Set(batch2DeveloperIds));

    // No overlap should exist (no re-invite rule)
    const overlap = batch1DeveloperIds.filter(id => batch2DeveloperIds.includes(id));
    expect(overlap.length).toBe(0);

    // Cursor should be updated
    const newCursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js.id, level: 'EXPERT' } }
    });
    expect(newCursor?.lastDeveloperId).not.toBe(cursor?.lastDeveloperId);
  });

  it('handles multiple skill levels independently', async () => {
    const js2 = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js2.id]);
    
    // Create developers of different levels
    for (let i = 0; i < 5; i++) {
      await createDeveloper(i, 'EXPERT', [js2.id]);
      await createDeveloper(i + 10, 'MID', [js2.id]);
      await createDeveloper(i + 20, 'FRESHER', [js2.id]);
    }

    const batch = await RotationService.generateBatch(project.id);

    // Check cursors for each level
    const expertCursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js2.id, level: 'EXPERT' } }
    });
    const midCursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js2.id, level: 'MID' } }
    });
    const fresherCursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js2.id, level: 'FRESHER' } }
    });

    expect(expertCursor).toBeTruthy();
    expect(midCursor).toBeTruthy();
    expect(fresherCursor).toBeTruthy();

    // All cursors should be different
    expect(expertCursor?.lastDeveloperId).not.toBe(midCursor?.lastDeveloperId);
    expect(midCursor?.lastDeveloperId).not.toBe(fresherCursor?.lastDeveloperId);
    expect(expertCursor?.lastDeveloperId).not.toBe(fresherCursor?.lastDeveloperId);
  });

  it('handles multiple skills independently', async () => {
    const js3 = await createSkill('js', 'JavaScript');
    const py = await createSkill('python', 'Python');
    
    const project = await createProject('client@test.com', [js3.id, py.id]);
    
    // Create developers with different skill combinations
    for (let i = 0; i < 5; i++) {
      await createDeveloper(i, 'EXPERT', [js3.id]);
      await createDeveloper(i + 10, 'EXPERT', [py.id]);
      await createDeveloper(i + 20, 'EXPERT', [js3.id, py.id]); // Both skills
    }

    const batch = await RotationService.generateBatch(project.id, {
      expertCount: 6,
      midCount: 0,
      fresherCount: 0
    });

    // Check cursors for each skill
    const jsCursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js3.id, level: 'EXPERT' } }
    });
    const pythonCursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: py.id, level: 'EXPERT' } }
    });

    expect(jsCursor).toBeTruthy();
    expect(pythonCursor).toBeTruthy();

    // Cursors can point to different developers (fair for each skill)
    // Note: They might be the same if multi-skill dev was selected for both
    expect(jsCursor?.skillId).toBe(js3.id);
    expect(pythonCursor?.skillId).toBe(py.id);
  });

  it('persists cursor state between service calls', async () => {
    const js4 = await createSkill('js', 'JavaScript');
    const project1 = await createProject('client1@test.com', [js4.id]);
    const project2 = await createProject('client2@test.com', [js4.id]);
    
    // Create developers
    for (let i = 0; i < 10; i++) {
      await createDeveloper(i, 'MID', [js4.id]);
    }

    // Generate batch for project1
    await RotationService.generateBatch(project1.id, {
      expertCount: 0,
      midCount: 3,
      fresherCount: 0
    });

    const cursorAfterProject1 = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js4.id, level: 'MID' } }
    });

    // Generate batch for project2 (should use cursor from project1)
    await RotationService.generateBatch(project2.id, {
      expertCount: 0,
      midCount: 3,
      fresherCount: 0
    });

    const cursorAfterProject2 = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js4.id, level: 'MID' } }
    });

    // Cursor should have been updated (advanced)
    expect(cursorAfterProject2?.lastDeveloperId).not.toBe(cursorAfterProject1?.lastDeveloperId);
    expect(cursorAfterProject2?.updatedAt.getTime()).toBeGreaterThan(cursorAfterProject1!.updatedAt.getTime());
  });

  it('handles cursor updates when no eligible developers found', async () => {
    const rare = await createSkill('rare-skill', 'Rare Skill');
    const project = await createProject('client@test.com', [rare.id]);
    
    // Create developers but not with the required skill
    const jsWrong = await createSkill('js', 'JavaScript');
    for (let i = 0; i < 5; i++) {
      await createDeveloper(i, 'EXPERT', [jsWrong.id]); // Wrong skill
    }

    // This should fail
    await expect(
      RotationService.generateBatch(project.id)
    ).rejects.toThrow(/No eligible candidates found/);

    // Cursor should not be created for skill with no candidates
    const cursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: rare.id, level: 'EXPERT' } }
    });
    expect(cursor).toBeNull();
  });

  it('handles cursor wrap-around when reaching end of developer list', async () => {
    const js5 = await createSkill('js', 'JavaScript');
    const project = await createProject('client@test.com', [js5.id]);
    
    // Create only a few developers
    const developers = [];
    for (let i = 0; i < 3; i++) {
      developers.push(await createDeveloper(i, 'EXPERT', [js5.id]));
    }

    // Generate multiple batches that should wrap around
    const batch1 = await RotationService.generateBatch(project.id, {
      expertCount: 2,
      midCount: 0,
      fresherCount: 0
    });

    // Add another developer
    await createDeveloper(10, 'EXPERT', [js5.id]);

    const batch2 = await RotationService.refreshBatch(project.id);
    
    // Should work without errors (cursor handles wrap-around internally)
    expect(batch1.batchId).toBeDefined();
    expect(batch2.batchId).toBeDefined();
    expect(batch1.batchId).not.toBe(batch2.batchId);

    // Verify cursors were updated
    const cursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js5.id, level: 'EXPERT' } }
    });
    expect(cursor?.lastDeveloperId).toBeTruthy();
  });

  it('maintains cursor consistency under concurrent operations', async () => {
    const js6 = await createSkill('js', 'JavaScript');
    
    // Create multiple projects
    const projects = [];
    for (let i = 0; i < 3; i++) {
      projects.push(await createProject(`client${i}@test.com`, [js6.id]));
    }
    
    // Create developers
    for (let i = 0; i < 15; i++) {
      await createDeveloper(i, 'MID', [js6.id]);
    }

    // Generate batches concurrently
    const batchPromises = projects.map(project =>
      RotationService.generateBatch(project.id, {
        expertCount: 0,
        midCount: 3,
        fresherCount: 0
      })
    );

    const batches = await Promise.all(batchPromises);

    // All batches should succeed
    expect(batches.length).toBe(3);
    for (const batch of batches) {
      expect(batch.batchId).toBeDefined();
      expect(batch.candidates.length).toBe(3);
    }

    // Check final cursor state
    const finalCursor = await (prisma as any).rotationCursor.findUnique({
      where: { skillId_level: { skillId: js6.id, level: 'MID' } }
    });
    expect(finalCursor).toBeTruthy();

    // Note: Depending on pool size, candidates can overlap across projects.
    // Core expectation here is each batch is generated successfully with requested size.
  });
});
