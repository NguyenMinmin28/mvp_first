export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/core/database/db";
import { UserLayout } from "@/features/shared/components/user-layout";
import ProjectDetailPage from "@/features/client/components/project-detail-page";
import { Metadata } from "next";

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetail({ params }: ProjectDetailPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/");
  }

  // Get project details
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!clientProfile) {
    redirect("/");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      clientId: clientProfile.id
    },
    select: {
      id: true,
      title: true,
      description: true,
      skillsRequired: true,
      status: true,
      contactRevealEnabled: true,
      currentBatchId: true,
      budget: true as any,
      budgetMin: true as any,
      budgetMax: true as any,
      currency: true as any,
      expectedStartAt: true as any,
      expectedEndAt: true as any,
      createdAt: true,
      updatedAt: true,
      currentBatch: {
        select: {
          id: true,
          batchNumber: true,
          status: true,
          candidates: {
            select: {
              id: true,
              developerId: true,
              responseStatus: true,
              assignedAt: true,
              developer: {
                select: {
                  id: true,
                  user: {
                    select: { id: true, name: true, email: true, image: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!project) {
    notFound();
  }

  return (
    <UserLayout user={session.user}>
      <ProjectDetailPage project={project} />
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "Project Detail",
  description: "View project details and candidates",
};
