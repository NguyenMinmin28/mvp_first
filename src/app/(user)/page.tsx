// Cache for 5 minutes
export const revalidate = 300;

import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";
import dynamic from "next/dynamic";

// Lazy load components for better performance
const HeroProject = dynamic(() => import("@/features/home/hero-project"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const Description = dynamic(() => import("@/features/home/description"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
});

const Workspace = dynamic(() => import("@/features/home/workspace"), {
  loading: () => <div className="h-80 bg-gray-100 animate-pulse rounded-lg" />
});

const Subscription = dynamic(() => import("@/features/home/subscription"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const ContactDirect = dynamic(() => import("@/features/home/contact-direct"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
});

const AiMatch = dynamic(() => import("@/features/home/ai-match"), {
  loading: () => <div className="h-80 bg-gray-100 animate-pulse rounded-lg" />
});

const EarnFreedom = dynamic(() => import("@/features/home/earn-freedom"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Role-based dashboard",
};

export default async function Home() {
  const user = await getServerSessionUser();

  return (
    <UserLayout user={user}>
      <HeroProject />
      <Description />
      <Workspace />
      <Subscription />
      <ContactDirect />
      <AiMatch />
      <EarnFreedom />
    </UserLayout>
  );
}
