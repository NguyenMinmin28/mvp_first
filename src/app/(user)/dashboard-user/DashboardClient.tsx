"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { UserLayout } from "@/features/shared/components/user-layout";
import ProfileSummary from "@/features/developer/components/dashboard/profile-summary";
import ProjectStatusFilter, {
  type ProjectStatus as PS,
} from "@/features/developer/components/project-status-filter";
import { useSkills } from "@/features/developer/components/dashboard/use-skills";
import { Button } from "@/ui/components/button";
import { Pagination } from "@/ui/components/pagination";
import { ChevronLeft, ChevronRight, BarChart3, FileText, FolderOpen, Briefcase, CheckCircle2, Clock, AlertCircle, Calendar, DollarSign, Tag } from "lucide-react";

const ProjectsSidebar = dynamic(
  () => import("@/features/developer/components/dashboard/projects-sidebar"),
  { ssr: false }
);
const ProjectDetail = dynamic(
  () => import("@/features/developer/components/dashboard/project-detail"),
  { ssr: false }
);
const ManualInvitationDetail = dynamic(
  () =>
    import(
      "@/features/developer/components/dashboard/manual-invitation-detail"
    ),
  { ssr: false }
);
const OnboardingPortfolioGrid = dynamic(
  () =>
    import(
      "@/features/onboarding/freelancer/components/portfolio-grid"
    ).then((m) => m.PortfolioGrid),
  { ssr: false }
);

type UserIdeaSummary = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  _count: { likes: number; comments: number; bookmarks: number };
};

type AssignedProjectItem = {
  id: string;
  name: string;
  description?: string;
  status: "recent" | "in_progress" | "completed" | "approved" | "rejected";
  date: string;
  budget?: number | null;
  currency?: string | null;
  skills?: string[];
  assignmentStatus?: string;
  assignment?: {
    id: string;
    acceptanceDeadline: string;
    responseStatus: "pending" | "accepted" | "rejected" | "expired";
    assignedAt: string;
    batchId: string;
    source?: "AUTO_ROTATION" | "MANUAL_INVITE";
    clientMessage?: string;
  };
  isManualInvite?: boolean;
  originalProjectId?: string;
};

