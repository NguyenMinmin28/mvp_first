"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RoleSelection from "../components/role-selection";
import ClientProfileForm from "../components/client-profile-form";
import DeveloperProfileForm from "../components/developer-profile-form";
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

  const debugUserData = async () => {
    try {
      const response = await fetch("/api/user/me");
      const data = await response.json();
      console.log("🔍 Debug User Data:", data);
      alert(
        `Database Role: ${data.user?.role}\nSession Role: ${data.session?.role}`
      );
    } catch (error) {
      console.error("Debug error:", error);
    }
  };

  // Redirect nếu profile đã hoàn thành
  useEffect(() => {
    console.log("🔍 Complete Profile - Current session:", session?.user);

    if (session?.user?.isProfileCompleted) {
      router.push("/");
      return;
    }

    // Nếu user đã có role, skip role selection
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
      // Update user role
      const response = await fetch("/api/user/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      // Update session
      await updateSession();

      setSelectedRole(role);
      setCurrentStep(role === "CLIENT" ? "client-form" : "developer-form");
      toast.success(
        `Role ${role === "CLIENT" ? "Client" : "Developer"} selected`
      );
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("An error occurred while updating role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientFormSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "client",
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete profile");
      }

      // Update session to reflect profile completion
      await updateSession();

      toast.success("Hồ sơ đã được hoàn tất!");
      router.push("/");
    } catch (error) {
      console.error("Error completing client profile:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeveloperFormSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "developer",
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete profile");
      }

      // Update session to reflect profile completion
      await updateSession();

      toast.success("Hồ sơ đã được hoàn tất và gửi đến admin để phê duyệt!");
      router.push("/");
    } catch (error) {
      console.error("Error completing developer profile:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === "client-form" || currentStep === "developer-form") {
      // Nếu user đã có role từ trước, không cho quay lại
      if (session?.user?.role && session.user.role !== "ADMIN") {
        return;
      }
      setCurrentStep("role-selection");
      setSelectedRole(null);
    }
  };

  // Loading state
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50    flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Debug component
  const DebugPanel = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={debugUserData}
        className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
      >
        Debug Role
      </button>
    </div>
  );

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case "role-selection":
        return (
          <RoleSelection
            onRoleSelect={handleRoleSelect}
            currentRole={selectedRole || undefined}
          />
        );

      case "client-form":
        return (
          <ClientProfileForm
            onBack={handleBack}
            onSubmit={handleClientFormSubmit}
            initialData={{
              name: session.user?.name || "",
            }}
            isLoading={isLoading}
          />
        );

      case "developer-form":
        return (
          <DeveloperProfileForm
            onBack={handleBack}
            onSubmit={handleDeveloperFormSubmit}
            initialData={{
              name: session.user?.name || "",
              skillsInput: [{ name: "", years: 0, rating: 1 }],
              portfolioLinks: [""],
            }}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderStep()}
      <DebugPanel />
    </>
  );
}
