// @ts-nocheck
import { prisma } from "@/core/database/db";
import { NotificationService } from "./notification.service";
import { RotationCore } from './rotation-core';
import { 
  BatchSelectionCriteria, 
  DeveloperCandidate, 
  getNextBatchNumber,
  handleTransientError
} from './rotation-helpers';
import { RotationCache } from './rotation-cache';

export interface BatchGenerationResult {
  batchId: string;
  candidates: DeveloperCandidate[];
  selection: BatchSelectionCriteria;
}

export class RotationBatch {
  private static readonly DEFAULT_SELECTION: BatchSelectionCriteria = {
    fresherCount: 5,
    midCount: 5,
    expertCount: 3
  };

  private static readonly ACCEPTANCE_DEADLINE_MINUTES = 15;

  /**
   * Check if project can generate new batch (hasn't exhausted developer pool)
   */
  static async canGenerateNewBatch(projectId: string): Promise<boolean> {
    try {
      // Count existing batches
      const existingBatchesCount = await prisma.assignmentBatch.count({
        where: { projectId }
      });

      // If more than 8 batches, likely exhausted
      if (existingBatchesCount >= 8) {
        return false;
      }

      // Check if last batch was empty (no candidates found)
      const lastBatch = await prisma.assignmentBatch.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: {
          candidates: true
        }
      });

      // If last batch was empty, check if we've tried too many times
      if (lastBatch && lastBatch.candidates.length === 0) {
        const emptyBatchesCount = await prisma.assignmentBatch.count({
          where: { 
            projectId,
            candidates: {
              none: {}
            }
          }
        });
        
        // If more than 3 empty batches, likely exhausted
        return emptyBatchesCount < 3;
      }

