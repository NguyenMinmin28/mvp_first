import { IdeaSparkHero, IdeaSparkGrid } from "@/features/ideas/components";
import { getServerSessionUser } from "@/features/auth/auth-server";
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
