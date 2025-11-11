export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { redirect, notFound } from "next/navigation";
import { EditIdeaForm } from "@/features/ideas/components";
import { UserLayout } from "@/features/shared/components/user-layout";
import { IdeaSparkService } from "@/core/services/ideaspark.service";
import { Metadata } from "next";

interface EditIdeaPageProps {
  params: {
    id: string;
  };
}

export default async function EditIdeaPage({ params }: EditIdeaPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const ideaSparkService = new IdeaSparkService();
  const idea = await ideaSparkService.getIdeaById(params.id, session.user.id);
  
  if (!idea) {
    notFound();
  }

  // Check if user is the author
  if (idea.author?.id !== session.user.id) {
    redirect(`/ideas/${params.id}`);
  }

  return (
    <UserLayout user={session.user}>
      <div className="container mx-auto px-4 py-8">
        <EditIdeaForm idea={idea} />
      </div>
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "Edit Idea",
  description: "Edit your idea",
};

