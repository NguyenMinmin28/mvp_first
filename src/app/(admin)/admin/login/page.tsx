import { Metadata } from "next";
import AdminLoginClient from "../../../../features/(admin)/login/admin-login-client";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Admin login to manage the application.",
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLoginClient />
    </Suspense>
  );
}
