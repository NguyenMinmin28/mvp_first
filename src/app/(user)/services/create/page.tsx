"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserLayout } from "@/features/shared/components/user-layout";

export default function CreateServicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user?.role !== "DEVELOPER") {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <UserLayout user={undefined}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!session || session.user?.role !== "DEVELOPER") {
    return null;
  }

  return (
    <UserLayout user={session?.user}>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Create New Service
            </h1>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Service Creation Coming Soon
              </h2>
              <p className="text-gray-600 mb-6">
                We're building a comprehensive service creation form. 
                You'll be able to add your service details, pricing, and more.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Service title and description</p>
                <p>• Pricing (fixed or hourly)</p>
                <p>• Skills and categories</p>
                <p>• Portfolio images</p>
                <p>• Delivery timeline</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
