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
  Shield,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { toast } from "sonner";
import type { Prisma } from "@prisma/client";
type Role = Prisma.$Enums.Role;

interface DeveloperProfile {
  id: string;
  userId: string;
  level: "EXPERT" | "MID" | "FRESHER";
  adminApprovalStatus: "pending" | "approved" | "rejected" | "draft";
  currentStatus: "available" | "checking" | "busy" | "away";
  whatsappVerified: boolean;
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

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function DeveloperApprovalPage({ user }: Props) {
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [whatsappProcessingIds, setWhatsappProcessingIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "whatsapp-verified" | "whatsapp-not-verified">("pending");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchDevelopers = async (page: number = pagination.page, newFilter?: string) => {
    try {
      const currentFilter = newFilter || filter;
      const response = await fetch(`/api/admin/developers?page=${page}&limit=${pagination.limit}&filter=${currentFilter}`);
      if (response.ok) {
        const data = await response.json();
        setDevelopers(data.developers || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchDevelopers(newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    fetchDevelopers(1);
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDevelopers(1, newFilter);
  };

  const handleApprovalAction = async (developerId: string, action: "approve" | "reject") => {
    setProcessingIds(prev => new Set(Array.from(prev).concat(developerId)));

    try {
      const response = await fetch(`/api/admin/developers/${developerId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: action,
          reason: action === "reject" ? "Rejected by admin" : undefined,
        }),
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

  const handleWhatsappToggle = async (developerId: string, currentStatus: boolean) => {
    setWhatsappProcessingIds(prev => new Set(Array.from(prev).concat(developerId)));

    try {
      const response = await fetch(`/api/admin/developers/${developerId}/whatsapp-verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsappVerified: !currentStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        await fetchDevelopers();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update WhatsApp verification");
      }
    } catch (error) {
      console.error("Error updating WhatsApp verification:", error);
      toast.error("Something went wrong");
    } finally {
      setWhatsappProcessingIds(prev => {
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

  // Note: Filtering is now handled server-side via API parameters
  // This is just for display purposes
  const filteredDevelopers = developers;

  // For now, we'll use client-side stats since we don't have server-side stats endpoint
  // In production, you might want to create a separate stats endpoint
  const stats = {
    total: pagination.totalCount,
    pending: developers.filter(d => d.adminApprovalStatus === "pending").length,
    approved: developers.filter(d => d.adminApprovalStatus === "approved").length,
    rejected: developers.filter(d => d.adminApprovalStatus === "rejected").length,
    whatsappVerified: developers.filter(d => d.whatsappVerified).length,
    whatsappNotVerified: developers.filter(d => !d.whatsappVerified).length,
  };

  return (
    <AdminLayout 
      user={user} 
      title="Developer Management"
      description="Review and approve developer applications"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">WhatsApp Verified</p>
                  <p className="text-2xl font-bold text-green-600">{stats.whatsappVerified}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">WhatsApp Not Verified</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.whatsappNotVerified}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Developer Applications</CardTitle>
              <div className="flex gap-2 flex-wrap">
                {(["all", "pending", "approved", "rejected", "whatsapp-verified", "whatsapp-not-verified"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange(status)}
                    className="capitalize"
                  >
                    {status.replace("-", " ")}
                    {status !== "all" && (
                      <Badge className="ml-2 bg-gray-200 text-gray-800 text-xs">
                        {status === "whatsapp-verified" ? stats.whatsappVerified :
                         status === "whatsapp-not-verified" ? stats.whatsappNotVerified :
                         stats[status as keyof typeof stats]}
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Developers Found
                </h3>
                <p className="text-gray-600">
                  {filter === "pending" 
                    ? "No pending applications at the moment." 
                    : filter === "whatsapp-verified"
                    ? "No WhatsApp verified developers found."
                    : filter === "whatsapp-not-verified"
                    ? "No WhatsApp unverified developers found."
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                <span>Status: {developer.currentStatus}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm">WhatsApp:</span>
                                <Badge 
                                  className={developer.whatsappVerified 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                  }
                                >
                                  {developer.whatsappVerified ? "Verified" : "Not Verified"}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* WhatsApp Toggle Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWhatsappToggle(developer.id, developer.whatsappVerified)}
                              disabled={whatsappProcessingIds.has(developer.id)}
                              className={`flex items-center gap-2 ${
                                developer.whatsappVerified 
                                  ? "border-green-300 text-green-600 hover:bg-green-50" 
                                  : "border-red-300 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {whatsappProcessingIds.has(developer.id) ? (
                                <LoadingSpinner size="sm" />
                              ) : developer.whatsappVerified ? (
                                <>
                                  <ToggleRight className="h-4 w-4" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4" />
                                  Enable
                                </>
                              )}
                            </Button>
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-600">per page</span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} developers
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
