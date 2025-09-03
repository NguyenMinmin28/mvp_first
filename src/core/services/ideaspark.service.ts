import { prisma } from "@/core/database/db";
import { 
  Idea, 
  IdeaLike, 
  IdeaBookmark, 
  IdeaComment, 
  IdeaConnect, 
  IdeaApprovalEvent, 
  SparkPointLedger, 
  IdeaSpotlight,
  IdeaStatus,
  IdeaAdminTag,
  ConnectStatus,
  IdeaApprovalAction,
  SparkEventType,
  ReportStatus,
  IdeaReport,
  IdeaSkill
} from "@prisma/client";

export class IdeaSparkService {
  
  // ===== IDEA MANAGEMENT =====
  
  /**
   * Tạo idea mới
   */
  async createIdea(data: {
    authorId: string;
    title: string;
    summary: string;
    body?: string;
    coverFileId?: string;
    skillIds?: string[];
  }): Promise<Idea> {
    const idea = await prisma.idea.create({
      data: {
        authorId: data.authorId,
        title: data.title,
        summary: data.summary,
        body: data.body,
        coverFileId: data.coverFileId,
        status: IdeaStatus.PENDING,
        adminTags: [],
      },
      include: {
        author: true,
        cover: true,
      },
    });

    // Tạo approval event
    await this.createApprovalEvent({
      ideaId: idea.id,
      adminId: data.authorId, // Tạm thời để author, sau sẽ update khi admin approve
      action: IdeaApprovalAction.SUBMITTED,
      note: "Idea submitted for review",
    });

    // Thêm skills nếu có
    if (data.skillIds && data.skillIds.length > 0) {
      await this.addSkillsToIdea(idea.id, data.skillIds);
    }

    return idea;
  }

  /**
   * Thêm skills cho idea
   */
  async addSkillsToIdea(ideaId: string, skillIds: string[]): Promise<void> {
    if (skillIds.length === 0) return;

    // Xóa skills cũ trước
    await prisma.ideaSkill.deleteMany({
      where: { ideaId }
    });

    // Thêm skills mới từng cái một
    for (const skillId of skillIds) {
      await prisma.ideaSkill.create({
        data: {
          ideaId,
          skillId,
        }
      });
    }
  }

