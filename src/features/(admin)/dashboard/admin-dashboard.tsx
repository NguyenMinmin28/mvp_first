// @ts-nocheck
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
import type { Prisma } from "@prisma/client";
type Role = Prisma.$Enums.Role;
type ProjectStatus = Prisma.$Enums.ProjectStatus;
type DevLevel = Prisma.$Enums.DevLevel;
type AdminApprovalStatus = Prisma.$Enums.AdminApprovalStatus;
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
    name?: string | null;
    email?: string | null;
    image?: string | null;
    phoneE164?: string;
    role?: Role | string;
    isProfileCompleted?: boolean;
    adminApprovalStatus?: string;
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

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  status: string;
  type: string;
  category?: {
    name: string;
  };
  author: {
    name: string;
  };
  views: number;
  clicks: number;
  isFeatured: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [projectsRes, developersRes, blogPostsRes] = await Promise.all([
        fetch("/api/admin/projects"),
        fetch("/api/admin/developers"),
        fetch("/api/admin/blog/posts"),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      if (developersRes.ok) {
        const developersData = await developersRes.json();
        setDevelopers(developersData.developers || []);
      }

      if (blogPostsRes.ok) {
        const blogPostsData = await blogPostsRes.json();
        setBlogPosts(blogPostsData.posts || []);
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
    totalBlogPosts: blogPosts.length,
    publishedPosts: blogPosts.filter(p => p.status === "PUBLISHED").length,
    draftPosts: blogPosts.filter(p => p.status === "DRAFT").length,
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full" style={{ width: '100%' }}>
        <TabsList className="flex w-full justify-center flex-wrap gap-2" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="developers">Developers</TabsTrigger>
          <TabsTrigger value="blog">Blog Management</TabsTrigger>
          <TabsTrigger value="cron">Cron Jobs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 w-full" style={{ width: '100%' }}>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 w-full" style={{ width: '100%' }}>
            <Card className="border-4 border-gray-300 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 border-b-2 border-gray-200">
                <CardTitle className="text-sm font-bold text-gray-800">Total Projects</CardTitle>
                <FileText className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
                <p className="text-xs text-gray-600">
                  {stats.activeProjects} active
                </p>
              </CardContent>
            </Card>

            <Card className="border-4 border-gray-300 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 border-b-2 border-gray-200">
                <CardTitle className="text-sm font-bold text-gray-800">Total Developers</CardTitle>
                <Users className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalDevelopers}</div>
                <p className="text-xs text-gray-600">
                  {stats.approvedDevelopers} approved
                </p>
              </CardContent>
            </Card>

            <Card className="border-4 border-gray-300 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 border-b-2 border-gray-200">
                <CardTitle className="text-sm font-bold text-gray-800">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</div>
                <p className="text-xs text-gray-600">
                  Developer applications
                </p>
              </CardContent>
            </Card>

            <Card className="border-4 border-gray-300 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 border-b-2 border-gray-200">
                <CardTitle className="text-sm font-bold text-gray-800">Completed Projects</CardTitle>
                <CheckCircle className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{stats.completedProjects}</div>
                <p className="text-xs text-gray-600">
                  Successfully delivered
                </p>
              </CardContent>
            </Card>

            <Card className="border-4 border-gray-300 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50 border-b-2 border-gray-200">
                <CardTitle className="text-sm font-bold text-gray-800">Blog Posts</CardTitle>
                <FileText className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalBlogPosts}</div>
                <p className="text-xs text-gray-600">
                  {stats.publishedPosts} published, {stats.draftPosts} drafts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 w-full" style={{ width: '100%' }}>
            <Card className="border-4 border-gray-300 shadow-lg">
              <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                <CardTitle className="text-gray-800 font-bold">Recent Projects</CardTitle>
                <CardDescription className="text-gray-600">Latest project activities</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{project.title}</p>
                        <p className="text-sm text-gray-600">
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

            <Card className="border-4 border-gray-300 shadow-lg">
              <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                <CardTitle className="text-gray-800 font-bold">Pending Approvals</CardTitle>
                <CardDescription className="text-gray-600">Developers awaiting approval</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {developers
                    .filter(d => d.adminApprovalStatus === "pending")
                    .slice(0, 5)
                    .map((developer) => (
                      <div key={developer.id} className="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">{developer.user.name}</p>
                          <p className="text-sm text-gray-600">
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

          <div className="overflow-x-auto rounded-lg border-4 border-gray-300 shadow-lg w-full" style={{ width: '100%' }}>
            <table className="w-full border-collapse" style={{ width: '100%' }}>
              <thead className="bg-gray-100 border-b-4 border-gray-400">
                <tr>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Project</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Client</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Skills Required</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Stats</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Current Batch</th>
                  <th className="text-left p-3 font-bold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="border-b-2 border-gray-300 hover:bg-gray-100">
                    <td className="p-3 border-r-2 border-gray-300">
                      <div>
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-muted-foreground">{project.description}</div>
                        <div className="mt-1">
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusText(project.status)}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      <div>
                        <div className="font-medium">
                          {project.client.user.name || project.client.user.email}
                        </div>
                        {project.contactRevealEnabled && (
                          <div className="text-xs text-green-600">
                            Contact revealed ({project.contactRevealsCount} times)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      <div className="flex flex-wrap gap-1">
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
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      <div className="text-sm">
                        <div>{project._count.assignmentBatches} batches</div>
                        <div>{project._count.assignmentCandidates} candidates</div>
                      </div>
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      {project.currentBatch ? (
                        <div className="text-sm">
                          <div><span className="text-muted-foreground">Status:</span> {project.currentBatch.status}</div>
                          <div><span className="text-muted-foreground">Candidates:</span> {project.currentBatch.candidates.length}</div>
                          <div><span className="text-muted-foreground">Accepted:</span>{" "}
                            {project.currentBatch.candidates.filter(c => c.responseStatus === "accepted").length}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No active batch</span>
                      )}
                    </td>
                    <td className="p-3">
                      {project.status === "assigning" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignDeveloper(project)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign Developer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

          <div className="overflow-x-auto rounded-lg border-4 border-gray-300 shadow-lg">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 border-b-4 border-gray-400">
                <tr>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Developer</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Status</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">WhatsApp</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Response Time</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Assignments</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Skills</th>
                  <th className="text-left p-3 font-bold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevelopers.map((developer) => (
                  <tr key={developer.id} className="border-b-2 border-gray-300 hover:bg-gray-100">
                    <td className="p-3 border-r-2 border-gray-300">
                      <div>
                        <div className="font-medium">{developer.user.name}</div>
                        <div className="text-sm text-muted-foreground">{developer.user.email}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge className={getApprovalStatusColor(developer.adminApprovalStatus)}>
                            {developer.adminApprovalStatus}
                          </Badge>
                          <Badge className={getLevelColor(developer.level)}>
                            {developer.level}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      <span className="capitalize">{developer.currentStatus}</span>
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      <div>
                        <span className={developer.whatsappVerified ? "text-green-600" : "text-red-600"}>
                          {developer.whatsappVerified ? "✅ Verified" : "❌ Not verified"}
                        </span>
                        {developer.whatsappNumber && (
                          <div className="text-xs text-muted-foreground">
                            {developer.whatsappNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      ~{Math.floor(developer.usualResponseTimeMs / 60000)}m
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      {developer._count.assignmentCandidates} total
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      <div className="flex flex-wrap gap-1">
                        {developer.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill.skill.name} variant="secondary" className="text-xs">
                            {skill.skill.name}
                          </Badge>
                        ))}
                        {developer.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{developer.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {developer.adminApprovalStatus === "pending" && (
                        <div className="flex gap-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Blog Management Tab */}
        <TabsContent value="blog" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchAdminData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => window.open('/admin/blog/new', '_blank')}>
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border-4 border-gray-300 shadow-lg">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 border-b-4 border-gray-400">
                <tr>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Post</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Author</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Category</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Status</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Stats</th>
                  <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Published</th>
                  <th className="text-left p-3 font-bold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogPosts
                  .filter(post => 
                    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    post.author.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((post) => (
                  <tr key={post.id} className="border-b-2 border-gray-300 hover:bg-gray-100">
                    <td className="p-3 border-r-2 border-gray-300">
                      <div>
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-muted-foreground">{post.excerpt}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {post.type}
                          </Badge>
                          {post.isFeatured && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      <div className="font-medium">{post.author.name}</div>
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      {post.category ? (
                        <Badge variant="outline" className="text-xs">
                          {post.category.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No category</span>
                      )}
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      <Badge className={
                        post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        post.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        post.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {post.status}
                      </Badge>
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      <div className="text-sm">
                        <div>👁️ {post.views} views</div>
                        <div>🖱️ {post.clicks} clicks</div>
                      </div>
                    </td>
                    <td className="p-3 border-r-2 border-gray-300">
                      <div className="text-sm">
                        {post.publishedAt ? (
                          <div>{new Date(post.publishedAt).toLocaleDateString()}</div>
                        ) : (
                          <span className="text-muted-foreground">Not published</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/admin/blog/edit/${post.id}`, '_blank')}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this post?')) {
                              try {
                                const response = await fetch(`/api/admin/blog/posts/${post.id}`, {
                                  method: 'DELETE',
                                });
                                if (response.ok) {
                                  fetchAdminData();
                                }
                              } catch (error) {
                                console.error('Error deleting post:', error);
                              }
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
