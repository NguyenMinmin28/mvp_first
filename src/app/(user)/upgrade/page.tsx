import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import ClientUpgradePage from "@/features/upgrade/components/client-upgrade-page";

export default async function UpgradePage() {
  const session = await getServerSession(authOptions);

  // Redirect to signin if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }

  // Only allow clients to access this page
  if (session.user?.role !== "CLIENT") {
    redirect("/");
  }

  return <ClientUpgradePage />;
}
