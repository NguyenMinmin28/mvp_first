export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/core/database/db";
import { ProjectManagementPage } from "@/features/projects/components/project-management-page";
import { UserLayout } from "@/features/shared/components/user-layout";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/");
  }

  // Fetch user's projects
  const projects = await prisma.project.findMany({
    where: {
      client: {
        userId: session.user.id
      }
    },
    include: {
      currentBatch: {
        include: {
          candidates: {
            include: {
              developer: {
                include: {
                  user: {
                    select: { name: true, email: true }
                  }
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          assignmentBatches: true,
          assignmentCandidates: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <UserLayout user={session.user}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Projects
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and track your posted projects
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ProjectManagementPage projects={projects} />
        </Suspense>
      </div>
    </UserLayout>
  );
}
