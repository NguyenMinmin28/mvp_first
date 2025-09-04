"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RoleSelection from "../components/role-selection";
import { toast } from "sonner";

type Step = "role-selection" | "client-form" | "developer-form";
type UserRole = "CLIENT" | "DEVELOPER";

interface User {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
  isProfileCompleted: boolean;
}

export default function CompleteProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("role-selection");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect nếu profile đã hoàn thành
  useEffect(() => {
    console.log("🔍 Complete Profile - Current session:", session?.user);

    if (session?.user?.role && session?.user?.isProfileCompleted) {
      // Redirect based on role instead of home
      if (session.user.role === "CLIENT") {
        router.push("/client-dashboard");
      } else if (session.user.role === "DEVELOPER") {
        router.push("/inbox");
      } else if (session.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      return;
    }

    // Nếu user đã có role nhưng chưa hoàn thành profile, skip role selection
    if (session?.user?.role && session.user.role !== "ADMIN") {
      console.log("🔍 Complete Profile - User has role:", session.user.role);
      setSelectedRole(session.user.role as UserRole);
      setCurrentStep(
        session.user.role === "CLIENT" ? "client-form" : "developer-form"
      );
    } else {
      console.log(
        "🔍 Complete Profile - No role found, showing role selection"
      );
    }
  }, [session, router]);

  const handleRoleSelect = async (role: UserRole) => {
    setIsLoading(true);
    try {
      console.log("🔍 Starting role selection for:", role);
      // If user already has this role, skip API and just route
      if (session?.user?.role === role) {
        console.log("🔍 User already has role, skip update and redirect");
        if (role === "CLIENT") {
          router.push("/client-dashboard");
        } else if (role === "DEVELOPER") {
          router.push("/onboarding/freelancer/basic-information");
        } else {
          router.push("/");
        }
        return;
      }
      
      // Update user role and create profile
      const response = await fetch("/api/user/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      console.log("🔍 API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API error:", errorData);
        throw new Error(
          errorData.error || "Failed to update role and create profile"
        );
      }

      const result = await response.json();
      console.log("✅ API success:", result);

      // Add small delay to ensure database transaction completes
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update session
      await updateSession();
      console.log("✅ Session updated");

      setSelectedRole(role);

      // Show success message with profile creation info
      toast.success(
        `Role ${role === "CLIENT" ? "Client" : "Developer"} selected and profile created successfully!`
      );

      // Redirect based on selected role
      if (role === "CLIENT") {
        router.push("/client-dashboard");
      } else if (role === "DEVELOPER") {
        router.push("/onboarding/freelancer/basic-information");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("❌ Error updating role and creating profile:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while updating role and creating profile"
      );
      // Don't update session or redirect on error
      return;
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <RoleSelection
      onRoleSelect={handleRoleSelect}
      currentRole={selectedRole || undefined}
      isLoading={isLoading}
    />
  );
}
