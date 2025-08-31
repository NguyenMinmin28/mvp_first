// Static page - cache for 1 hour
export const revalidate = 3600;

import HeroAbout from "@/features/about/hero-about";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";
import Reimagine from "@/features/about/reimagine";
import CEOSection from "@/features/about/ceo";
import Principles from "@/features/about/principles";
import CompanyInfo from "@/features/about/company-info";
import KeepUp from "@/features/about/keepup";
import Together from "@/features/about/together";

export default async function AboutPage() {
  const user = await getServerSessionUser();
  return (
    <UserLayout user={user}>
      <HeroAbout />
      <Reimagine />
      <CEOSection />
      <Principles />
      <CompanyInfo />
      <KeepUp />
      <Together />
    </UserLayout>
  );
}


