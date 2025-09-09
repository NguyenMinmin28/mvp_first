import { IdeaSparkHero, IdeaSparkGrid } from "@/features/ideas/components";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { Metadata } from "next";
import { UserLayout } from "@/features/shared/components/user-layout";

export default async function IdeasPage() {
  const user = await getServerSessionUser();
  
  return (
    <UserLayout user={user}>
      <IdeaSparkHero />
      <IdeaSparkGrid />
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "Ideas",
  description: "Explore community ideas and sparks",
};
