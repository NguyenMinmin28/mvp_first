import { notFound, redirect } from "next/navigation";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { Metadata } from "next";
import { UserLayout } from "@/features/shared/components/user-layout";
import { IdeaSparkService } from "@/core/services/ideaspark.service";
import { IdeaDetail } from "@/features/ideas/components/idea-detail";

interface IdeaDetailPageProps {
  params: {
    id: string;
  };
}

export default async function IdeaDetailPage({ params }: IdeaDetailPageProps) {
  const user = await getServerSessionUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  const ideaSparkService = new IdeaSparkService();
  const idea = await ideaSparkService.getIdeaById(params.id, user.id);
  
  if (!idea) {
    notFound();
  }

  return (
    <UserLayout user={user}>
      <IdeaDetail idea={idea} currentUserId={user.id} />
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "Idea Detail",
  description: "View idea details and discussion",
};
