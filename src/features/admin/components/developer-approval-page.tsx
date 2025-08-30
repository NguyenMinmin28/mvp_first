// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/features/shared/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone,
  Star,
  FileText,
  AlertTriangle,
  MessageSquare,
  Shield
} from "lucide-react";

import { toast } from "sonner";
import type { Prisma } from "@prisma/client";
type Role = Prisma.$Enums.Role;

interface DeveloperProfile {
  id: string;
  userId: string;
  level: "EXPERT" | "MID" | "FRESHER";
  adminApprovalStatus: "pending" | "approved" | "rejected" | "draft";
  currentStatus: "available" | "checking" | "busy";
  whatsAppVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
    phoneE164?: string;
  };
  skills: Array<{
    skill: {
      name: string;
      category: string;
    };
    years: number;
  }>;
  reviewsAggregate?: {
    averageRating: number;
    totalReviews: number;
  };
}

interface AdminUser {
  id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
  phoneE164: string | undefined;
  role: Role | undefined;
  isProfileCompleted: boolean | undefined;
}

interface Props {
  user: AdminUser;
}

export default function DeveloperApprovalPage({ user }: Props) {
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const fetchDevelopers = async () => {
    try {
      const response = await fetch("/api/admin/developers");
      if (response.ok) {
        const data = await response.json();
        setDevelopers(data.developers || []);
      } else {
        toast.error("Failed to load developers");
      }
    } catch (error) {
      console.error("Error fetching developers:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const handleApprovalAction = async (developerId: string, action: "approve" | "reject") => {
    setProcessingIds(prev => new Set(Array.from(prev).concat(developerId)));

    try {
      const response = await fetch(`/api/admin/developers/${developerId}/${action}`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success(`Developer ${action}d successfully!`);
        await fetchDevelopers();
      } else {
        const error = await response.json();
        toast.error(error.message || `Failed to ${action} developer`);
      }
    } catch (error) {
      console.error(`Error ${action}ing developer:`, error);
      toast.error("Something went wrong");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(developerId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      draft: "bg-gray-100 text-gray-800",
    };

    const icons = {
      pending: <Clock className="h-3 w-3" />,
      approved: <CheckCircle className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />,
      draft: <FileText className="h-3 w-3" />,
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.draft}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      EXPERT: "bg-purple-100 text-purple-800",
      MID: "bg-blue-100 text-blue-800",
      FRESHER: "bg-green-100 text-green-800",
    };

    return (
      <Badge className={colors[level as keyof typeof colors] || colors.MID}>
        {level}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredDevelopers = developers.filter(dev => {
    if (filter === "all") return true;
    return dev.adminApprovalStatus === filter;
  });

  const stats = {
    total: developers.length,
    pending: developers.filter(d => d.adminApprovalStatus === "pending").length,
    approved: developers.filter(d => d.adminApprovalStatus === "approved").length,
    rejected: developers.filter(d => d.adminApprovalStatus === "rejected").length,
  };

  return (
    <AdminLayout 
      user={user} 
      title="Developer Management"
      description="Review and approve developer applications"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Developers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Developer Applications</CardTitle>
              <div className="flex gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(status)}
                    className="capitalize"
                  >
                    {status}
                    {status !== "all" && (
                      <Badge className="ml-2 bg-gray-200 text-gray-800 text-xs">
                        {stats[status]}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredDevelopers.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900  mb-2">
                  No developers found
                </h3>
                <p className="text-gray-600">
                  {filter === "pending" 
                    ? "No pending applications at the moment." 
                    : `No ${filter} developers found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDevelopers.map((developer) => {
                  const isProcessing = processingIds.has(developer.id);
                  const isPending = developer.adminApprovalStatus === "pending";

                  return (
                    <Card key={developer.id} className="border-2 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">{developer.user.name}</h3>
                                {getLevelBadge(developer.level)}
                                {getStatusBadge(developer.adminApprovalStatus)}
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  <span>{developer.user.email}</span>
                                </div>
                                {developer.user.phoneE164 && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{developer.user.phoneE164}</span>
                                    {developer.whatsAppVerified && (
                                      <MessageSquare className="h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right text-sm text-gray-500">
                              <p>Applied: {formatDate(developer.createdAt)}</p>
                              <p>Updated: {formatDate(developer.updatedAt)}</p>
                            </div>
                          </div>

                          {/* Skills */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {developer.skills.map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {skill.skill.name} ({skill.years}y) - {skill.skill.category}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Reviews (if any) */}
                          {developer.reviewsAggregate && developer.reviewsAggregate.totalReviews > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>
                                {developer.reviewsAggregate.averageRating.toFixed(1)} 
                                ({developer.reviewsAggregate.totalReviews} reviews)
                              </span>
                            </div>
                          )}

                          {/* Status Indicators */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Shield className="h-4 w-4" />
                              <span>Status: {developer.currentStatus}</span>
                            </div>
                            {!developer.whatsAppVerified && (
                              <div className="flex items-center gap-1 text-yellow-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span>WhatsApp not verified</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {isPending && (
                            <div className="flex gap-3 pt-4 border-t">
                              <Button
                                onClick={() => handleApprovalAction(developer.id, "approve")}
                                disabled={isProcessing}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                {isProcessing ? (
                                  <LoadingSpinner size="sm" className="mr-2" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Approve
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => handleApprovalAction(developer.id, "reject")}
                                disabled={isProcessing}
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                              >
                                {isProcessing ? (
                                  <LoadingSpinner size="sm" className="mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
