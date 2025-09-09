export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import MyProjectsPage from "@/features/client/components/my-projects-page";
import { UserLayout } from "@/features/shared/components/user-layout";
import { Metadata } from "next";

export default async function MyProjects() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/");
  }

  return (
    <UserLayout user={session.user}>
      <MyProjectsPage />
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "My Projects",
  description: "List of your projects",
};
