// Cache for 5 minutes
export const revalidate = 300;

import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

// Import components statically to avoid SSR issues
import HeroProject from "@/features/home/hero-project";
import Description from "@/features/home/description";
import Workspace from "@/features/home/workspace";
import Subscription from "@/features/home/subscription";
import ContactDirect from "@/features/home/contact-direct";
import AiMatch from "@/features/home/ai-match";
import EarnFreedom from "@/features/home/earn-freedom";
import BeforeFooter from "@/features/home/before-footer";

export const metadata: Metadata = {
  title: "Clevrs – Hire Freelancers Directly with 0% Commission",
  description: "Connect directly with skilled freelancers worldwide. No middlemen, no commissions. Post your project and get matched with the perfect developer in minutes.",
};

export default async function Home() {
  const user = await getServerSessionUser();

  return (
    <UserLayout user={user}>
      <div className="space-y-8 sm:space-y-10 lg:space-y-12">
        <HeroProject />
        <Description />
        <Workspace />
        <Subscription />
        <ContactDirect />
        <AiMatch />
        <EarnFreedom />
        {!user && <BeforeFooter />}
      </div>
    </UserLayout>
  );
}
