import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";
import { prisma } from "@/core/database/db";
import { billingService } from "@/modules/billing/billing.service";
import Link from "next/link";
import { Button } from "@/ui/components/button";
import { FolderOpen, Plus, DollarSign, Inbox, BadgeDollarSign } from "lucide-react";
import type { ProjectStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Role-based dashboard",
};

export default async function Home() {
  const user = await getServerSessionUser();
  if (!user) return null;

  // Pre-computed values for CLIENT
  let activePlanName: string | null = null;
  let planProjectsPerMonth: number | null = null;
  let projectsThisPeriod = 0;
  let projectsTotal = 0;
  let recentProjects: Array<{ id: string; title: string; status: ProjectStatus; postedAt: Date | null }>|null = null;

  if (user.role === "CLIENT") {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        subscriptions: {
          where: { status: "active", currentPeriodEnd: { gt: new Date() } },
          include: { package: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const sub = client?.subscriptions?.[0];
    if (sub) {
      activePlanName = sub.package.name;
      planProjectsPerMonth = sub.package.projectsPerMonth;
      
      // Get usage from billing service
      const quotas = await billingService.getBillingQuotas(client!.id);
      if (quotas) {
        projectsThisPeriod = quotas.projectsUsed;
      }
    } else {
      // Free tier: limit 3 lifetime (or until upgrade)
      projectsTotal = await prisma.project.count({ where: { clientId: client!.id } });
    }

    // Fetch recent projects for list
    recentProjects = await prisma.project.findMany({
      where: { clientId: client!.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, postedAt: true },
    });
  }

  // Helper to compute remaining
  const remainingPosts = (() => {
    if (user.role !== "CLIENT") return null;
    if (planProjectsPerMonth)
      return Math.max(0, planProjectsPerMonth - projectsThisPeriod);
    return Math.max(0, 3 - (projectsTotal || 0));
  })();

  return (
    <UserLayout user={user}>
      <section className="px-4 py-10">
        <div className="container mx-auto max-w-5xl space-y-8">
          {/* Header + quota pill */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Welcome, {user.name || user.email}</h1>
            {user.role === "CLIENT" && (
              <div className="flex items-center gap-2 text-sm rounded-full border px-3 py-1 bg-muted/30">
                <BadgeDollarSign className="h-4 w-4 text-green-600" />
                {activePlanName ? (
                  <span>Plan: <strong>{activePlanName}</strong> · Remaining: <strong>{remainingPosts}</strong></span>
                ) : (
                  <span>Free tier · Remaining: <strong>{remainingPosts}</strong> / 3</span>
                )}
              </div>
            )}
          </div>

          {/* Client view */}
          {user.role === "CLIENT" ? (
            <>
              {/* Stats cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4 bg-background/50">
                  <p className="text-sm text-muted-foreground">Active Plan</p>
                  <p className="mt-1 text-lg font-semibold">{activePlanName || "Free"}</p>
                </div>
                <div className="rounded-lg border p-4 bg-background/50">
                  <p className="text-sm text-muted-foreground">Remaining Posts</p>
                  <p className="mt-1 text-lg font-semibold">{remainingPosts}</p>
                </div>
                <div className="rounded-lg border p-4 bg-background/50">
                  <p className="text-sm text-muted-foreground">This Period</p>
                  <p className="mt-1 text-lg font-semibold">{projectsThisPeriod}</p>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/projects/new">
                  <Button className="w-full h-20 text-base font-medium flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5" /> Post Project
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="outline" className="w-full h-20 text-base font-medium flex items-center justify-center gap-2">
                    <FolderOpen className="h-5 w-5" /> My Projects
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" className="w-full h-20 text-base font-medium flex items-center justify-center gap-2">
                    <DollarSign className="h-5 w-5" /> Pricing
                  </Button>
                </Link>
              </div>

              {/* Recent projects */}
              <div className="rounded-lg border p-4 bg-background/50">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Recent Projects</h2>
                  <Link href="/projects" className="text-sm text-blue-600 hover:underline">View all</Link>
                </div>
                {recentProjects && recentProjects.length > 0 ? (
                  <div className="divide-y">
                    {recentProjects.map((p) => (
                      <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between py-3 hover:bg-muted/50 rounded">
                        <div className="flex flex-col">
                          <span className="font-medium">{p.title}</span>
                          <span className="text-xs text-muted-foreground">{p.postedAt ? new Date(p.postedAt).toLocaleDateString() : '—'}</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full border">
                          {p.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No projects yet.</p>
                )}
              </div>
            </>
          ) : (
            // Developer: simplified quick access
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/inbox">
                <Button className="w-full h-20 text-base font-medium flex items-center justify-center gap-2">
                  <Inbox className="h-5 w-5" /> Inbox
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full h-20 text-base font-medium">Profile</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </UserLayout>
  );
}
