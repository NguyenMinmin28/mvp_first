import { notFound } from "next/navigation";
import { prisma } from "@/core/database/db";
import { DeveloperPortfolioClient } from "@/features/client/components/developer-portfolio-client";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

interface DeveloperPortfolioPageProps {
  params: { id: string };
}

export default async function DeveloperPortfolioPage({
  params,
}: DeveloperPortfolioPageProps) {
  const developerId = params.id;

  // Fetch developer info
  const developer = await prisma.developerProfile.findUnique({
    where: { id: developerId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      portfolios: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  if (!developer) {
    notFound();
  }

  // Get session to check if user has liked portfolios
  const session = await getServerSessionUser();
  let likedPortfolioIds: string[] = [];

  if (session?.id && developer.portfolios.length > 0) {
    const likes = await prisma.portfolioLike.findMany({
      where: {
        userId: session.id,
        portfolioId: {
          in: developer.portfolios.map(p => p.id)
        }
      },
      select: {
        portfolioId: true
      }
    });
    likedPortfolioIds = likes.map(l => l.portfolioId);
  }

  // Transform portfolio items with like counts
  const portfolioItems = await Promise.all(
    developer.portfolios.map(async (portfolio) => {
      // Parse imageUrl to extract images array
      const raw = portfolio.imageUrl || "";
      let images: string[] = [];
      let imageUrl = "";
      
      const looksJson = raw.trim().startsWith("[");
      if (looksJson) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            images = [...parsed].slice(0, 6);
            while (images.length < 6) images.push("");
            const nonEmpty = images.filter((u) => u && u.trim() !== "");
            imageUrl = nonEmpty[0] || "";
          } else {
            images = ["", "", "", "", "", ""];
            imageUrl = "";
          }
        } catch {
          images = ["", "", "", "", "", ""];
          imageUrl = "";
        }
      } else {
        if (raw) {
          images = [raw, "", "", "", "", ""];
          imageUrl = raw;
        } else {
          images = ["", "", "", "", "", ""];
          imageUrl = "";
        }
      }

      // Get like count
      const likeCount = await prisma.portfolioLike.count({
        where: { portfolioId: portfolio.id }
      });

      return {
        id: portfolio.id,
        title: portfolio.title,
        description: portfolio.description,
        url: portfolio.projectUrl,
        imageUrl: imageUrl,
        images: images,
        createdAt: portfolio.createdAt,
        userLiked: likedPortfolioIds.includes(portfolio.id),
        likeCount,
      };
    })
  );

  return (
    <UserLayout user={session || undefined}>
      <DeveloperPortfolioClient
        developer={{
          id: developer.id,
          name: developer.user.name,
          image: developer.user.image,
          level: developer.level,
        }}
        portfolioItems={portfolioItems}
      />
    </UserLayout>
  );
}

