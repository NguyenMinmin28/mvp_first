export const dynamic = "force-dynamic"; // Prevent caching for auth-dependent pages

import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";
// Client-side guards disabled to avoid redirect loops.

export default async function PendingApprovalPage() {
  const user = await getServerSessionUser();

  // Check if user is already approved (type safety)
  const adminStatus = user ? (user as any).adminApprovalStatus : undefined;
  const isApproved = adminStatus === "approved";
  const isRejected = adminStatus === "rejected";

  return (
    <UserLayout user={user}>
      <section className="w-full py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center space-y-4">
          {isApproved ? (
            <>
              <h1 className="text-3xl md:text-4xl font-extrabold text-green-600">Profile Approved!</h1>
              <p className="text-gray-600">Your developer profile has been approved. Redirecting to your workspace...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </>
          ) : isRejected ? (
            <>
              <h1 className="text-3xl md:text-4xl font-extrabold text-red-600">Profile Rejected</h1>
              <p className="text-gray-600">Your developer profile has been rejected. Please contact support for more information.</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-extrabold">Profile Submitted</h1>
              <p className="text-gray-600">Your developer profile has been submitted and is awaiting admin approval. We'll notify you once it's approved.</p>
              <p className="text-sm text-gray-500">This page will redirect to your freelancer workspace automatically after approval.</p>
            </>
          )}
          {/* Client guards removed; middleware handles redirects */}
        </div>
      </section>
    </UserLayout>
  );
}


