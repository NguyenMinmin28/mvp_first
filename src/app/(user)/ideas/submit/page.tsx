export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import { SubmitIdeaForm } from "@/features/ideas/components";
import { UserLayout } from "@/features/shared/components/user-layout";
import { Metadata } from "next";

export default async function SubmitIdeaPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <UserLayout user={session.user}>
      <div className="container mx-auto px-4 py-8">
        <SubmitIdeaForm />
      </div>
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "Submit Idea",
  description: "Share your idea with the community",
};


