import { getServerSessionUser } from "@/features/auth/auth-server";
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
