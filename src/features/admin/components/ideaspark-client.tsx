"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import {
  Lightbulb,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  TrendingUp,
  Settings,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { AdminLayout } from "@/features/shared/components";
import { getServerSessionUser } from "@/features/auth/auth-server";

interface Idea {
  id: string;
  title: string;
  summary: string;
  status: string;
  authorId: string;
  author: {
    name: string | null;
    email: string | null;
  };
  createdAt: string;
  adminTags: string[];
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  connectCount: number;
}

interface Report {
  id: string;
  ideaId: string;
  reason: string;
  status: string;
  reporterId: string;
  reporter: {
    name: string | null;
    email: string | null;
  };
  createdAt: string;
}

export default function IdeaSparkClientPage({ user }: { user: any }) {
  const [pendingIdeas, setPendingIdeas] = useState<Idea[]>([]);
  const [approvedIdeas, setApprovedIdeas] = useState<Idea[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch pending ideas
      const pendingResponse = await fetch(
        "/api/admin/ideas/pending?limit=200&ts=" + Date.now(),
        { cache: "no-store" }
      );
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingIdeas(pendingData.ideas || []);
      }

      // Fetch approved ideas
      const approvedResponse = await fetch(
        "/api/ideas?status=APPROVED&limit=20",
        { cache: "no-store" }
      );
      if (approvedResponse.ok) {
        const approvedData = await approvedResponse.json();
        setApprovedIdeas(approvedData.ideas || []);
      }

      // Fetch reports
      const reportsResponse = await fetch("/api/admin/reports", {
        cache: "no-store",
      });
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveIdea = async (ideaId: string) => {
    try {
      const response = await fetch(`/api/admin/ideas/${ideaId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminTags: ["INSPIRATION"] }),
      });

      if (response.ok) {
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Error approving idea:", error);
    }
  };

  const handleRejectIdea = async (ideaId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/ideas/${ideaId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Error rejecting idea:", error);
    }
  };

  const handleResolveReport = async (reportId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Error resolving report:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReportStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="destructive">Open</Badge>;
      case "DISMISSED":
        return <Badge variant="secondary">Dismissed</Badge>;
      case "ACTIONED":
        return <Badge variant="default">Actioned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AdminLayout
      user={user as any}
      title="IdeaSpark Management"
      description="Manage community ideas, approvals, and reports"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Ideas
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                {pendingIdeas.length}
              </div>
              <p className="text-xs text-amber-700">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Approved Ideas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">
                {approvedIdeas.length}
              </div>
              <p className="text-xs text-emerald-700">Live on platform</p>
            </CardContent>
          </Card>

          <Card className="bg-rose-50 border-rose-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Open Reports
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-900">
                {reports.filter((r) => r.status === "OPEN").length}
              </div>
              <p className="text-xs text-rose-700">Need attention</p>
            </CardContent>
          </Card>

          <Card className="bg-indigo-50 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Engagement
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">
                {approvedIdeas.reduce(
                  (sum, idea) =>
                    sum +
                    idea.likeCount +
                    idea.commentCount +
                    idea.bookmarkCount +
                    idea.connectCount,
                  0
                )}
              </div>
              <p className="text-xs text-indigo-700">
                Likes, comments, bookmarks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Ideas ({pendingIdeas.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved Ideas ({approvedIdeas.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Reports ({reports.filter((r) => r.status === "OPEN").length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Pending Ideas Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ideas Awaiting Approval</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingIdeas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No pending ideas to review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {idea.title}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {idea.summary}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm text-gray-500">
                                by {idea.author.name || idea.author.email}
                              </span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {new Date(idea.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(idea.status)}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveIdea(idea.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleRejectIdea(
                                idea.id,
                                "Content does not meet guidelines"
                              )
                            }
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved Ideas Tab */}
          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedIdeas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No approved ideas yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {idea.title}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {idea.summary}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>
                                by {idea.author.name || idea.author.email}
                              </span>
                              <span>•</span>
                              <span>{idea.likeCount} likes</span>
                              <span>•</span>
                              <span>{idea.commentCount} comments</span>
                              <span>•</span>
                              <span>{idea.bookmarkCount} bookmarks</span>
                            </div>
                          </div>
                          {getStatusBadge(idea.status)}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit Tags
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Spotlight
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Community Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No reports to review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              Report #{report.id.slice(-6)}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Reason: {report.reason}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm text-gray-500">
                                by{" "}
                                {report.reporter.name || report.reporter.email}
                              </span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {new Date(
                                  report.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {getReportStatusBadge(report.status)}
                        </div>

                        {report.status === "OPEN" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleResolveReport(report.id, "dismiss")
                              }
                              variant="outline"
                            >
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleResolveReport(report.id, "warn")
                              }
                              variant="outline"
                            >
                              Warn User
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleResolveReport(report.id, "takedown")
                              }
                              variant="destructive"
                            >
                              Takedown Idea
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>IdeaSpark Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Weekly Spotlight</h4>
                  <p className="text-sm text-gray-600">
                    Automatically select top ideas for weekly spotlight
                  </p>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generate This Week's Spotlight
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Content Guidelines</h4>
                  <p className="text-sm text-gray-600">
                    Manage content policies and approval criteria
                  </p>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Guidelines
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Analytics</h4>
                  <p className="text-sm text-gray-600">
                    View IdeaSpark performance metrics
                  </p>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