export default function DashboardClient({
  initialSession,
  initialMe,
  initialIdeas,
  initialProjects,
}: {
  initialSession: any;
  initialMe: any;
  initialIdeas: { ideas: UserIdeaSummary[] } | null;
  initialProjects: { projects: AssignedProjectItem[] } | null;
}) {
  const session = initialSession;
  const { getSkillName } = useSkills();

  const [profile, setProfile] = useState<any>(initialMe?.user ?? null);

  const [ideas, setIdeas] = useState<UserIdeaSummary[]>(
    Array.isArray(initialIdeas?.ideas) ? initialIdeas!.ideas : []
  );
  const [projects, setProjects] = useState<AssignedProjectItem[]>(
    Array.isArray(initialProjects?.projects) ? initialProjects!.projects : []
  );
  const [projectStatus, setProjectStatus] = useState<PS>("NEW");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [selectedInvitationId, setSelectedInvitationId] = useState<
    string | null
  >(null);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [overviewPage, setOverviewPage] = useState<number>(1);
  const overviewItemsPerPage = 10; // Show 10 projects per page in overview

  const projectDetailRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedProject = useMemo(
    () =>
      selectedProjectId
        ? (projects.find((p) => p.id === selectedProjectId) ?? null)
        : null,
    [selectedProjectId, projects]
  );

  const filteredProjects = useMemo(() => {
    const now = Date.now();
    return projects.filter((p) => {
      const isPendingActive =
        p.assignment?.responseStatus === "pending" &&
        p.assignment?.acceptanceDeadline &&
        new Date(p.assignment.acceptanceDeadline).getTime() > now;
      const isAcceptedAndNotCompleted =
        p.assignment?.responseStatus === "accepted" && p.status !== "completed";

      switch (projectStatus) {
        case "NEW":
          return p.status === "recent" && isPendingActive;
        case "IN_PROGRESS":
          // Show projects where freelancer accepted and client hasn't completed
          return isAcceptedAndNotCompleted;
        case "COMPLETED":
          return p.status === "completed";
        case "APPROVED":
          // Show projects where freelancer accepted (can overlap with IN_PROGRESS)
          return p.assignment?.responseStatus === "accepted";
        case "REJECTED":
          return p.status === "rejected";
        default:
          return true;
      }
    });
  }, [projects, projectStatus]);

  useEffect(() => {
    if (filteredProjects.length) {
      setCurrentIndex(0);
      setSelectedProjectId(filteredProjects[0].id);
    } else {
      setSelectedProjectId(null);
    }
  }, [filteredProjects]);

  const safeFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch(input, { ...init, signal: controller.signal });
      return res;
    },
    []
  );

  const reload = useCallback(async () => {
    try {
      const [meRes, ideasRes, projectsRes] = await Promise.all([
        safeFetch("/api/user/me", { cache: "no-store" }),
        safeFetch("/api/user/my-ideas?limit=6", { cache: "no-store" }),
        safeFetch("/api/user/projects", { cache: "no-store" }),
      ]);
      if (meRes.ok) setProfile((await meRes.json()).user);
      if (ideasRes.ok) setIdeas((await ideasRes.json()).ideas ?? []);
      if (projectsRes.ok)
        setProjects((await projectsRes.json()).projects ?? []);
    } catch (error) {
      console.error("Error reloading data:", error);
    }
  }, [safeFetch]);

  const previousProject = () => {
    if (currentIndex > 0) {
      const idx = currentIndex - 1;
      setCurrentIndex(idx);
      setSelectedProjectId(filteredProjects[idx]?.id ?? null);
    }
  };

  const nextProject = () => {
    if (currentIndex < filteredProjects.length - 1) {
      const idx = currentIndex + 1;
      setCurrentIndex(idx);
      setSelectedProjectId(filteredProjects[idx]?.id ?? null);
    }
  };

  useEffect(() => {
    if (!selectedProject) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (
        projectDetailRef.current &&
        !projectDetailRef.current.contains(t) &&
        !t.closest("[data-project-card]")
      ) {
        setSelectedProjectId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedProject]);

  const mutateProject = (
    projectId: string,
    update: Partial<AssignedProjectItem>
  ) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...update } : p))
    );
  };

  const postAction = async (url: string, onOk: () => void) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
    });
    if (res.ok) {
      onOk();
      return true;
    }
    const err = await res.json().catch(() => ({}));
    toast.error(err.message || "Action failed");
    return false;
  };

  const handleApprove = async (projectId: string) => {
    const prev = projects;
    mutateProject(projectId, { status: "approved" });
    const ok = await postAction(
      `/api/user/projects/${projectId}/approve`,
      () => {
        startTransition(() => setProjectStatus("APPROVED"));
        toast.success("Approved");
      }
    );
    if (!ok) setProjects(prev);
  };

  const handleReject = async (projectId: string) => {
    const prev = projects;
    mutateProject(projectId, { status: "rejected" });
    const ok = await postAction(
      `/api/user/projects/${projectId}/reject`,
      () => {
        startTransition(() => setProjectStatus("REJECTED"));
        toast.success("Rejected");
      }
    );
    if (!ok) setProjects(prev);
  };

  const handleExpired = async (projectId: string) => {
    const prev = projects;
    mutateProject(projectId, { status: "rejected" });
    const ok = await postAction(
      `/api/user/projects/${projectId}/expire`,
      () => {
        startTransition(() => setProjectStatus("REJECTED"));
        toast.success("Expired");
      }
    );
    if (!ok) setProjects(prev);
  };

  const handleAcceptAssignment = async (projectId: string) => {
    const prev = projects;
    const current = projects.find((p) => p.id === projectId);
    mutateProject(projectId, {
      status: "approved",
      assignment: current?.assignment
        ? ({ ...current.assignment, responseStatus: "accepted" } as any)
        : undefined,
    });
    const ok = await postAction(
      `/api/user/projects/${projectId}/accept`,
      () => {
        startTransition(() => setProjectStatus("APPROVED"));
        toast.success("Accepted");
        // Force refresh projects data to sync with server
        setTimeout(() => reload(), 1000);
      }
    );
    if (!ok) setProjects(prev);
  };

  const handleRejectAssignment = async (projectId: string) => {
    const prev = projects;
    const current = projects.find((p) => p.id === projectId);
    mutateProject(projectId, {
      status: "rejected",
      assignment: current?.assignment
        ? ({ ...current.assignment, responseStatus: "rejected" } as any)
        : undefined,
    });
    const ok = await postAction(
      `/api/user/projects/${projectId}/reject`,
      () => {
        startTransition(() => setProjectStatus("REJECTED"));
        toast.success("Assignment rejected");
        // Force refresh projects data to sync with server
        setTimeout(() => reload(), 1000);
      }
    );
    if (!ok) setProjects(prev);
  };

  if (!session?.user) return null;

  const isApprovalPending =
    profile?.adminApprovalStatus && profile.adminApprovalStatus !== "approved";

  return (
    <UserLayout user={session.user}>
      <section className="w-full py-6 flex-1 flex flex-col min-h-screen bg-white">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 flex-1 flex flex-col">
          {isApprovalPending && (
            <div className="mb-6 border border-blue-200 bg-blue-50 p-6 text-center rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-2 text-blue-900">Profile Submitted</h2>
              <p className="mb-2 text-blue-800">
                Your developer profile has been submitted and is awaiting admin approval. We&apos;ll notify you once it&apos;s approved.
              </p>
            </div>
          )}

          <div className="w-full">
            <ProfileSummary profile={profile} />

            {/* Dashboard Content */}
            <div className="mt-6 flex-1 flex flex-col">
                <div className="w-full flex-1 flex flex-col">
                        {/* Filter Bar */}
                  <div className="w-full pb-6 border-b border-gray-200 mb-6">
                          <ProjectStatusFilter
                            value={projectStatus}
                            onChange={(v) => startTransition(() => setProjectStatus(v))}
                          />
                        </div>

                  {/* Projects Content */}
                  <div className="mt-6 py-6 flex-1">
                    <div className="min-h-[800px] w-full overflow-visible">
                      <div className="space-y-6 w-full">
                        {filteredProjects.length > 0 && (
                          <div className="lg:hidden mb-6">
                            <div className="flex items-center justify-between border border-gray-200 bg-white p-4 rounded-xl shadow-md">
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={previousProject}
                                  disabled={currentIndex === 0}
                                  className="h-8 w-8 p-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm font-medium text-gray-900">
                                  {currentIndex + 1} of {filteredProjects.length}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={nextProject}
                                  disabled={currentIndex === filteredProjects.length - 1}
                                  className="h-8 w-8 p-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="text-sm text-gray-700">
                                {selectedProject?.name ?? "No project selected"}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Projects Layout - Full Width */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[500px] w-full">
                          <div className="lg:col-span-1">
                            <ProjectsSidebar
                              filter={projectStatus}
                              selectedProjectId={selectedProjectId}
                              onProjectSelect={(p) => {
                                startTransition(() => {
                                  setSelectedProjectId(p?.id ?? null);
                                  setSelectedInvitationId(null);
                                  const idx = p
                                    ? filteredProjects.findIndex((x) => x.id === p.id)
                                    : -1;
                                  if (idx >= 0) setCurrentIndex(idx);
                                });
                              }}
                              projects={projects}
                              selectedInvitationId={selectedInvitationId}
                              onInvitationSelect={(invitation) => {
                                setSelectedInvitationId(invitation?.id ?? null);
                                setSelectedInvitation(invitation);
                                setSelectedProjectId(null);
                              }}
                              portfolioLinks={profile?.portfolioLinks || profile?.portfolioItems || []}
                            />
                          </div>

                          <div className="lg:col-span-3" ref={projectDetailRef}>
                            {projectStatus === "MANUAL_INVITATIONS" ? (
                              <ManualInvitationDetail
                                invitation={selectedInvitation}
                                onAccept={async (invitationId) => {
                                  console.log(`🔄 Accepting invitation: ${invitationId}`);
                                  try {
                                    const response = await fetch(
                                      `/api/candidates/${invitationId}/accept`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        credentials: "include",
                                      }
                                    );

                                    if (response.ok) {
                                      toast.success("Invitation accepted successfully!");
                                      window.location.reload();
                                    } else {
                                      const errorData = await response.json();
                                      toast.error(
                                        errorData.error || "Failed to accept invitation"
                                      );
                                    }
                                  } catch (error) {
                                    console.error("Error accepting invitation:", error);
                                    toast.error("Something went wrong. Please try again.");
                                  }
                                }}
                                onReject={async (invitationId) => {
                                  console.log(`🔄 Rejecting invitation: ${invitationId}`);
                                  try {
                                    const response = await fetch(
                                      `/api/candidates/${invitationId}/reject`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        credentials: "include",
                                      }
                                    );

                                    if (response.ok) {
                                      toast.success("Invitation rejected successfully!");
                                      window.location.reload();
                                    } else {
                                      const errorData = await response.json();
                                      toast.error(
                                        errorData.error || "Failed to reject invitation"
                                      );
                                    }
                                  } catch (error) {
                                    console.error("Error rejecting invitation:", error);
                                    toast.error("Something went wrong. Please try again.");
                                  }
                                }}
                              />
                            ) : (
                              <ProjectDetail
                                project={selectedProject}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onExpired={handleExpired}
                                onAcceptAssignment={handleAcceptAssignment}
                                onRejectAssignment={handleRejectAssignment}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                    </div>
              </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
