"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthRedirect } from "@/core/hooks/use-auth-redirect";

export default function SignUpCallbackPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  // Use auth redirect hook
  useAuthRedirect();

  useEffect(() => {
    const handleGoogleSignUpCallback = async () => {
      if (!session?.user) {
        return;
      }

      console.log("Google callback - session user:", session.user);

      try {
        // Get pending role from localStorage
        const pendingRole = localStorage.getItem("pendingRole");
        console.log("Pending role from localStorage:", pendingRole);

        if (!pendingRole) {
          toast.error(
            "Không tìm thấy thông tin vai trò. Vui lòng đăng ký lại."
          );
          router.push("/auth/signup");
          return;
        }

        // Check if user already has the correct role
        if (session.user.role === pendingRole) {
          console.log("User already has correct role:", pendingRole);
          localStorage.removeItem("pendingRole");
          toast.success("Signup successful!");
          // Redirect will be handled by useAuthRedirect hook
          return;
        }

        // Special case: If user role is DEVELOPER (default) but wants CLIENT
        console.log(
          "Current user role:",
          session.user.role,
          "Wanted role:",
          pendingRole
        );

        console.log("Updating user role to:", pendingRole);

        // Update user role
        const response = await fetch("/api/user/update-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: pendingRole }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update role");
        }

        const responseData = await response.json();
        console.log("Update role response:", responseData);

        // Clean up localStorage
        localStorage.removeItem("pendingRole");

        toast.success("Signup successful! Updating information...");

        // Force a hard refresh to reload the session completely
        // This ensures NextAuth creates a fresh session with updated user data
        setTimeout(() => {
          window.location.href = "/role-selection";
        }, 1500);
      } catch (error) {
        console.error("Error in Google signup callback:", error);
        toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
        router.push("/auth/signup");
      }
    };

    if (session) {
      handleGoogleSignUpCallback();
    }
  }, [session, router, updateSession]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">
          Đang hoàn tất đăng ký...
        </p>
      </div>
    </div>
  );
}
