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
import { ChevronLeft, ChevronRight, BarChart3, FileText, FolderOpen, Briefcase, CheckCircle2, Clock, AlertCircle, Calendar, DollarSign, Tag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";

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
      <section className="w-full py-4 flex-1 flex flex-col">
        <div className="w-full max-w-full mx-auto px-4 flex-1 flex flex-col">
          {isApprovalPending && (
            <div className="mb-4 border p-4 text-center">
              <h2 className="text-xl font-bold mb-2">Profile Submitted</h2>
              <p className="mb-2">
                Your developer profile has been submitted and is awaiting admin approval. We&apos;ll notify you once it&apos;s approved.
              </p>
            </div>
          )}

          <div className="w-full">
            <ProfileSummary profile={profile} />

            {/* Dashboard Tabs */}
            <div className="mt-4 flex-1 flex flex-col">
                <Tabs defaultValue="overview" className="w-full flex-1 flex flex-col">
                  <TabsList className="flex gap-1 border-b mb-4 w-full bg-transparent">
                    <TabsTrigger
                      value="overview"
                      className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                    >
                      <span className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Overview
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="projects"
                      className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Projects
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="portfolio"
                      className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                    >
                      <span className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        Portfolio
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4 py-4 flex-1">
                    <div className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto w-full">
                      <div className="space-y-4 w-full">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-blue-500 rounded-lg">
                                <Briefcase className="h-5 w-5 text-white" />
                              </div>
                              <h3 className="text-sm font-semibold text-blue-900">Total Projects</h3>
                            </div>
                            <p className="text-3xl font-bold text-blue-700 mb-1">{projects.length}</p>
                            <p className="text-xs text-blue-600">All assignments</p>
                          </div>

                          <div className="border border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 p-5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-green-500 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-white" />
                              </div>
                              <h3 className="text-sm font-semibold text-green-900">Active Projects</h3>
                            </div>
                            <p className="text-3xl font-bold text-green-700 mb-1">
                              {projects.filter(p => p.assignment?.responseStatus === "accepted" && p.status !== "completed").length}
                            </p>
                            <p className="text-xs text-green-600">Currently working</p>
                          </div>

                          <div className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-purple-500 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-white" />
                              </div>
                              <h3 className="text-sm font-semibold text-purple-900">Completed</h3>
                            </div>
                            <p className="text-3xl font-bold text-purple-700 mb-1">
                              {projects.filter(p => p.status === "completed").length}
                            </p>
                            <p className="text-xs text-purple-600">Successfully finished</p>
                          </div>

                          <div className="border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 p-5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-orange-500 rounded-lg">
                                <Clock className="h-5 w-5 text-white" />
                              </div>
                              <h3 className="text-sm font-semibold text-orange-900">Pending</h3>
                            </div>
                            <p className="text-3xl font-bold text-orange-700 mb-1">
                              {projects.filter(p => p.assignment?.responseStatus === "pending").length}
                            </p>
                            <p className="text-xs text-orange-600">Awaiting response</p>
                          </div>
                        </div>
                        
                        {/* Activities Section */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
                          <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-500 rounded-lg">
                                  <BarChart3 className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">All Activities</h3>
                              </div>
                              <div className="px-3 py-1 border border-blue-200 bg-blue-50 rounded-md">
                                <span className="text-sm font-semibold text-blue-700">{projects.length}</span>
                                <span className="text-xs text-blue-600 ml-1">total</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50">
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {projects.length > 0 ? (
                                projects.map((project) => {
                                  const statusColors: Record<string, string> = {
                                    completed: 'bg-green-100 text-green-800 border-green-300',
                                    approved: 'bg-blue-100 text-blue-800 border-blue-300',
                                    rejected: 'bg-red-100 text-red-800 border-red-300',
                                    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                                    recent: 'bg-gray-100 text-gray-800 border-gray-300'
                                  };
                                  const responseColors: Record<string, string> = {
                                    accepted: 'bg-green-100 text-green-700 border-green-300',
                                    rejected: 'bg-red-100 text-red-700 border-red-300',
                                    pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
                                    expired: 'bg-gray-100 text-gray-700 border-gray-300',
                                  };
                                  return (
                                    <div key={project.id} className="border border-gray-200 bg-white p-4 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-3 mb-2">
                                            <div className="p-1.5 bg-blue-100 rounded-md">
                                              <FileText className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <h4 className="font-semibold flex-1 text-gray-900">{project.name}</h4>
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${statusColors[project.status] || statusColors.recent}`}>
                                              {project.status}
                                            </span>
                                          </div>

                                          <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                              <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                              <span>{new Date(project.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            {project.assignment?.responseStatus && (
                                              <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${responseColors[project.assignment.responseStatus] || responseColors.expired}`}>
                                                {project.assignment.responseStatus}
                                              </span>
                                            )}
                                            {project.budget && (
                                              <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                                                <DollarSign className="h-3.5 w-3.5" />
                                                <span>{project.currency || '$'}{project.budget}</span>
                                              </div>
                                            )}
                                          </div>

                                          {project.skills && project.skills.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                              <Tag className="h-3.5 w-3.5 text-gray-400" />
                                              {project.skills.slice(0, 3).map((skill, index) => {
                                                // skill can be either ID (string) or name (string)
                                                // getSkillName will return the name if found, or the ID if not found
                                                // If skill looks like an ID (long string), try to get name
                                                // Otherwise, assume it's already a name
                                                const skillIdOrName = String(skill || '');
                                                const skillName = skillIdOrName.length > 20 || skillIdOrName.match(/^[a-f0-9]{24}$/i)
                                                  ? getSkillName(skillIdOrName)
                                                  : skillIdOrName;
                                                return (
                                                  <span key={index} className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                                                    {skillName}
                                                  </span>
                                                );
                                              })}
                                              {project.skills.length > 3 && (
                                                <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                                                  +{project.skills.length - 3} more
                                                </span>
                                              )}
                                            </div>
                                          )}

                                          {project.assignment?.clientMessage && (
                                            <div className="mt-2 p-2 border-l-4 border-blue-400 bg-blue-50 rounded-r">
                                              <p className="text-xs italic line-clamp-2 text-gray-700">
                                                &quot;{project.assignment.clientMessage}&quot;
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex-shrink-0 text-right">
                                          {project.assignment?.assignedAt && (
                                            <div className="mb-2 p-2 border border-gray-200 bg-gray-50 rounded-md">
                                              <div className="text-xs text-gray-600 mb-1">Assigned</div>
                                              <div className="text-sm font-medium text-gray-900">
                                                {new Date(project.assignment.assignedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </div>
                                            </div>
                                          )}
                                          {project.assignment?.acceptanceDeadline && (
                                            <div className="p-2 border border-orange-200 bg-orange-50 rounded-md">
                                              <div className="flex items-center gap-1 text-xs text-orange-600 mb-1">
                                                <AlertCircle className="h-3 w-3" />
                                                <span>Deadline</span>
                                              </div>
                                              <div className="text-sm font-semibold text-orange-700">
                                                {new Date(project.assignment.acceptanceDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-12">
                                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                  <p className="text-gray-600 font-medium mb-1">No activities recorded yet</p>
                                  <p className="text-sm text-gray-500">Your project activities will appear here</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="projects" className="mt-4 py-4 flex-1">
                    <div className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto w-full">
                      <div className="space-y-4 w-full">
                        {/* Filter Bar */}
                        <div className="w-full pb-4 border-b">
                          <ProjectStatusFilter
                            value={projectStatus}
                            onChange={(v) => startTransition(() => setProjectStatus(v))}
                          />
                        </div>

                        {filteredProjects.length > 0 && (
                          <div className="lg:hidden mb-4">
                            <div className="flex items-center justify-between border p-3">
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
                  </TabsContent>

                  <TabsContent value="portfolio" className="mt-4 py-4 flex-1">
                    <div className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto w-full">
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
        </div>
      </section>
    </UserLayout>
  );
}