      return true;
    } catch (error) {
      console.error("Error checking if can generate new batch:", error);
      return true; // Default to allowing generation
    }
  }

  /**
   * Main entry point for generating assignment batch
   */
  static async generateBatch(
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    return handleTransientError(async () => {
      const result = await prisma.$transaction(async (tx: any) => {
        return await this._generateBatchWithTx(tx, projectId, customSelection);
      }, {
        timeout: 30000, // 30 seconds timeout
      });

      // Post-commit cursor updates to avoid transaction aborts
      try {
        const skillsRequired = Array.from(
          new Set(result.candidates.flatMap((c: any) => c.skillIds))
        );
        if (skillsRequired.length > 0) {
          await this.updateRotationCursors(prisma as any, skillsRequired, result.candidates);
        }
      } catch (_) {
        // Non-critical; ignore cursor update failures
      }

      // Send WhatsApp notifications for new batch
      try {
        await NotificationService.sendBatchNotifications(result.batchId);
      } catch (error) {
        console.error("Failed to send batch notifications:", error);
        // Non-critical; don't fail the batch creation
      }

      // Clear cache for this project since we created a new batch
      RotationCache.clear(projectId);

      return result;
    });
  }

  /**
   * Internal method to generate batch within existing transaction
   */
  private static async _generateBatchWithTx(
    tx: any,
    projectId: string,
    customSelection?: Partial<BatchSelectionCriteria>
  ): Promise<BatchGenerationResult> {
    const selection = { ...this.DEFAULT_SELECTION, ...customSelection };
    
    // 1. Get project and validate
    const project = await tx.project.findUnique({
      where: { id: projectId },
      include: {
        client: { include: { user: true } },
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Allow generation for submitted, assigning, and accepted statuses
    // Only block for in_progress and completed
    if (["in_progress", "completed"].includes(project.status)) {
      throw new Error(`Cannot generate batch for project with status: ${project.status}`);
    }

    // Count existing batches to determine exclusion strategy
    const existingBatchesCount = await tx.assignmentBatch.count({
      where: { projectId }
    });

    // Progressive exclusion strategy - less aggressive
    let excludeDeveloperIds: string[] = [];
    
    if (existingBatchesCount >= 5) {
      // Only after 5+ batches, exclude developers who were assigned in the last 2 batches
      console.log(`Project ${projectId} has ${existingBatchesCount} batches, excluding developers from recent batches`);
      const recentBatches = await tx.assignmentBatch.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { id: true }
      });
      
      if (recentBatches.length > 0) {
        const recentBatchIds = recentBatches.map(b => b.id);
        const recentlyAssigned = await tx.assignmentCandidate.findMany({
          where: { 
            projectId,
            batchId: { in: recentBatchIds }
          },
          select: { developerId: true },
          distinct: ['developerId']
        });
        excludeDeveloperIds = recentlyAssigned.map(ac => ac.developerId);
        console.log(`Excluding ${excludeDeveloperIds.length} developers from recent batches`);
      }
    } else if (existingBatchesCount >= 3) {
      // After 3+ batches, only exclude developers from the most recent batch
      console.log(`Project ${projectId} has ${existingBatchesCount} batches, excluding developers from last batch`);
      const lastBatch = await tx.assignmentBatch.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      });
      
      if (lastBatch) {
        const lastBatchAssigned = await tx.assignmentCandidate.findMany({
          where: { 
            projectId,
            batchId: lastBatch.id
          },
          select: { developerId: true },
          distinct: ['developerId']
        });
        excludeDeveloperIds = lastBatchAssigned.map(ac => ac.developerId);
        console.log(`Excluding ${excludeDeveloperIds.length} developers from last batch`);
      }
    }

    // 2. Check available skills first
    const availableSkills = await RotationCore.getAvailableSkills(tx, project.skillsRequired);
    console.log(`Available skills: ${availableSkills.length}/${project.skillsRequired.length}`);
    
    if (availableSkills.length === 0) {
      console.log("No WhatsApp verified developers available, trying without WhatsApp requirement...");
      
      // Try without WhatsApp verification
      const availableSkillsNoWhatsApp = await RotationCore.getAvailableSkillsNoWhatsApp(tx, project.skillsRequired);
      console.log(`Available skills (no WhatsApp): ${availableSkillsNoWhatsApp.length}/${project.skillsRequired.length}`);
      
      if (availableSkillsNoWhatsApp.length === 0) {
        console.log("No developers available for any required skills (even without WhatsApp)");
        // Create an empty, completed batch
        const emptyBatch = await tx.assignmentBatch.create({
          data: {
            projectId,
            batchNumber: await getNextBatchNumber(tx, projectId),
            status: "completed",
            selection: selection as any,
            createdAt: new Date(),
          },
        });

        await tx.project.update({
          where: { id: projectId },
          data: { 
            currentBatchId: emptyBatch.id,
            status: "submitted"
          },
        });

        return {
          batchId: emptyBatch.id,
          candidates: [],
          selection,
        };
      }
      
      // Use skills without WhatsApp requirement
      availableSkills.push(...availableSkillsNoWhatsApp);
    }

    // 3. Generate candidates using rotation algorithm with available skills
    const candidates = await RotationCore.selectCandidates(
      tx,
      availableSkills, // Use only available skills
      project.client.userId,
      projectId,
      selection,
      excludeDeveloperIds,
      existingBatchesCount
    );

    // Handle case where no candidates found: create an empty batch to stop infinite searching on UI
    if (candidates.length === 0) {
      // Only mark as exhausted if we've tried many times with many exclusions
      const isExhausted = existingBatchesCount >= 6 && excludeDeveloperIds.length > 20;
      
      console.log(`No candidates found for project ${projectId} (${existingBatchesCount} batches, ${excludeDeveloperIds.length} excluded). Creating ${isExhausted ? 'exhausted' : 'empty'} batch.`);
      
      // Create an empty, completed batch and mark it as current for the project
      const emptyBatch = await tx.assignmentBatch.create({
        data: {
          projectId,
          batchNumber: await getNextBatchNumber(tx, projectId),
          status: "completed",
          selection: selection as any,
          createdAt: new Date(),
        },
      });

      await tx.project.update({
        where: { id: projectId },
        data: { 
          currentBatchId: emptyBatch.id,
          // Keep project status as submitted so client can manually assign
          status: "submitted"
        },
      });

      return {
        batchId: emptyBatch.id,
        candidates: [],
        selection,
      };
    }

    // 3. Create AssignmentBatch
    const batch = await tx.assignmentBatch.create({
      data: {
        projectId,
        batchNumber: await getNextBatchNumber(tx, projectId),
        status: "active",
        selection: selection as any, // JSON field
        createdAt: new Date(),
      },
    });

    // 4. Create AssignmentCandidates
    const acceptanceDeadline = new Date(
      Date.now() + this.ACCEPTANCE_DEADLINE_MINUTES * 60 * 1000
    );

    await tx.assignmentCandidate.createMany({
      data: candidates.map((candidate: any) => ({
        batchId: batch.id,
        projectId,
        developerId: candidate.developerId,
        level: candidate.level,
        assignedAt: new Date(),
        acceptanceDeadline,
        responseStatus: "pending" as const,
        usualResponseTimeMsSnapshot: candidate.usualResponseTimeMs,
        statusTextForClient: "developer is checking",
        isFirstAccepted: false,
        source: "AUTO_ROTATION", // 👈 thêm
      })),
    });

    // 5. Update project currentBatchId and status
    // Only update status to "assigning" if project is still in "submitted" status
    // Don't change status if project already has accepted candidates
    const updateData: any = { 
      currentBatchId: batch.id,
    };
    
    if (project.status === "submitted") {
      updateData.status = "assigning";
    }
    
    await tx.project.update({
      where: { id: projectId },
      data: updateData,
    });

    // 6. Cursor updates are performed post-commit in generateBatch

    return {
      batchId: batch.id,
      candidates,
      selection,
    };
  }

  /**
   * Update rotation cursors after batch generation
   */
  private static async updateRotationCursors(
    tx: any,
    skillsRequired: string[],
    candidates: DeveloperCandidate[]
  ): Promise<void> {
    const updates: Array<{ skillId: string; level: any; lastDeveloperIds: string[] }> = [];

    // Group by skill and level to find last used developers
    for (const skillId of skillsRequired) {
      for (const level of ["EXPERT", "MID", "FRESHER"] as any[]) {
        const relevantCandidates = candidates.filter(
          (c) => c.level === level && c.skillIds.includes(skillId)
        );
        
        if (relevantCandidates.length > 0) {
          // Use all candidates selected for this (skill, level)
          const lastDeveloperIds = relevantCandidates.map(c => c.developerId);
          updates.push({
            skillId,
            level,
            lastDeveloperIds,
          });
        }
      }
    }

    // Batch update cursors with minimal retry on transient write conflicts
    for (const update of updates) {
      await handleTransientError(async () => {
        await tx.rotationCursor.upsert({
          where: { skillId_level: { skillId: update.skillId, level: update.level } },
          create: {
            skillId: update.skillId,
            level: update.level,
            lastDeveloperIds: update.lastDeveloperIds,
          },
          update: {
            lastDeveloperIds: update.lastDeveloperIds,
          },
        });
      });
    }
  }
}
