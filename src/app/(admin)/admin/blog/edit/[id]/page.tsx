import { getServerSessionUser } from "@/features/auth/auth-server";
import { AdminLayout } from "@/features/shared/components/admin-layout";
import { EditBlogPostClient } from "@/features/admin/components/edit-blog-post-client";

interface EditBlogPostPageProps {
  params: {
    id: string;
  };
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
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
    <AdminLayout user={user} title="Edit Blog Post" description="Edit existing blog post">
      <EditBlogPostClient postId={params.id} />
    </AdminLayout>
  );
}
