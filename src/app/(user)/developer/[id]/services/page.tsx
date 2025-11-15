import { notFound } from "next/navigation";
import { prisma } from "@/core/database/db";
import { DeveloperServicesClient } from "@/features/client/components/developer-services-client";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

interface DeveloperServicesPageProps {
  params: { id: string };
  searchParams: { serviceId?: string };
}

export default async function DeveloperServicesPage({
  params,
  searchParams,
}: DeveloperServicesPageProps) {
  const developerId = params.id;
  const selectedServiceId = searchParams.serviceId;

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
    },
  });

  if (!developer) {
    notFound();
  }

  // Fetch all services for this developer
  const services = await prisma.service.findMany({
    where: {
      developerId: developerId,
      status: "PUBLISHED",
      visibility: "PUBLIC",
    },
    orderBy: [
      { ratingAvg: "desc" },
      { views: "desc" },
      { createdAt: "desc" }
    ],
    include: {
      developer: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      },
      skills: {
        include: {
          skill: {
            select: {
              name: true
            }
          }
        }
      },
      categories: {
        include: {
          category: {
            select: {
              name: true
            }
          }
        }
      },
      media: {
        where: {
          kind: "IMAGE"
        },
        orderBy: {
          sortOrder: "asc"
        },
        select: {
          url: true,
          kind: true
        }
      },
      leads: {
        select: {
          id: true
        }
      }
    },
  });

  // Get session to check if user has liked services (optional - can be null for public access)
  const session = await getServerSessionUser();
  let likedServiceIds: string[] = [];

  if (session?.id) {
    const likes = await prisma.serviceLike.findMany({
      where: {
        userId: session.id,
        serviceId: {
          in: services.map(s => s.id)
        }
      },
      select: {
        serviceId: true
      }
    });
    likedServiceIds = likes.map(l => l.serviceId);
  }

  // Transform services
  const transformedServices = services.map(service => ({
    id: service.id,
    slug: service.slug,
    title: service.title,
    shortDesc: service.shortDesc,
    coverUrl: service.coverUrl,
    priceType: service.priceType,
    priceMin: service.priceMin,
    priceMax: service.priceMax,
    deliveryDays: service.deliveryDays,
    ratingAvg: service.ratingAvg,
    ratingCount: service.ratingCount,
    views: service.views,
    likesCount: service.likesCount,
    userLiked: likedServiceIds.includes(service.id),
    developer: {
      id: service.developer.id,
      user: {
        id: service.developer.user.id,
        name: service.developer.user.name,
        image: service.developer.user.image,
      },
      location: service.developer.location,
    },
    skills: service.skills && Array.isArray(service.skills)
      ? service.skills.map((s: any) => s.skill?.name).filter((name: string) => name)
      : [],
    categories: service.categories.map(c => c.category.name),
    leadsCount: service.leads.length,
    galleryImages: service.media.map(m => m.url),
    showcaseImages: service.media.slice(0, 2).map(m => m.url),
  }));

  return (
    <UserLayout user={session || undefined}>
      <DeveloperServicesClient
        developer={{
          id: developer.id,
          name: developer.user.name,
          image: developer.user.image,
          level: developer.level,
        }}
        services={transformedServices}
        selectedServiceId={selectedServiceId}
      />
    </UserLayout>
  );
}