  /**
   * Lấy danh sách ideas cho IdeaSpark Wall
   */
  async getIdeasForWall(params: {
    status?: IdeaStatus;
    adminTags?: IdeaAdminTag[];
    search?: string;
    cursor?: string;
    limit?: number;
    sortBy?: 'latest' | 'top' | 'most_commented';
    skillIds?: string[];
  }): Promise<{
    ideas: (Idea & {
      author: { id: string; name: string | null; image: string | null } | null;
      cover: { id: string; storageKey: string } | null;
      skills: { Skill: { id: string; name: string; category: string } }[];
      _count: { likes: number; comments: number; bookmarks: number; connects: number };
    })[];
    nextCursor?: string;
  }> {
    const { status, adminTags, search, cursor, limit = 20, sortBy = 'latest', skillIds } = params;

    const where: any = { 
      status: status || IdeaStatus.APPROVED,
      // deletedAt: null // Tạm thời bỏ filter này
    };
    
    if (adminTags && adminTags.length > 0) {
      where.adminTags = { hasSome: adminTags };
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (skillIds && skillIds.length > 0) {
      where.skills = {
        some: {
          skillId: { in: skillIds }
        }
      };
    }

    if (cursor) {
      where.id = { gt: cursor };
    }

    let orderBy: any[] = [];
    
    switch (sortBy) {
      case 'top':
        orderBy = [
          { likeCount: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
      case 'most_commented':
        orderBy = [
          { commentCount: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
      default: // latest
        orderBy = [
          { featuredAt: 'desc' },
          { createdAt: 'desc' }
        ];
    }

    const ideas = await prisma.idea.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        cover: {
          select: { id: true, storageKey: true },
        },
        skills: {
          include: {
            Skill: {
              select: { id: true, name: true, category: true }
            }
          }
        },
        _count: {
          select: { likes: true, comments: true, bookmarks: true, connects: true },
        },
      },
      orderBy,
      take: limit + 1,
    });

    let nextCursor: string | undefined;
    if (ideas.length > limit) {
      const nextItem = ideas.pop();
      nextCursor = nextItem?.id;
    }

    return { ideas, nextCursor };
  }

  /**
   * Lấy chi tiết idea
   */
  async getIdeaById(id: string, userId?: string): Promise<(Idea & {
    author: { id: string; name: string | null; image: string | null } | null;
    cover: { id: string; storageKey: string } | null;
    skills: { Skill: { id: string; name: string; category: string } }[];
    _count: { likes: number; comments: number; bookmarks: number; connects: number };
    userInteraction?: { liked: boolean; bookmarked: boolean };
  }) | null> {
    const idea = await prisma.idea.findFirst({
      where: { 
        id, 
        // deletedAt: null, // Tạm thời bỏ filter này
        OR: [
          { status: IdeaStatus.APPROVED },
          { authorId: userId }, // Author có thể xem idea của mình
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        cover: {
          select: { id: true, storageKey: true },
        },
        skills: {
          include: {
            Skill: {
              select: { id: true, name: true, category: true }
            }
          }
        },
        _count: {
          select: { likes: true, comments: true, bookmarks: true, connects: true },
        },
      },
    });

    if (!idea || !userId) return idea;

    // Lấy trạng thái tương tác của user
    const userInteraction = await this.getUserInteractionStatus(id, userId);
    
    return {
      ...idea,
      userInteraction,
    };
  }

  /**
   * Cập nhật idea (chỉ author khi PENDING/REJECTED hoặc admin)
   */
  async updateIdea(id: string, data: {
    title?: string;
    summary?: string;
    body?: string;
    coverFileId?: string;
    skillIds?: string[];
  }, userId: string, isAdmin: boolean = false): Promise<Idea> {
    const idea = await prisma.idea.findUnique({
      where: { id },
      select: { authorId: true, status: true }
    });

    if (!idea) {
      throw new Error('Idea not found');
    }

    if (!isAdmin && idea.authorId !== userId) {
      throw new Error('Unauthorized to edit this idea');
    }

    if (!isAdmin && idea.status !== IdeaStatus.PENDING && idea.status !== IdeaStatus.REJECTED) {
      throw new Error('Cannot edit approved idea');
    }

    const updateData: any = { ...data };
    delete updateData.skillIds;

    const updatedIdea = await prisma.idea.update({
      where: { id },
      data: updateData,
    });

    // Cập nhật skills nếu có
    if (data.skillIds) {
      // Xóa skills cũ
      await prisma.ideaSkill.deleteMany({
        where: { ideaId: id }
      });
      
      // Thêm skills mới
      if (data.skillIds.length > 0) {
        await this.addSkillsToIdea(id, data.skillIds);
      }
    }

    return updatedIdea;
  }

  /**
   * Soft delete idea
   */
  async deleteIdea(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const idea = await prisma.idea.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!idea) {
      throw new Error('Idea not found');
    }

    if (!isAdmin && idea.authorId !== userId) {
      throw new Error('Unauthorized to delete this idea');
    }

    await prisma.idea.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  // ===== INTERACTIONS =====

  /**
   * Toggle like cho idea
   */
  async toggleLike(ideaId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const existingLike = await prisma.ideaLike.findUnique({
      where: { ideaId_userId: { ideaId, userId } }
    });

    if (existingLike) {
      // Unlike
      await prisma.ideaLike.delete({
        where: { ideaId_userId: { ideaId, userId } }
      });

      // Giảm count
      await prisma.idea.update({
        where: { id: ideaId },
        data: { likeCount: { decrement: 1 } }
      });

      return { liked: false, likeCount: (await this.getIdeaCounts(ideaId)).likeCount };
    } else {
      // Like
      await prisma.ideaLike.create({
        data: { ideaId, userId }
      });

      // Tăng count
      await prisma.idea.update({
        where: { id: ideaId },
        data: { likeCount: { increment: 1 } }
      });

      // Cộng điểm cho author
      const idea = await prisma.idea.findUnique({
        where: { id: ideaId },
        select: { authorId: true }
      });

      if (idea && idea.authorId !== userId) {
        await this.addSparkPoints({
          userId: idea.authorId,
          ideaId,
          type: SparkEventType.IDEA_LIKED,
          points: 1,
        });
      }

      return { liked: true, likeCount: (await this.getIdeaCounts(ideaId)).likeCount };
    }
  }

  /**
   * Toggle bookmark cho idea
   */
  async toggleBookmark(ideaId: string, userId: string): Promise<{ bookmarked: boolean; bookmarkCount: number }> {
    const existingBookmark = await prisma.ideaBookmark.findUnique({
      where: { ideaId_userId: { ideaId, userId } }
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.ideaBookmark.delete({
        where: { ideaId_userId: { ideaId, userId } }
      });

      await prisma.idea.update({
        where: { id: ideaId },
        data: { bookmarkCount: { decrement: 1 } }
      });

      return { bookmarked: false, bookmarkCount: (await this.getIdeaCounts(ideaId)).bookmarkCount };
    } else {
      // Add bookmark
      await prisma.ideaBookmark.create({
        data: { ideaId, userId }
      });

      await prisma.idea.update({
        where: { id: ideaId },
        data: { bookmarkCount: { increment: 1 } }
      });

      return { bookmarked: true, bookmarkCount: (await this.getIdeaCounts(ideaId)).bookmarkCount };
    }
  }

  /**
   * Thêm comment cho idea
   */
  async addComment(data: {
    ideaId: string;
    userId: string;
    content: string;
    parentId?: string;
  }): Promise<IdeaComment> {
    const comment = await prisma.ideaComment.create({
      data: {
        ideaId: data.ideaId,
        userId: data.userId,
        content: data.content,
        parentId: data.parentId,
      },
      include: {
        User: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    // Tăng comment count
    await prisma.idea.update({
      where: { id: data.ideaId },
      data: { commentCount: { increment: 1 } }
    });

    // Cộng điểm cho author nếu comment hữu ích
    if (data.parentId) {
      const parentComment = await prisma.ideaComment.findUnique({
        where: { id: data.parentId },
        select: { userId: true }
      });
      
      if (parentComment && parentComment.userId !== data.userId) {
        await this.addSparkPoints({
          userId: parentComment.userId,
          ideaId: data.ideaId,
          type: SparkEventType.COMMENT_RECEIVED,
          points: 1,
        });
      }
    }

    return comment;
  }

  /**
   * Connect với author của idea
   */
  async connectWithAuthor(data: {
    ideaId: string;
    fromUserId: string;
    message?: string;
  }): Promise<IdeaConnect> {
    const idea = await prisma.idea.findUnique({
      where: { id: data.ideaId },
      select: { authorId: true, status: true }
    });

    if (!idea) {
      throw new Error('Idea not found');
    }

    if (idea.status !== IdeaStatus.APPROVED) {
      throw new Error('Cannot connect to pending idea');
    }

    if (idea.authorId === data.fromUserId) {
      throw new Error('Cannot connect to your own idea');
    }

    // Kiểm tra đã connect chưa
    const existingConnect = await prisma.ideaConnect.findUnique({
      where: { ideaId_fromUserId: { ideaId: data.ideaId, fromUserId: data.fromUserId } }
    });

    if (existingConnect) {
      throw new Error('Already connected to this idea');
    }

    const connect = await prisma.ideaConnect.create({
      data: {
        ideaId: data.ideaId,
        fromUserId: data.fromUserId,
        toUserId: idea.authorId,
        message: data.message,
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true }
        },
        Idea: {
          select: { title: true, author: { select: { name: true, email: true } } }
        }
      }
    });

    // Tăng connect count
    await prisma.idea.update({
      where: { id: data.ideaId },
      data: { connectCount: { increment: 1 } }
    });

    // Cộng điểm cho author
    await this.addSparkPoints({
      userId: idea.authorId,
      ideaId: data.ideaId,
      type: SparkEventType.CONNECT_RECEIVED,
      points: 5,
    });

    return connect;
  }

  // ===== ADMIN FUNCTIONS =====

  /**
   * Admin approve idea
   */
  async approveIdea(ideaId: string, adminId: string, adminTags?: IdeaAdminTag[]): Promise<Idea> {
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        status: IdeaStatus.APPROVED,
        approvedAt: new Date(),
        adminTags: adminTags || [IdeaAdminTag.INSPIRATION],
        rejectedReason: null,
      }
    });

    // Tạo approval event
    await this.createApprovalEvent({
      ideaId,
      adminId,
      action: IdeaApprovalAction.APPROVED,
      note: `Approved with tags: ${(adminTags || [IdeaAdminTag.INSPIRATION]).join(', ')}`,
    });

    // Cộng Spark Points cho author
    await this.addSparkPoints({
      userId: idea.authorId,
      ideaId,
      type: SparkEventType.IDEA_APPROVED,
      points: 20,
    });

    return idea;
  }

  /**
   * Admin reject idea
   */
  async rejectIdea(ideaId: string, adminId: string, reason: string): Promise<Idea> {
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        status: IdeaStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedReason: reason,
      }
    });

