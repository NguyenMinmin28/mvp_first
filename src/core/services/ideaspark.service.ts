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
  SparkEventType
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
  }): Promise<Idea> {
    const idea = await prisma.idea.create({
      data: {
        ...data,
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

    return idea;
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
  }): Promise<{
    ideas: (Idea & {
      author: { id: string; name: string | null; image: string | null } | null;
      cover: { id: string; storageKey: string } | null;
      _count: { likes: number; comments: number; bookmarks: number };
    })[];
    nextCursor?: string;
  }> {
    const { status = IdeaStatus.APPROVED, adminTags, search, cursor, limit = 20 } = params;

    const where: any = { status };
    
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

    if (cursor) {
      where.id = { gt: cursor };
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
        _count: {
          select: { likes: true, comments: true, bookmarks: true },
        },
      },
      orderBy: [
        { featuredAt: 'desc' },
        { likeCount: 'desc' },
        { createdAt: 'desc' },
      ],
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
  async getIdeaById(id: string): Promise<(Idea & {
    author: { id: string; name: string | null; image: string | null } | null;
    cover: { id: string; storageKey: string } | null;
    _count: { likes: number; comments: number; bookmarks: number };
  }) | null> {
    return prisma.idea.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        cover: {
          select: { id: true, storageKey: true },
        },
        _count: {
          select: { likes: true, comments: true, bookmarks: true },
        },
      },
    });
  }

  // ===== ADMIN APPROVAL WORKFLOW =====
  
  /**
   * Admin approve idea
   */
  async approveIdea(ideaId: string, adminId: string, note?: string): Promise<Idea> {
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        status: IdeaStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    // Tạo approval event
    await this.createApprovalEvent({
      ideaId,
      adminId,
      action: IdeaApprovalAction.APPROVED,
      note,
    });

    // Cộng Spark Points cho author
    await this.addSparkPoints({
      userId: idea.authorId,
      ideaId: idea.id,
      type: SparkEventType.IDEA_APPROVED,
      points: 50,
    });

    return idea;
  }

  /**
   * Admin reject idea
   */
  async rejectIdea(ideaId: string, adminId: string, note?: string): Promise<Idea> {
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        status: IdeaStatus.REJECTED,
        rejectedAt: new Date(),
      },
    });

    // Tạo approval event
    await this.createApprovalEvent({
      ideaId,
      adminId,
      action: IdeaApprovalAction.REJECTED,
      note,
    });

    return idea;
  }

  /**
   * Admin thêm/xóa tags
   */
  async updateAdminTags(
    ideaId: string, 
    adminId: string, 
    tags: IdeaAdminTag[], 
    note?: string
  ): Promise<Idea> {
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: { adminTags: tags },
    });

    // Tạo approval event
    await this.createApprovalEvent({
      ideaId,
      adminId,
      action: IdeaApprovalAction.TAG_ADDED,
      note: `Tags updated to: ${tags.join(', ')}`,
    });

    return idea;
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
    return prisma.ideaApprovalEvent.create({ data });
  }

  // ===== USER INTERACTIONS =====
  
  /**
   * Like/Unlike idea
   */
  async toggleLike(ideaId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const existingLike = await prisma.ideaLike.findUnique({
      where: { ideaId_userId: { ideaId, userId } },
    });

    if (existingLike) {
      // Unlike
      await prisma.ideaLike.delete({
        where: { id: existingLike.id },
      });
      
      const idea = await prisma.idea.update({
        where: { id: ideaId },
        data: { likeCount: { decrement: 1 } },
      });

      return { liked: false, likeCount: idea.likeCount };
    } else {
      // Like
      await prisma.ideaLike.create({
        data: { ideaId, userId },
      });

      const idea = await prisma.idea.update({
        where: { id: ideaId },
        data: { likeCount: { increment: 1 } },
      });

      // Cộng Spark Points cho author (nếu không phải chính họ)
      const ideaDetail = await prisma.idea.findUnique({
        where: { id: ideaId },
        select: { authorId: true },
      });

      if (ideaDetail && ideaDetail.authorId !== userId) {
        await this.addSparkPoints({
          userId: ideaDetail.authorId,
          ideaId,
          type: SparkEventType.IDEA_LIKED,
          points: 1,
        });
      }

      return { liked: true, likeCount: idea.likeCount };
    }
  }

  /**
   * Bookmark/Unbookmark idea
   */
  async toggleBookmark(ideaId: string, userId: string): Promise<{ bookmarked: boolean; bookmarkCount: number }> {
    const existingBookmark = await prisma.ideaBookmark.findUnique({
      where: { ideaId_userId: { ideaId, userId } },
    });

    if (existingBookmark) {
      // Unbookmark
      await prisma.ideaBookmark.delete({
        where: { id: existingBookmark.id },
      });
      
      const idea = await prisma.idea.update({
        where: { id: ideaId },
        data: { bookmarkCount: { decrement: 1 } },
      });

      return { bookmarked: false, bookmarkCount: idea.bookmarkCount };
    } else {
      // Bookmark
      await prisma.ideaBookmark.create({
        data: { ideaId, userId },
      });

      const idea = await prisma.idea.update({
        where: { id: ideaId },
        data: { bookmarkCount: { increment: 1 } },
      });

      return { bookmarked: true, bookmarkCount: idea.bookmarkCount };
    }
  }

  /**
   * Thêm comment
   */
  async addComment(data: {
    ideaId: string;
    userId: string;
    content: string;
    parentId?: string;
  }): Promise<IdeaComment> {
    const comment = await prisma.ideaComment.create({ data });

    // Tăng comment count
    await prisma.idea.update({
      where: { id: data.ideaId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  /**
   * Connect với tác giả idea
   */
  async connectWithAuthor(data: {
    ideaId: string;
    fromUserId: string;
    message?: string;
  }): Promise<IdeaConnect> {
    // Lấy author của idea
    const idea = await prisma.idea.findUnique({
      where: { id: data.ideaId },
      select: { authorId: true },
    });

    if (!idea) {
      throw new Error("Idea not found");
    }

    const connect = await prisma.ideaConnect.create({
      data: {
        ...data,
        toUserId: idea.authorId,
        status: ConnectStatus.SENT,
      },
    });

    // TODO: Gửi email notification
    // await this.sendConnectEmail(connect);

    return connect;
  }

  // ===== SPARK POINTS & GAMIFICATION =====
  
  /**
   * Thêm Spark Points
   */
  async addSparkPoints(data: {
    userId: string;
    ideaId?: string;
    type: SparkEventType;
    points: number;
  }): Promise<SparkPointLedger> {
    return prisma.sparkPointLedger.create({ data });
  }

  /**
   * Lấy tổng Spark Points của user
   */
  async getUserSparkPoints(userId: string): Promise<number> {
    const result = await prisma.sparkPointLedger.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    return result._sum.points || 0;
  }

  /**
   * Lấy Spark Points history
   */
  async getUserSparkPointsHistory(userId: string, limit = 20): Promise<SparkPointLedger[]> {
    return prisma.sparkPointLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ===== WEEKLY SPOTLIGHT =====
  
  /**
   * Tạo weekly spotlight
   */
  async generateWeeklySpotlight(weekStart: Date): Promise<IdeaSpotlight[]> {
    // Lấy top ideas theo like count trong tuần
    const topIdeas = await prisma.idea.findMany({
      where: {
        status: IdeaStatus.APPROVED,
        createdAt: {
          gte: weekStart,
          lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
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

      // Cập nhật featuredAt cho idea
      await prisma.idea.update({
        where: { id: idea.id },
        data: { featuredAt: new Date() },
      });

      // Cộng Spark Points cho author
      await this.addSparkPoints({
        userId: idea.authorId,
        ideaId: idea.id,
        type: SparkEventType.WEEKLY_SPOTLIGHT,
        points: 100 + (10 - i), // Bonus theo rank
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
   * Lấy ideas của user
   */
  async getUserIdeas(userId: string, status?: IdeaStatus): Promise<Idea[]> {
    const where: any = { authorId: userId };
    if (status) where.status = status;

    return prisma.idea.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cover: true,
        _count: {
          select: { likes: true, comments: true, bookmarks: true },
        },
      },
    });
  }
}
