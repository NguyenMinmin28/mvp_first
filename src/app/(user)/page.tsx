import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";
import HeroProject from "@/features/home/hero-project";
import Description from "@/features/home/description";
import Workspace from "@/features/home/workspace";
import Subscription from "@/features/home/subscription";
import ContactDirect from "@/features/home/contact-direct";
import AiMatch from "@/features/home/ai-match";
import EarnFreedom from "@/features/home/earn-freedom";

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
