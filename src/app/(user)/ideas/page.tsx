import { IdeaSparkHero, IdeaSparkGrid } from "@/features/ideas/components";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { Metadata } from "next";
import { UserLayout } from "@/features/shared/components/user-layout";
import { IdeaSparkService } from "@/core/services/ideaspark.service";

export default async function IdeasPage() {
  const user = await getServerSessionUser();
  const ideaSparkService = new IdeaSparkService();

  // Fetch a lightweight initial page on the server for instant first paint
  let initialIdeas: any[] = [];
  let initialCursor: string | null = null;
  try {
    const result = await ideaSparkService.getIdeasForWall({ status: undefined, limit: 6 });
    initialIdeas = Array.isArray(result?.ideas) ? result.ideas : [];
    initialCursor = (result as any)?.nextCursor || null;
  } catch {}
  
  return (
    <UserLayout user={user}>
      <IdeaSparkHero />
      <IdeaSparkGrid initialIdeas={initialIdeas} initialCursor={initialCursor || undefined} />
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "Ideas",
  description: "Explore community ideas and sparks",
};
