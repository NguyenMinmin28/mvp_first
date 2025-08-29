import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/core/database/db";
import { UserLayout } from "@/features/shared/components/user-layout";
import ProjectDetailPage from "@/features/client/components/project-detail-page";

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
    include: {
      assignmentCandidates: {
        include: {
          developer: {
            include: {
              user: true
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
