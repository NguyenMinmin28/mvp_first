"use client";

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import dynamic from "next/dynamic";
import ClevrsLoader from "@/features/shared/components/ClevrsLoader";
import { toast } from "sonner";
import { UserLayout } from "@/features/shared/components/user-layout";
import ProfileSummary from "@/features/developer/components/dashboard/profile-summary";
import IdeaSparkList from "@/features/developer/components/dashboard/ideaspark-list";
import ProjectStatusFilter, { type ProjectStatus as PS } from "@/features/developer/components/project-status-filter";
import { Button } from "@/ui/components/button";
import { ChevronLeft, ChevronRight, TestTube } from "lucide-react";

const ProjectsSidebar = dynamic(() => import("@/features/developer/components/dashboard/projects-sidebar"), { ssr: false, loading: () => <ClevrsLoader /> });
const ProjectDetail = dynamic(() => import("@/features/developer/components/dashboard/project-detail"), { ssr: false, loading: () => <ClevrsLoader /> });

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
  assignment?: { id: string; acceptanceDeadline: string; responseStatus: "pending" | "accepted" | "rejected" | "expired"; assignedAt: string; batchId: string };
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
  const [ideas, setIdeas] = useState<UserIdeaSummary[]>(Array.isArray(initialIdeas?.ideas) ? initialIdeas!.ideas : []);
  const [projects, setProjects] = useState<AssignedProjectItem[]>(Array.isArray(initialProjects?.projects) ? initialProjects!.projects : []);
  const [projectStatus, setProjectStatus] = useState<PS>("NEW");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id ?? null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTestingBatch, setIsTestingBatch] = useState(false);

  const projectDetailRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedProject = useMemo(
    () => (selectedProjectId ? projects.find(p => p.id === selectedProjectId) ?? null : null),
    [selectedProjectId, projects]
  );

  const filteredProjects = useMemo(() => {
    const now = Date.now();
    return projects.filter((p) => {
      const isPendingActive = p.assignment?.responseStatus === "pending" && p.assignment?.acceptanceDeadline && new Date(p.assignment.acceptanceDeadline).getTime() > now;
      switch (projectStatus) {
        case "NEW":
          return p.status === "recent" && isPendingActive;
        case "IN_PROGRESS":
          return p.status === "in_progress";
        case "COMPLETED":
          return p.status === "completed";
        case "APPROVED":
          return p.status === "approved";
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

  const safeFetch = useCallback(async (input: RequestInfo, init?: RequestInit) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  }, []);

  const reload = useCallback(async () => {
    try {
      const [meRes, ideasRes, projectsRes] = await Promise.all([
        safeFetch("/api/user/me", { cache: "no-store" }),
        safeFetch("/api/user/my-ideas?limit=6", { cache: "no-store" }),
        safeFetch("/api/user/projects", { cache: "no-store" }),
      ]);
      if (meRes.ok) setProfile((await meRes.json()).user);
      if (ideasRes.ok) setIdeas((await ideasRes.json()).ideas ?? []);
      if (projectsRes.ok) setProjects((await projectsRes.json()).projects ?? []);
    } catch {}
  }, [safeFetch]);

  const handleTestBatchAssignment = useCallback(async () => {
    try {
      setIsTestingBatch(true);
      const res = await safeFetch("/api/test-assign-batch", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        toast.success("🧪 Test batch assignment created!");
        await reload();
        window.dispatchEvent(new CustomEvent("notification-refresh"));
      } else {
        const e = await res.json().catch(() => ({}));
        toast.error(`Failed to create test assignment${e.error ? `: ${e.error}` : ""}`);
      }
    } finally {
      setIsTestingBatch(false);
    }
  }, [reload, safeFetch]);

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
      if (projectDetailRef.current && !projectDetailRef.current.contains(t) && !t.closest("[data-project-card]")) {
        setSelectedProjectId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedProject]);

  const mutateProject = (projectId: string, update: Partial<AssignedProjectItem>) => {
    setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, ...update } : p)));
  };

  const postAction = async (url: string, onOk: () => void) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() } });
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
    const ok = await postAction(`/api/user/projects/${projectId}/approve`, () => {
      startTransition(() => setProjectStatus("APPROVED"));
      toast.success("Approved");
    });
    if (!ok) setProjects(prev);
  };

  const handleReject = async (projectId: string) => {
    const prev = projects;
    mutateProject(projectId, { status: "rejected" });
    const ok = await postAction(`/api/user/projects/${projectId}/reject`, () => {
      startTransition(() => setProjectStatus("REJECTED"));
      toast.success("Rejected");
    });
    if (!ok) setProjects(prev);
  };

  const handleExpired = async (projectId: string) => {
    const prev = projects;
    mutateProject(projectId, { status: "rejected" });
    const ok = await postAction(`/api/user/projects/${projectId}/expire`, () => {
      startTransition(() => setProjectStatus("REJECTED"));
      toast.success("Expired");
    });
    if (!ok) setProjects(prev);
  };

  const handleAcceptAssignment = async (projectId: string) => {
    const prev = projects;
    const current = projects.find(p => p.id === projectId);
    mutateProject(projectId, { status: "approved", assignment: current?.assignment ? { ...current.assignment, responseStatus: "accepted" } as any : undefined });
    const ok = await postAction(`/api/user/projects/${projectId}/accept`, () => {
      startTransition(() => setProjectStatus("APPROVED"));
      toast.success("Accepted");
      // Force refresh projects data to sync with server
      setTimeout(() => reload(), 1000);
    });
    if (!ok) setProjects(prev);
  };

  const handleRejectAssignment = async (projectId: string) => {
    const prev = projects;
    const current = projects.find(p => p.id === projectId);
    mutateProject(projectId, { status: "rejected", assignment: current?.assignment ? { ...current.assignment, responseStatus: "rejected" } as any : undefined });
    const ok = await postAction(`/api/user/projects/${projectId}/reject`, () => {
      startTransition(() => setProjectStatus("REJECTED"));
      toast.success("Assignment rejected");
      // Force refresh projects data to sync with server
      setTimeout(() => reload(), 1000);
    });
    if (!ok) setProjects(prev);
  };

  if (!session?.user) return <ClevrsLoader />;

  return (
    <UserLayout user={session.user}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2"><ProfileSummary profile={profile} /></div>
          <div className="xl:col-span-1"><IdeaSparkList profile={profile} /></div>
        </div>

        <div className="mt-4 sm:mt-6">
          <ProjectStatusFilter value={projectStatus} onChange={(v) => startTransition(() => setProjectStatus(v))} />
        </div>

        <div className="mt-4 sm:mt-6">
          <div className="rounded-lg border">
            <div className="p-4 flex items-center gap-3">
              <TestTube className="h-5 w-5" />
              <div className="flex-1 text-sm text-gray-600">Create a test batch assignment to simulate receiving a new project invitation and notification.</div>
              <Button onClick={handleTestBatchAssignment} disabled={isTestingBatch} variant="outline">
                {isTestingBatch ? "Creating…" : "Create Test Batch Assignment"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6">
          {filteredProjects.length > 0 && (
            <div className="xl:hidden mb-4">
              <div className="flex items-center justify-between bg-white rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={previousProject} disabled={currentIndex === 0} className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                  <div className="text-sm font-medium">{currentIndex + 1} of {filteredProjects.length}</div>
                  <Button variant="outline" size="sm" onClick={nextProject} disabled={currentIndex === filteredProjects.length - 1} className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <div className="text-sm text-gray-600">{selectedProject?.name ?? "No project selected"}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 min-h-[500px] xl:min-h-[calc(100vh-400px)]">
            <div className="xl:col-span-1">
              <ProjectsSidebar
                filter={projectStatus}
                selectedProjectId={selectedProjectId}
                onProjectSelect={(p) => {
                  startTransition(() => {
                    setSelectedProjectId(p?.id ?? null);
                    const idx = p ? filteredProjects.findIndex(x => x.id === p.id) : -1;
                    if (idx >= 0) setCurrentIndex(idx);
                  });
                }}
                projects={projects}
              />
            </div>

            <div className="xl:col-span-2" ref={projectDetailRef}>
              <ProjectDetail
                project={selectedProject}
                onApprove={handleApprove}
                onReject={handleReject}
                onExpired={handleExpired}
                onAcceptAssignment={handleAcceptAssignment}
                onRejectAssignment={handleRejectAssignment}
              />
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}


