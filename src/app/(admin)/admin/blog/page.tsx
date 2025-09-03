import { getServerSessionUser } from "@/features/auth/auth-server";
import { AdminLayout } from "@/features/shared/components/admin-layout";
import { BlogManagementClient } from "@/features/admin/components/blog-management-client";

export default async function BlogManagementPage() {
  const user = await getServerSessionUser();

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout user={user} title="Blog Management" description="Manage blog posts">
      <BlogManagementClient />
    </AdminLayout>
  );
}