    // Tạo approval event
    await this.createApprovalEvent({
      ideaId,
      adminId,
      action: IdeaApprovalAction.REJECTED,
      note: `Rejected: ${reason}`,
    });

    return idea;
  }

  /**
   * Admin thay đổi tag
   */
  async updateIdeaTags(ideaId: string, adminId: string, adminTags: IdeaAdminTag[]): Promise<Idea> {
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: { adminTags }
    });

    // Tạo approval event
    await this.createApprovalEvent({
      ideaId,
      adminId,
      action: IdeaApprovalAction.TAG_ADDED,
      note: `Tags updated: ${adminTags.join(', ')}`,
    });

    return idea;
  }

  /**
   * Admin pin/unpin idea
   */
  async togglePinIdea(ideaId: string, adminId: string): Promise<Idea> {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { isPinned: true }
    });

    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: { isPinned: !idea?.isPinned }
    });

    // Tạo approval event
    await this.createApprovalEvent({
      ideaId,
      adminId,
      action: idea?.isPinned ? IdeaApprovalAction.UNPINNED : IdeaApprovalAction.PINNED,
      note: idea?.isPinned ? 'Unpinned idea' : 'Pinned idea',
    });

    return updatedIdea;
  }

  /**
   * Admin lock/unlock comments
   */
  async toggleLockComments(ideaId: string, adminId: string): Promise<Idea> {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { isLocked: true }
    });

    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: { isLocked: !idea?.isLocked }
    });

    // Tạo approval event
    await this.createApprovalEvent({
      ideaId,
      adminId,
      action: idea?.isLocked ? IdeaApprovalAction.COMMENTS_UNLOCKED : IdeaApprovalAction.COMMENTS_LOCKED,
      note: idea?.isLocked ? 'Unlocked comments' : 'Locked comments',
    });

    return updatedIdea;
  }

  /**
   * Admin takedown idea
   */
  async takedownIdea(ideaId: string, adminId: string, reason: string): Promise<Idea> {
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: { 
        status: IdeaStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedReason: `Takedown: ${reason}`,
      }
    });

    // Tạo approval event
    await this.createApprovalEvent({
      ideaId,
      adminId,
      action: IdeaApprovalAction.TAKEDOWN,
      note: `Takedown: ${reason}`,
    });

    return idea;
  }

  // ===== REPORT SYSTEM =====

  /**
   * Report idea
   */
  async reportIdea(data: {
    ideaId: string;
    reporterId: string;
    reason: string;
  }): Promise<IdeaReport> {
    const report = await prisma.ideaReport.create({
      data: {
        ideaId: data.ideaId,
        reporterId: data.reporterId,
        reason: data.reason,
      }
    });

    return report;
  }

  /**
   * Admin resolve report
   */
  async resolveReport(reportId: string, adminId: string, action: 'dismiss' | 'warn' | 'takedown', note?: string): Promise<IdeaReport> {
    const report = await prisma.ideaReport.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.RESOLVED,
        adminNote: note,
        resolvedAt: new Date(),
      }
    });

    if (action === 'takedown') {
      await this.takedownIdea(report.ideaId, adminId, `Report resolved: ${note || 'Abuse detected'}`);
    }

    return report;
  }

  // ===== SPOTLIGHT SYSTEM =====

  /**
   * Tạo weekly spotlight
   */
  async generateWeeklySpotlight(weekStart: Date): Promise<IdeaSpotlight[]> {
    // Lấy top ideas theo like count trong tuần
    const topIdeas = await prisma.idea.findMany({
      where: {
        status: IdeaStatus.APPROVED,
        deletedAt: null,
        createdAt: {
          gte: weekStart,
          lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        isSpotlight: false, // Chưa được spotlight
      },
      orderBy: { likeCount: 'desc' },
      take: 10,
    });

    const spotlights: IdeaSpotlight[] = [];
    
    for (let i = 0; i < topIdeas.length; i++) {
      const idea = topIdeas[i];
      
      // Tạo spotlight
      const spotlight = await prisma.ideaSpotlight.create({
        data: {
          weekStart,
          ideaId: idea.id,
          rank: i + 1,
        },
      });

      // Cập nhật featuredAt và isSpotlight cho idea
      await prisma.idea.update({
        where: { id: idea.id },
        data: { 
          featuredAt: new Date(),
          isSpotlight: true,
        },
      });

      // Cộng Spark Points cho author
      await this.addSparkPoints({
        userId: idea.authorId,
        ideaId: idea.id,
        type: SparkEventType.WEEKLY_SPOTLIGHT,
        points: 50 + (10 - i), // Bonus theo rank
        meta: { rank: i + 1, weekStart: weekStart.toISOString() }
      });

      spotlights.push(spotlight);
    }

    return spotlights;
  }

  /**
   * Lấy weekly spotlight hiện tại
   */
  async getCurrentWeeklySpotlight(): Promise<IdeaSpotlight[]> {
    const now = new Date();
    const weekStart = this.getWeekStart(now);

    return prisma.ideaSpotlight.findMany({
      where: { weekStart },
      orderBy: { rank: 'asc' },
      include: {
        Idea: {
          include: {
            author: { select: { id: true, name: true, image: true } },
            cover: { select: { id: true, storageKey: true } },
            _count: { select: { likes: true, comments: true, bookmarks: true, connects: true } }
          }
        }
      }
    });
  }

  // ===== SPARK POINTS =====

  /**
   * Thêm Spark Points
   */
  async addSparkPoints(data: {
    userId: string;
    ideaId?: string;
    type: SparkEventType;
    points: number;
    meta?: any;
  }): Promise<SparkPointLedger> {
    const ledger = await prisma.sparkPointLedger.create({
      data: {
        userId: data.userId,
        ideaId: data.ideaId,
        type: data.type,
        points: data.points,
        meta: data.meta,
      }
    });

    return ledger;
  }

  /**
   * Lấy tổng Spark Points của user
   */
  async getUserSparkPoints(userId: string): Promise<number> {
    const result = await prisma.sparkPointLedger.aggregate({
      where: { userId },
      _sum: { points: true }
    });

    return result._sum.points || 0;
  }

  /**
   * Lấy lịch sử Spark Points
   */
  async getUserSparkHistory(userId: string, limit: number = 20): Promise<SparkPointLedger[]> {
    return prisma.sparkPointLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      // Note: SparkPointLedger has no relation to Idea in schema; cannot include Idea
    });
  }

  // ===== UTILITY METHODS =====
  
  /**
   * Kiểm tra user đã like/bookmark idea chưa
   */
  async getUserInteractionStatus(ideaId: string, userId: string): Promise<{
    liked: boolean;
    bookmarked: boolean;
  }> {
    const [like, bookmark] = await Promise.all([
      prisma.ideaLike.findUnique({
        where: { ideaId_userId: { ideaId, userId } },
      }),
      prisma.ideaBookmark.findUnique({
        where: { ideaId_userId: { ideaId, userId } },
      }),
    ]);

    return {
      liked: !!like,
      bookmarked: !!bookmark,
    };
  }

  /**
   * Lấy counts của idea
   */
  async getIdeaCounts(ideaId: string): Promise<{
    likeCount: number;
    commentCount: number;
    bookmarkCount: number;
    connectCount: number;
  }> {
    const [likeCount, commentCount, bookmarkCount, connectCount] = await Promise.all([
      prisma.ideaLike.count({ where: { ideaId } }),
      prisma.ideaComment.count({ where: { ideaId, deletedAt: null } }),
      prisma.ideaBookmark.count({ where: { ideaId } }),
      prisma.ideaConnect.count({ where: { ideaId } }),
    ]);

    return { likeCount, commentCount, bookmarkCount, connectCount };
  }

  /**
   * Lấy ideas của user
   */
  async getUserIdeas(userId: string, status?: IdeaStatus): Promise<Idea[]> {
    const where: any = { authorId: userId, deletedAt: null };
    if (status) where.status = status;

    return prisma.idea.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { likes: true, comments: true, bookmarks: true, connects: true }
        }
      }
    });
  }

  /**
   * Lấy bookmarked ideas của user
   */
  async getUserBookmarkedIdeas(userId: string): Promise<Idea[]> {
    const bookmarks = await prisma.ideaBookmark.findMany({
      where: { userId },
      include: {
        Idea: {
          include: {
            author: { select: { id: true, name: true, image: true } },
            cover: { select: { id: true, storageKey: true } },
            _count: { select: { likes: true, comments: true, bookmarks: true, connects: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return bookmarks.map(b => b.Idea);
  }

  /**
   * Lấy pending ideas cho admin
   */
  async getPendingIdeas(limit: number = 50): Promise<Idea[]> {
    return prisma.idea.findMany({
      where: { 
        status: IdeaStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } },
        cover: { select: { id: true, storageKey: true } },
        skills: {
          include: {
            Skill: { select: { id: true, name: true, category: true } }
          }
        }
      }
    });
  }

  /**
   * Lấy reports cho admin
   */
  async getReports(status?: ReportStatus, limit: number = 50): Promise<IdeaReport[]> {
    const where: any = {};
    if (status) where.status = status;

    return prisma.ideaReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        Idea: {
          select: { id: true, title: true, status: true }
        },
        User: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  /**
   * Tạo approval event
   */
  private async createApprovalEvent(data: {
    ideaId: string;
    adminId: string;
    action: IdeaApprovalAction;
    note?: string;
  }): Promise<IdeaApprovalEvent> {
    return prisma.ideaApprovalEvent.create({
      data: {
        ideaId: data.ideaId,
        adminId: data.adminId,
        action: data.action,
        note: data.note,
      }
    });
  }

  /**
   * Lấy start của tuần (Monday 00:00 UTC)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
  }
}
