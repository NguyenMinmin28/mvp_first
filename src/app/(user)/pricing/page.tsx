// Cache pricing for 30 minutes
export const revalidate = 1800;

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import SimplePricingPage from "@/features/pricing/components/simple-pricing-page";
import { UserLayout } from "@/features/shared/components/user-layout";
import { Metadata } from "next";

export default async function Pricing() {
  const session = await getServerSession(authOptions);

  // Get current subscription if user is logged in
  let currentSubscription: any = null;
  if (session?.user?.id) {
    const clientProfile = await prisma.clientProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        subscriptions: {
          where: {
            status: "active",
          },
          include: {
            package: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    const sub = clientProfile?.subscriptions[0] || null;
    if (sub) {
      currentSubscription = {
        ...sub,
        currentPeriodStart: sub.currentPeriodStart?.toISOString?.() ?? null,
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString?.() ?? null,
        trialStart: sub.trialStart ? sub.trialStart.toISOString() : null,
        trialEnd: sub.trialEnd ? sub.trialEnd.toISOString() : null,
        createdAt: sub.createdAt?.toISOString?.() ?? undefined,
        updatedAt: sub.updatedAt?.toISOString?.() ?? undefined,
      };
    }
  }

  return (
    <UserLayout user={session?.user}>
      <SimplePricingPage currentSubscription={currentSubscription} />
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "Clevrs Pricing – Flexible Plans for Clients & Freelancers",
  description: "Transparent pricing with no hidden fees. Clients pay only for what they use, freelancers keep 100% of their earnings. Start free today.",
};