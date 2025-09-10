export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSessionUser } from "@/features/auth/auth-server";
import { Metadata } from "next";
import { UserLayout } from "@/features/shared/components/user-layout";
import ClientDashboard from "@/features/client/components/client-dashboard";

export default async function ClientDashboardPage() {
  const user = await getServerSessionUser();

  return (
    <UserLayout user={user}>
      <section className="w-full py-8">
        <div className="container mx-auto px-4">
          <ClientDashboard />
        </div>
      </section>
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "Client Dashboard – Manage Projects & Freelancers",
  description: "Manage your projects, track progress, and connect with freelancers on your Clevrs client dashboard. Direct communication and transparent pricing.",
};
