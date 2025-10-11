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
import { ChevronLeft, ChevronRight, BarChart3, FileText, Lightbulb, Settings, FolderOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";

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
const OnboardingPortfolioGrid = dynamic(
  () =>
    import(
      "@/features/onboarding/freelancer/components/portfolio-grid"
    ).then((m) => m.PortfolioGrid),
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
      <section className="w-full py-8 flex-1 flex flex-col">
        <div className="container mx-auto px-4 flex-1 flex flex-col">
          {isApprovalPending && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Profile Submitted</h2>
              <p className="text-blue-800 mb-2">
                Your developer profile has been submitted and is awaiting admin approval. We'll notify you once it's approved.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-6 gap-4 sm:gap-6">
            <div className="xl:col-span-4">
              <ProfileSummary profile={profile} />

              {/* Dashboard Tabs - Responsive Design */}
              <div className="mt-6 sm:mt-8 relative z-30 -mx-4 sm:-mx-6 lg:-mx-8 flex-1 flex flex-col">
                <Tabs defaultValue="overview" className="w-full px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
                  {/* Mobile: Grid Layout */}
                  <div className="block sm:hidden">
                    <TabsList className="min-h-10 items-center bg-muted p-1 text-muted-foreground grid grid-cols-3 gap-2 px-4 py-3 rounded-xl border border-gray-200 shadow-md h-auto relative z-40 w-full">
                      <TabsTrigger
                        value="overview"
                        className="rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          Overview
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="projects"
                        className="rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Projects
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="portfolio"
                        className="rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          <FolderOpen className="w-3 h-3" />
                          Portfolio
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Desktop: Horizontal Layout */}
                  <div className="hidden sm:block">
                    <div className="relative w-full">
                      <div className="py-2" style={{scrollbarWidth: 'thin'}}>
                        <TabsList className="min-h-10 items-center bg-muted p-1 text-muted-foreground flex gap-2 justify-start px-4 py-3 rounded-xl border border-gray-200 shadow-md h-auto relative z-40 w-full" style={{minWidth: '100%'}}>
                          <TabsTrigger
                            value="overview"
                            className="relative group rounded-lg px-4 py-2.5 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 data-[state=inactive]:hover:shadow-sm whitespace-nowrap flex-shrink-0"
                          >
                            <span className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              Overview
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="projects"
                            className="relative group rounded-lg px-4 py-2.5 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 data-[state=inactive]:hover:shadow-sm whitespace-nowrap flex-shrink-0"
                          >
                            <span className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Projects
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="portfolio"
                            className="relative group rounded-lg px-4 py-2.5 font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-900 data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:hover:border-gray-400 data-[state=inactive]:hover:shadow-sm whitespace-nowrap flex-shrink-0"
                          >
                            <span className="flex items-center gap-2">
                              <FolderOpen className="w-4 h-4" />
                              Portfolio
                            </span>
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>
                  </div>

                  <TabsContent value="overview" className="mt-8 py-6 flex-1">
                    <div className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg border p-6">
                            <h3 className="text-lg font-semibold mb-2">Total Projects</h3>
                            <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
                            <p className="text-sm text-gray-500 mt-1">All assignments</p>
                          </div>
                          <div className="bg-white rounded-lg border p-6">
                            <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
                            <p className="text-3xl font-bold text-green-600">
                              {projects.filter(p => p.assignment?.responseStatus === "accepted" && p.status !== "completed").length}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Currently working</p>
                          </div>
                          <div className="bg-white rounded-lg border p-6">
                            <h3 className="text-lg font-semibold mb-2">Completed</h3>
                            <p className="text-3xl font-bold text-purple-600">
                              {projects.filter(p => p.status === "completed").length}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Successfully finished</p>
                          </div>
                          <div className="bg-white rounded-lg border p-6">
                            <h3 className="text-lg font-semibold mb-2">Pending</h3>
                            <p className="text-3xl font-bold text-orange-600">
                              {projects.filter(p => p.assignment?.responseStatus === "pending").length}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Awaiting response</p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">All Activities</h3>
                            <span className="text-sm text-gray-500">{projects.length} total activities</span>
                          </div>
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {projects.length > 0 ? (
                              projects.map((project) => (
                                <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-medium text-gray-900">{project.name}</p>
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        project.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                        project.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {project.status}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                      <span>Assigned: {new Date(project.date).toLocaleDateString()}</span>
                                      {project.assignment?.responseStatus && (
                                        <span className={`px-2 py-1 text-xs rounded ${
                                          project.assignment.responseStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                                          project.assignment.responseStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                          project.assignment.responseStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {project.assignment.responseStatus}
                                        </span>
                                      )}
                                      {project.budget && (
                                        <span className="text-green-600 font-medium">
                                          {project.currency || '$'}{project.budget}
                                        </span>
                                      )}
                                    </div>
                                    {project.skills && project.skills.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {project.skills.slice(0, 3).map((skill, index) => (
                                          <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                            {skill}
                                          </span>
                                        ))}
                                        {project.skills.length > 3 && (
                                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                            +{project.skills.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {project.assignment?.clientMessage && (
                                      <p className="text-xs text-gray-500 mt-1 italic">
                                        "{project.assignment.clientMessage}"
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-gray-500">
                                      {project.assignment?.assignedAt && (
                                        <div>Assigned: {new Date(project.assignment.assignedAt).toLocaleDateString()}</div>
                                      )}
                                      {project.assignment?.acceptanceDeadline && (
                                        <div className="text-xs text-orange-600">
                                          Deadline: {new Date(project.assignment.acceptanceDeadline).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <p>No activities recorded yet</p>
                                <p className="text-sm">Your project activities will appear here</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="projects" className="mt-8 py-6 flex-1">
                    <div className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
                      <div className="space-y-6">
                        <ProjectStatusFilter
                          value={projectStatus}
                          onChange={(v) => startTransition(() => setProjectStatus(v))}
                        />

                        {filteredProjects.length > 0 && (
                          <div className="xl:hidden mb-4">
                            <div className="flex items-center justify-between bg-white rounded-lg border p-3">
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={previousProject}
                                  disabled={currentIndex === 0}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm font-medium">
                                  {currentIndex + 1} of {filteredProjects.length}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={nextProject}
                                  disabled={currentIndex === filteredProjects.length - 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="text-sm text-gray-600">
                                {selectedProject?.name ?? "No project selected"}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-[500px]">
                          <div className="xl:col-span-1">
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

                          <div className="xl:col-span-2" ref={projectDetailRef}>
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
                  </TabsContent>

                  <TabsContent value="portfolio" className="mt-8 py-6 flex-1">
                    <div className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
                      {/** Use onboarding PortfolioGrid to enable per-slot add/edit with autosave */}
                      <OnboardingPortfolioGrid
                        initialPortfolios={
                          Array.isArray(profile?.portfolioLinks)
                            ? profile.portfolioLinks.map((p: any) => ({
                                id: p.id,
                                title: p.title || "",
                                description: p.description || "",
                                projectUrl: p.url || "",
                                imageUrl: p.imageUrl || "",
                              }))
                            : []
                        }
                        onPortfoliosChange={(updated: any[]) => {
                          setProfile((prev: any) => ({
                            ...(prev || {}),
                            portfolioLinks: updated
                              .map((p, index) => ({
                                id: p.id,
                                title: p.title,
                                description: p.description,
                                url: p.projectUrl,
                                imageUrl: p.imageUrl,
                                sortOrder: index,
                              }))
                              .filter(
                                (p) =>
                                  p.title || p.description || p.url || p.imageUrl
                              ),
                          }));
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <div className="xl:col-span-2">
              <IdeaSparkList profile={profile} developerId={profile?.id} />
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
