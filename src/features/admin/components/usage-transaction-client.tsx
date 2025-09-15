import { AdminLayout } from "@/features/shared/components/admin-layout";
import { UsageTransactionsTable } from "@/features/admin/components/usage-transactions-table";

export default async function AdminUsageTransactionsClient({
  user,
}: {
  user: any;
}) {
  return (
    <AdminLayout
      user={user}
      title="Usage Logs"
      description="Track project posts and contact reveals per client subscription period"
    >
      <UsageTransactionsTable />
    </AdminLayout>
  );
}
