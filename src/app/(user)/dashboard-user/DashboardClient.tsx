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
import ClevrsLoader from "@/features/shared/components/ClevrsLoader";
import { toast } from "sonner";
import { UserLayout } from "@/features/shared/components/user-layout";
import ProfileSummary from "@/features/developer/components/dashboard/profile-summary";
import IdeaSparkList from "@/features/developer/components/dashboard/ideaspark-list";
import ProjectStatusFilter, {
  type ProjectStatus as PS,
} from "@/features/developer/components/project-status-filter";
import { Button } from "@/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ProjectsSidebar = dynamic(
  () => import("@/features/developer/components/dashboard/projects-sidebar"),
  { ssr: false, loading: () => <ClevrsLoader /> }
);
const ProjectDetail = dynamic(
  () => import("@/features/developer/components/dashboard/project-detail"),
  { ssr: false, loading: () => <ClevrsLoader /> }
);
const ManualInvitationDetail = dynamic(
  () =>
    import(
      "@/features/developer/components/dashboard/manual-invitation-detail"
    ),
  { ssr: false, loading: () => <ClevrsLoader /> }
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
  }, [filteredProjects.length]);

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
    } catch {}
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

  if (!session?.user) return <ClevrsLoader />;

  const isApprovalPending =
    profile?.adminApprovalStatus && profile.adminApprovalStatus !== "approved";

  return (
    <UserLayout user={session.user}>
      {/* Premium Background */}
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
        {/* Elegant Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDIiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] pointer-events-none opacity-60" />
        
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-black/5 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-900/5 rounded-full blur-3xl pointer-events-none" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          {/* Premium Approval Notice */}
          {isApprovalPending && (
            <div className="mb-6 animate-fade-in-up">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-4 lg:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-gray-900 mb-1">Account Verification Pending</h3>
                      <p className="text-sm text-gray-700 font-medium">
                        Your account is being reviewed by our admin team. You can still browse and use the dashboard. We'll notify you once approved.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid - Enhanced */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="xl:col-span-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-black rounded-3xl blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
                <div className="relative">
                  <ProfileSummary profile={profile} />
                </div>
              </div>
            </div>
            <div className="xl:col-span-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-black rounded-3xl blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
                <div className="relative">
                  <IdeaSparkList profile={profile} />
                </div>
              </div>
            </div>
          </div>

          {/* Project Filter - Premium Design */}
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="relative group">
              <div className="absolute inset-0 bg-black rounded-2xl blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
              <div className="relative">
                <ProjectStatusFilter
                  value={projectStatus}
                  onChange={(v) => startTransition(() => setProjectStatus(v))}
                />
              </div>
            </div>
          </div>

          {/* Mobile Navigation - Premium */}
          {filteredProjects.length > 0 && (
            <div className="xl:hidden mb-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="relative group">
                <div className="absolute inset-0 bg-black rounded-2xl blur-xl opacity-5 group-hover:opacity-10 transition-opacity duration-300" />
                <div className="relative bg-white/80 backdrop-blur-lg border-2 border-gray-200 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={previousProject}
                        disabled={currentIndex === 0}
                        className="h-10 w-10 p-0 bg-black hover:bg-gray-900 text-white border-0 disabled:bg-gray-300 disabled:text-gray-500 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <div className="px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl font-black text-sm shadow-md">
                        {currentIndex + 1} / {filteredProjects.length}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextProject}
                        disabled={currentIndex === filteredProjects.length - 1}
                        className="h-10 w-10 p-0 bg-black hover:bg-gray-900 text-white border-0 disabled:bg-gray-300 disabled:text-gray-500 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-900 font-bold truncate ml-3">
                      {selectedProject?.name ?? "No project selected"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Projects Grid - Enhanced */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 min-h-[500px] xl:min-h-[calc(100vh-400px)] animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            {/* Sidebar with Shadow Effect */}
            <div className="xl:col-span-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-black rounded-3xl blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
                <div className="relative">
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
                  />
                </div>
              </div>
            </div>

            {/* Detail Panel with Shadow Effect */}
            <div className="xl:col-span-2" ref={projectDetailRef}>
              <div className="relative group">
                <div className="absolute inset-0 bg-black rounded-3xl blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
                <div className="relative">
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
                        // Refresh the projects list
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
                        // Refresh the projects list
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

          {/* Portfolio Gallery - Bold & Creative Section */}
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <div className="relative group/gallery overflow-hidden">
              {/* Dramatic Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-95" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40" />
              
              {/* Animated Gradient Orbs */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '8s' }} />
              
              <div className="relative z-10 rounded-3xl border-2 border-white/10 hover:border-white/20 transition-all duration-500 shadow-2xl p-6 lg:p-10">
                {/* Bold Header */}
                <div className="flex items-center justify-between mb-8 lg:mb-10">
                  <div className="flex items-center gap-4">
                    <div className="relative group/icon">
                      <div className="absolute inset-0 bg-white rounded-2xl blur-xl opacity-30 group-hover/icon:opacity-50 transition-opacity duration-500" />
                      <div className="relative w-14 h-14 lg:w-16 lg:h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 group-hover/icon:rotate-12 transition-all duration-500">
                        <svg className="w-7 h-7 lg:w-8 lg:h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-1">Portfolio Gallery</h2>
                      <p className="text-sm lg:text-base text-gray-400 font-medium">Showcase of creative excellence</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center gap-2">
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
                      <span className="text-white font-black text-sm">5 Projects</span>
                    </div>
                  </div>
                </div>

                {/* Bold Gallery Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                  {[
                    { url: 'https://reallygooddesigns.com/wp-content/uploads/2024/11/creative-website-designs.jpg', delay: 0 },
                    { url: 'https://53.fs1.hubspotusercontent-na1.net/hubfs/53/website-design-16-20241121-8236349.webp', delay: 100 },
                    { url: 'https://static.vecteezy.com/system/resources/previews/016/547/646/non_2x/creative-website-template-designs-illustration-concepts-of-web-page-design-for-website-and-mobile-website-vector.jpg', delay: 200 },
                    { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnXfZO3obE15TS3kuUeF7pv6XkNSOVJeihyQ&s', delay: 300 },
                    { url: 'https://img.freepik.com/free-vector/cartoon-web-design-landing-page_52683-70880.jpg?semt=ais_hybrid&w=740&q=80', delay: 400 }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className="relative group/item animate-fade-in-up"
                      style={{ animationDelay: `${item.delay}ms` }}
                    >
                      {/* Dramatic Glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-2xl blur-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 animate-pulse" />
                      
                      {/* Image Container */}
                      <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-white/20 group-hover/item:border-white shadow-xl group-hover/item:shadow-2xl transition-all duration-500 cursor-pointer bg-black/50">
                        {/* Diagonal Shine */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/40 to-white/0 -translate-x-full -translate-y-full group-hover/item:translate-x-full group-hover/item:translate-y-full transition-transform duration-1000 z-10" />
                        
                        {/* Image */}
                        <img 
                          src={item.url} 
                          alt={`Portfolio ${idx + 1}`}
                          className="w-full h-full object-cover group-hover/item:scale-125 group-hover/item:rotate-3 transition-all duration-700 filter grayscale-0 group-hover/item:grayscale-0"
                        />
                        
                        {/* Bold Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center z-20 gap-3">
                          <div className="transform translate-y-4 group-hover/item:translate-y-0 transition-transform duration-500">
                            <svg className="w-10 h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                          <div className="transform translate-y-4 group-hover/item:translate-y-0 transition-transform duration-500 delay-75">
                            <span className="text-white font-black text-sm lg:text-base uppercase tracking-wider">View Project</span>
                          </div>
                        </div>
                        
                        {/* Floating Number Badge */}
                        <div className="absolute -top-2 -right-2 w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center shadow-2xl z-30 group-hover/item:scale-125 group-hover/item:-rotate-12 transition-all duration-500">
                          <span className="text-base lg:text-lg font-black text-black">{idx + 1}</span>
                        </div>
                        
                        {/* Corner Accent */}
                        <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[30px] border-l-white border-b-[30px] border-b-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 z-30" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* View All Button */}
                <div className="mt-8 lg:mt-10 flex justify-center">
                  <button className="group/btn relative overflow-hidden px-8 py-4 lg:px-10 lg:py-5 bg-white hover:bg-gray-100 rounded-2xl shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-500 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                    <div className="relative flex items-center gap-3">
                      <span className="text-lg lg:text-xl font-black text-black uppercase tracking-wider">View All Projects</span>
                      <svg className="w-6 h-6 text-black group-hover/btn:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
