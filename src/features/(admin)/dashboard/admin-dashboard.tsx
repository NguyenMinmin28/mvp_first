"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Settings,
  BarChart3,
  Shield,
  User,
  Mail,
  Calendar,
  Activity,
  Database,
  FileText,
  Bell,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Download,
} from "lucide-react";

import { AdminLayout } from "@/features/shared/components/admin-layout";
import { Role, ProjectStatus, DevLevel, AdminApprovalStatus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Input } from "@/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { AdminProjectAssignmentModal } from "@/features/admin/components/admin-project-assignment-modal";
import { UserCronManagement } from "@/features/admin/components/user-cron-management";

interface AdminDashboardProps {
  user: {
    id: string;
    name: string | null | undefined;
    email: string | null | undefined;
    image: string | null | undefined;
    phoneE164: string | undefined;
    role: Role | undefined;
    isProfileCompleted: boolean | undefined;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  skillsRequired: string[]; // This will be skill names, not IDs
  createdAt: Date;
  contactRevealEnabled: boolean;
  contactRevealsCount: number;
  client: {
    user: {
      name: string | null;
      email: string | null;
    };
  };
  currentBatch?: {
    id: string;
    status: string;
    candidates: Array<{
      id: string;
      responseStatus: string;
      developer: {
        user: {
          name: string | null;
          email: string | null;
        };
        level: DevLevel;
      };
    }>;
  } | null;
  _count: {
    assignmentBatches: number;
    assignmentCandidates: number;
  };
}

interface Developer {
  id: string;
  level: DevLevel;
  adminApprovalStatus: AdminApprovalStatus;
  currentStatus: string;
  whatsappVerified: boolean;
  whatsappNumber: string | null;
  usualResponseTimeMs: number;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
  skills: Array<{
    skill: {
      name: string;
    };
  }>;
  _count: {
    assignmentCandidates: number;
  };
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [projectsRes, developersRes] = await Promise.all([
        fetch("/api/admin/projects"),
        fetch("/api/admin/developers"),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      if (developersRes.ok) {
        const developersData = await developersRes.json();
        setDevelopers(developersData.developers || []);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeveloperAction = async (developerId: string, action: "approve" | "reject", reason?: string) => {
    try {
      const response = await fetch(`/api/admin/developers/${developerId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, reason }),
      });

      if (response.ok) {
        // Refresh data
        fetchAdminData();
      } else {
        const error = await response.json();
        console.error("Error updating developer:", error);
      }
    } catch (error) {
      console.error("Error updating developer:", error);
    }
  };

  const handleAssignDeveloper = (project: Project) => {
    setSelectedProject(project);
    setAssignmentModalOpen(true);
  };

  const handleAssignmentComplete = () => {
    fetchAdminData();
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "submitted": return "bg-yellow-100 text-yellow-800";
      case "assigning": return "bg-blue-100 text-blue-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-green-100 text-green-800";
      case "completed": return "bg-purple-100 text-purple-800";
      case "canceled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: ProjectStatus) => {
    switch (status) {
      case "submitted": return "Submitted";
      case "assigning": return "Finding Developers";
      case "accepted": return "Developer Assigned";
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "canceled": return "Cancelled";
      default: return status;
    }
  };

  const getApprovalStatusColor = (status: AdminApprovalStatus) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelColor = (level: DevLevel) => {
    switch (level) {
      case "EXPERT": return "bg-purple-100 text-purple-800";
      case "MID": return "bg-blue-100 text-blue-800";
      case "FRESHER": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDevelopers = developers.filter(developer =>
    developer.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    developer.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === "assigning" || p.status === "accepted" || p.status === "in_progress").length,
    completedProjects: projects.filter(p => p.status === "completed").length,
    totalDevelopers: developers.length,
    approvedDevelopers: developers.filter(d => d.adminApprovalStatus === "approved").length,
    pendingApprovals: developers.filter(d => d.adminApprovalStatus === "pending").length,
  };

  if (isLoading) {
    return (
      <AdminLayout user={user} title="Admin Dashboard" description="Loading...">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      user={user}
      title="Admin Dashboard"
      description="Manage projects, developers, and system settings"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="developers">Developers</TabsTrigger>
          <TabsTrigger value="cron">Cron Jobs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeProjects} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Developers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDevelopers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.approvedDevelopers} approved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
                <p className="text-xs text-muted-foreground">
                  Developer applications
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedProjects}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully delivered
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Latest project activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.client.user.name || project.client.user.email}
                        </p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusText(project.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Developers awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {developers
                    .filter(d => d.adminApprovalStatus === "pending")
                    .slice(0, 5)
                    .map((developer) => (
                      <div key={developer.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{developer.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {developer.user.email}
                          </p>
                        </div>
                        <Badge className={getLevelColor(developer.level)}>
                          {developer.level}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button onClick={fetchAdminData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{project.title}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Client</p>
                      <p className="text-sm text-muted-foreground">
                        {project.client.user.name || project.client.user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Skills Required</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.skillsRequired.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {project.skillsRequired.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.skillsRequired.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Stats</p>
                      <p className="text-sm text-muted-foreground">
                        {project._count.assignmentBatches} batches, {project._count.assignmentCandidates} candidates
                      </p>
                      {project.contactRevealEnabled && (
                        <p className="text-sm text-green-600">
                          Contact revealed ({project.contactRevealsCount} times)
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {project.currentBatch && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Current Batch</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span> {project.currentBatch.status}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Candidates:</span> {project.currentBatch.candidates.length}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Accepted:</span>{" "}
                          {project.currentBatch.candidates.filter(c => c.responseStatus === "accepted").length}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {project.status === "assigning" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignDeveloper(project)}
                        className="flex-1"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Assign Developer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Developers Tab */}
        <TabsContent value="developers" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search developers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button onClick={fetchAdminData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-6">
            {filteredDevelopers.map((developer) => (
              <Card key={developer.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{developer.user.name}</CardTitle>
                      <CardDescription>{developer.user.email}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getApprovalStatusColor(developer.adminApprovalStatus)}>
                        {developer.adminApprovalStatus}
                      </Badge>
                      <Badge className={getLevelColor(developer.level)}>
                        {developer.level}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {developer.currentStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">
                        {developer.whatsappVerified ? "✅ Verified" : "❌ Not verified"}
                      </p>
                      {developer.whatsappNumber && (
                        <p className="text-xs text-muted-foreground">
                          {developer.whatsappNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Response Time</p>
                      <p className="text-sm text-muted-foreground">
                        ~{Math.floor(developer.usualResponseTimeMs / 60000)}m
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Assignments</p>
                      <p className="text-sm text-muted-foreground">
                        {developer._count.assignmentCandidates} total
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {developer.skills.map((skill) => (
                        <Badge key={skill.skill.name} variant="secondary" className="text-xs">
                          {skill.skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Admin Actions */}
                  {developer.adminApprovalStatus === "pending" && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDeveloperAction(developer.id, "approve")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeveloperAction(developer.id, "reject", "Insufficient documentation")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cron Jobs Tab */}
        <TabsContent value="cron" className="space-y-6">
          <UserCronManagement />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Manage application configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Database Status</p>
                    <p className="text-sm text-muted-foreground">MongoDB connection</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Authentication</p>
                    <p className="text-sm text-muted-foreground">NextAuth.js status</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">WhatsApp Integration</p>
                    <p className="text-sm text-muted-foreground">Business API status</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
              <CardDescription>Monitor and test system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">PayPal Reconciliation</p>
                    <p className="text-sm text-muted-foreground">Sync subscription states</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/cron/reconcile-subscriptions?test=true', {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test-secret'}`
                          }
                        });
                        const result = await response.json();
                        if (result.success) {
                          alert(`Reconciliation completed successfully!\nProcessed: ${result.data.processed}\nUpdated: ${result.data.updated}\nErrors: ${result.data.errors}`);
                        } else {
                          alert(`Reconciliation failed: ${result.error}`);
                        }
                      } catch (error) {
                        alert(`Error running reconciliation: ${error}`);
                      }
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Now
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Health Check</p>
                    <p className="text-sm text-muted-foreground">System status overview</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/cron/reconcile-subscriptions');
                        const result = await response.json();
                        if (result.success) {
                          alert(`System Health: ${result.health.status}\nRecent Webhooks: ${result.health.details.recentWebhooks}\nFailed Webhooks: ${result.health.details.failedWebhooks}`);
                        } else {
                          alert(`Health check failed: ${result.error}`);
                        }
                      } catch (error) {
                        alert(`Error checking health: ${error}`);
                      }
                    }}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Check Health
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Project Assignment Modal */}
      <AdminProjectAssignmentModal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        project={selectedProject}
        onAssignmentComplete={handleAssignmentComplete}
      />
    </AdminLayout>
  );
}
