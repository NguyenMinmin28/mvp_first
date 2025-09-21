import { getWhatsAppService } from "./whatsapp.service";
import { prisma } from "@/core/database/db";
import { notify } from "./notify.service";

export interface ProjectAssignmentNotification {
  candidateId: string;
  developerName: string;
  phoneNumber: string;
  projectTitle: string;
  budget: string;
  deadline: string;
  skills: string[];
  acceptanceDeadline: Date;
}

export class NotificationService {
  /**
   * Gửi notification cho developer khi được assign project
   */
  static async sendProjectAssignmentNotification(
    notification: ProjectAssignmentNotification
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Feature flag: disable WhatsApp sending globally
      if (process.env.WHATSAPP_DISABLE_SENDING === "true") {
        return { success: true, message: "WhatsApp sending disabled via WHATSAPP_DISABLE_SENDING" };
      }
      const whatsappService = getWhatsAppService();
      
      // Sử dụng template message thay vì text message
      const templateName = process.env.WHATSAPP_TEMPLATE_PROJECT_ASSIGNMENT || "project_assignment_notification";
      
      // Tạo template parameters theo đúng thứ tự variables trong template
      const templateParams = [
        notification.developerName,           // {{developer_name}}
        notification.projectTitle,            // {{project_title}}
        notification.budget,                  // {{project_budget}}
        notification.deadline,                // {{project_deadline}}
        notification.skills.slice(0, 3).join(", ") + (notification.skills.length > 3 ? ` +${notification.skills.length - 3} more` : ""), // {{project_skills}}
        `${process.env.NEXT_PUBLIC_APP_URL}/developer/assignment/${notification.candidateId}` // {{direct_link}}
      ];
      
      // Tạo interactive buttons với payload chứa candidateId
      const buttons = [
        {
          id: "accept",
          title: "✅ Accept",
          payload: `ACCEPT_${notification.candidateId}`
        },
        {
          id: "reject", 
          title: "❌ Reject",
          payload: `REJECT_${notification.candidateId}`
        }
      ];

      // Gửi template message với buttons
      await whatsappService.sendTemplateMessage(
        notification.phoneNumber,
        templateName,
        templateParams,
        buttons
      );
      
      // Log notification đã gửi
      await this.logNotificationSent(notification.candidateId, "project_assignment");

      // Emit in-app notification for developer (assignment.invited)
      try {
        const candidate = await prisma.assignmentCandidate.findUnique({
          where: { id: notification.candidateId },
          include: { developer: { include: { user: true } }, project: true }
        });
        if (candidate?.developer?.userId) {
          await notify({
            type: "assignment.invited",
            recipients: [candidate.developer.userId],
            projectId: candidate.projectId || undefined,
            payload: {
              projectTitle: candidate.project?.title,
              acceptanceDeadline: notification.acceptanceDeadline,
              skills: notification.skills,
            },
          });
        }
      } catch (e) {
        console.warn("Failed to emit in-app notification", e);
      }
      
      return {
        success: true,
        message: "Project assignment notification sent successfully"
      };
    } catch (error) {
      console.error("Error sending project assignment notification:", error);
      return {
        success: false,
        message: `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Tạo message content cho project assignment
   */
  private static createProjectAssignmentMessage(
    notification: ProjectAssignmentNotification
  ): string {
    const skillsText = notification.skills.slice(0, 3).join(", ") + 
      (notification.skills.length > 3 ? ` +${notification.skills.length - 3} more` : "");
    
    const deadlineText = new Date(notification.acceptanceDeadline).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `🎯 *New Project Assignment!*

Hi ${notification.developerName},

You've been assigned to a new project:

📋 *Project:* ${notification.projectTitle}
💰 *Budget:* ${notification.budget}
⏰ *Deadline:* ${notification.deadline}
🛠️ *Skills:* ${skillsText}

*Reply with:*
✅ *ACCEPT* - to accept this project
❌ *REJECT* - to decline this project

*Or visit:* ${process.env.NEXT_PUBLIC_APP_URL}/developer/assignment/${notification.candidateId}

⏱️ *Reply within 15 minutes!* (by ${deadlineText})

---
*This is an automated message from Developer Connect*`;
  }

  /**
   * Log notification đã gửi
   */
  private static async logNotificationSent(
    candidateId: string,
    notificationType: string
  ): Promise<void> {
    try {
      await (prisma as any).notificationLog.create({
        data: {
          candidateId,
          type: notificationType,
          sentAt: new Date(),
          status: "sent"
        }
      });
    } catch (error) {
      console.error("Error logging notification:", error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Gửi notification cho tất cả developers trong batch
   */
  static async sendBatchNotifications(batchId: string): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    try {
      // Feature flag: disable WhatsApp sending globally
      if (process.env.WHATSAPP_DISABLE_SENDING === "true") {
        return { success: true, sent: 0, failed: 0, errors: [] };
      }
      // Lấy thông tin batch và candidates
      const batch = await prisma.assignmentBatch.findUnique({
        where: { id: batchId },
        include: {
          project: {
            select: {
              title: true,
              budget: true,
              expectedEndAt: true,
              skillsRequired: true
            }
          },
          candidates: {
            where: {
              responseStatus: "pending"
            },
            include: {
              developer: {
                include: {
                  user: {
                    select: {
                      name: true,
                      phoneE164: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!batch) {
        throw new Error("Batch not found");
      }

      const results = {
        success: true,
        sent: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Gửi notification cho từng developer
      for (const candidate of batch.candidates) {
        // Chỉ gửi cho developers đã verify WhatsApp
        if (!candidate.developer.whatsappVerified || !candidate.developer.user.phoneE164) {
          continue;
        }

        const notification: ProjectAssignmentNotification = {
          candidateId: candidate.id,
          developerName: candidate.developer.user.name || "Developer",
          phoneNumber: candidate.developer.user.phoneE164,
          projectTitle: batch.project.title,
          budget: batch.project.budget !== null && batch.project.budget !== undefined
            ? `${batch.project.budget}`
            : "N/A",
          deadline: batch.project.expectedEndAt
            ? new Date(batch.project.expectedEndAt).toISOString()
            : "Flexible",
          skills: batch.project.skillsRequired,
          acceptanceDeadline: candidate.acceptanceDeadline || new Date()
        };

        const result = await this.sendProjectAssignmentNotification(notification);
        
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`${candidate.developer.user.name}: ${result.message}`);
        }
      }

      return results;
    } catch (error) {
      console.error("Error sending batch notifications:", error);
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"]
      };
    }
  }
}
