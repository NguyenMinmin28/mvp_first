"use client";

import React, { useState, useEffect } from "react";
import { DataTable, Column } from "@/ui/components/data-table";
import { Pagination } from "@/ui/components/pagination";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import { Textarea } from "@/ui/components/textarea";
import { CheckCircle, XCircle, Clock, Eye, Search, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/ui/components/input";

interface DeveloperProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  isProfileCompleted: boolean;
  photoUrl: string;
  bio: string;
  experienceYears: number;
  level: string;
  linkedinUrl: string;
  portfolioLinks: string[];
  adminApprovalStatus: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
  whatsappNumber: string;
  whatsappVerified?: boolean;
  whatsappVerifiedAt: string | null;
  usualResponseTimeMs: number;
  currentStatus: string;
  averageRating: number;
  totalReviews: number;
  skills: string;
  userCreatedAt: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  // User role information
  userRole: string | null;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function DeveloperProfileManagement() {
  const [profiles, setProfiles] = useState<DeveloperProfile[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 5,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] =
    useState<DeveloperProfile | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [resettingRole, setResettingRole] = useState<string | null>(null);
  const [clearingPlans, setClearingPlans] = useState<string | null>(null);
  const [seedingPlan, setSeedingPlan] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    level: "all",
    approvalStatus: "all",
  });
  const [search, setSearch] = useState("");

  // Fetch profiles
  const fetchProfiles = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        // Map current filters to the developers endpoint expectations
        // It supports 'filter' for approval/whatsapp states; keep simple: use approvalStatus when not 'all'
        filter:
          filters.approvalStatus !== "all"
            ? filters.approvalStatus
            : "all",
      });

      // Add search parameter if search term exists
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/admin/developers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch profiles");

      const json = await response.json();
      console.log("🔍 API Response:", json.developers?.[0]); // Debug first developer
      const items = (json.developers || []).map((dev: any) => {
        const skills = (dev.skills || [])
          .map((s: any) => s.skill?.name)
          .filter(Boolean)
          .join(", ");
        return {
          id: dev.id,
          userId: dev.userId,
          name: dev.user?.name || "",
          email: dev.user?.email || "",
          phone: dev.user?.phoneE164 || "",
          isPhoneVerified: !!dev.user?.isPhoneVerified,
          isProfileCompleted: !!dev.user?.isProfileCompleted,
          photoUrl: dev.photoUrl || "",
          bio: dev.bio || "",
          experienceYears: dev.experienceYears ?? 0,
          level: dev.level,
          linkedinUrl: dev.linkedinUrl || "",
          portfolioLinks: dev.portfolioLinks || [],
          adminApprovalStatus: dev.adminApprovalStatus,
          approvedAt: dev.approvedAt || null,
          rejectedAt: dev.rejectedAt || null,
          rejectedReason: dev.rejectedReason || null,
          whatsappNumber: dev.whatsappNumber || "",
          whatsappVerifiedAt: null,
          whatsappVerified: !!dev.whatsappVerified,
          usualResponseTimeMs: dev.usualResponseTimeMs ?? 0,
          currentStatus: dev.currentStatus,
          averageRating: dev.reviewsAggregate?.averageRating || 0,
          totalReviews: dev.reviewsAggregate?.totalReviews || 0,
          skills,
          userCreatedAt: dev.userCreatedAt || dev.createdAt,
          lastLoginAt: dev.user?.lastLoginAt || null,
          createdAt: dev.createdAt,
          updatedAt: dev.updatedAt || dev.createdAt,
          userRole: dev.user?.role || null,
        } as DeveloperProfile;
      });

      console.log("🔍 Mapped items:", items[0]); // Debug first mapped item
      setProfiles(items);
      setPagination({
        currentPage: json.pagination?.page || page,
        totalPages: json.pagination?.totalPages || 1,
        totalItems: json.pagination?.totalCount || items.length,
        itemsPerPage: json.pagination?.limit || pagination.itemsPerPage,
        hasNextPage:
          (json.pagination?.page || page) < (json.pagination?.totalPages || 1),
        hasPrevPage: (json.pagination?.page || page) > 1,
      });
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to fetch developer profiles");
    } finally {
      setLoading(false);
    }
  };

  // Clear all subscriptions/plans for the underlying user (client profile)
  const handleClearPlans = async (userId: string, userName: string) => {
    if (!confirm(`Xoá toàn bộ subscription/plan của ${userName}?`)) {
      return;
    }
    try {
      setClearingPlans(userId);
      const response = await fetch(`/api/admin/users/${userId}/clear-subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to clear plans");
      }
      toast.success(`Đã xoá plans của ${userName}`);
    } catch (e: any) {
      console.error("clear plans error", e);
      toast.error(e.message || "Failed to clear plans");
    } finally {
      setClearingPlans(null);
    }
  };

  // Handle approval/rejection
  const handleApproval = async (
    profileId: string,
    status: "approved" | "rejected",
    reason?: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/developer-profiles/${profileId}/approval`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reason }),
        }
      );

      if (!response.ok) throw new Error("Failed to update approval status");

      toast.success(`Profile ${status} successfully`);
      setApprovalDialog(false);
      setRejectionReason("");
      fetchProfiles(pagination.currentPage);
    } catch (error) {
      console.error("Error updating approval:", error);
      toast.error("Failed to update approval status");
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
    fetchProfiles(page);
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchProfiles(1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ status: "all", level: "all", approvalStatus: "all" });
    setSearch("");
    fetchProfiles(1);
  };

  // Handle reset role
  const handleResetRole = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to reset the role for ${userName}? This will remove their current role and allow them to choose a new role. Their profile data will be preserved.`)) {
      return;
    }

    try {
      setResettingRole(userId);
      const response = await fetch(`/api/admin/users/${userId}/reset-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success(`Role reset successfully for ${userName}`);
        // Refresh the profiles list
        fetchProfiles(pagination.currentPage);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to reset role");
      }
    } catch (error) {
      console.error("Error resetting role:", error);
      toast.error("Failed to reset role");
    } finally {
      setResettingRole(null);
    }
  };

  // Seed Free Plan for users without an active subscription
  const handleSeedFreePlan = async (userId: string, userName: string) => {
    // Prevent spamming while a request is in-flight
    if (seedingPlan) {
      toast.info("A seed request is already processing");
      return;
    }
    try {
      setSeedingPlan(userId);
      const response = await fetch(`/api/admin/users/${userId}/seed-free-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      let result: any = {};
      try { result = await response.json(); } catch {}

      if (!response.ok) {
        throw new Error(result?.error || `Failed to seed Free Plan (status ${response.status})`);
      }

      const msg = result?.message || (result?.subscription?.package?.name
        ? `Active plan: ${result.subscription.package.name}`
        : `Seeded Free Plan for ${userName}`);
      toast.success(msg);
      // Optionally refresh developer list to reflect any client state changes
      await fetchProfiles(pagination.currentPage);
    } catch (error: any) {
      console.error("Error seeding Free Plan:", error);
      toast.error(error?.message || "Failed to seed Free Plan");
    } finally {
      setSeedingPlan(null);
    }
  };

  // Toggle WhatsApp verification for developer
  const [togglingWhatsApp, setTogglingWhatsApp] = useState<string | null>(null);
  const handleToggleWhatsapp = async (developerId: string, current: boolean, name: string) => {
    if (togglingWhatsApp) return;
    try {
      setTogglingWhatsApp(developerId);
      const res = await fetch(`/api/admin/developers/${developerId}/whatsapp-verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappVerified: !current })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update WhatsApp verification");
      }
      toast.success(data?.message || `Updated WhatsApp verification for ${name}`);
      await fetchProfiles(pagination.currentPage);
    } catch (e: any) {
      console.error("toggle whatsapp error", e);
      toast.error(e?.message || "Failed to update WhatsApp verification");
    } finally {
      setTogglingWhatsApp(null);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Auto-search when search term changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProfiles(1);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Table columns
  const columns: Column<DeveloperProfile>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      filterable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-3 text-nowrap w-fit">
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt={value}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-600">
                {value?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "userRole",
      label: "Role",
      sortable: true,
      render: (value) => (
        <Badge
          variant={
            value === "ADMIN"
              ? "destructive"
              : value === "DEVELOPER"
                ? "default"
                : value === "CLIENT"
                  ? "secondary"
                  : "outline"
          }
        >
          {value || "No Role"}
        </Badge>
      ),
    },
    {
      key: "level",
      label: "Level",
      sortable: true,
      render: (value) => (
        <Badge
          variant={
            value === "EXPERT"
              ? "default"
              : value === "MID"
                ? "secondary"
                : "outline"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "experienceYears",
      label: "Experience",
      sortable: true,
      render: (value) => `${value} years`,
    },
    {
      key: "skills",
      label: "Skills",
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value || "No skills listed"}
        </div>
      ),
    },
    {
      key: "adminApprovalStatus",
      label: "Approval Status",
      sortable: true,
      render: (value) => {
        const statusConfig = {
          draft: { label: "Draft", icon: Clock, variant: "outline" as const },
          pending: {
            label: "Pending",
            icon: Clock,
            variant: "secondary" as const,
          },
          approved: {
            label: "Approved",
            icon: CheckCircle,
            variant: "success" as const,
          },
          rejected: {
            label: "Rejected",
            icon: XCircle,
            variant: "destructive" as const,
          },
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        const Icon = config.icon;

        return (
          <Badge variant={config.variant}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "approvalActions",
      label: "Approval Actions",
      width: "w-40",
      render: (_, item) => {
        if (item.adminApprovalStatus === "pending") {
          return (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={() => handleApproval(item.id, "approved")}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setSelectedProfile(item);
                  setApprovalDialog(true);
                }}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          );
        }

        if (item.adminApprovalStatus === "approved") {
          return (
            <Badge variant="success" className="w-full justify-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          );
        }

        if (item.adminApprovalStatus === "rejected") {
          return (
            <Badge variant="destructive" className="w-full justify-center">
              <XCircle className="w-3 h-3 mr-1" />
              Rejected
            </Badge>
          );
        }

        return (
          <Badge variant="outline" className="w-full justify-center">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      },
    },
    {
      key: "currentStatus",
      label: "Status",
      render: (value) => (
        <Badge variant={value === "available" ? "success" : "secondary"}>
          {value}
        </Badge>
      ),
    },
    {
      key: "averageRating",
      label: "Rating",
      sortable: true,
      render: (value, item) => (
        <div className="text-center">
          <div className="font-medium">{value.toFixed(1)}</div>
          <div className="text-xs text-gray-500">
            ({item.totalReviews} reviews)
          </div>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      width: "w-44",
      render: (_, item) => (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedProfile(item)}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleResetRole(item.userId, item.name)}
            disabled={resettingRole === item.userId}
            title="Reset Role (Allow user to choose role again)"
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            {resettingRole === item.userId ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSeedFreePlan(item.userId, item.name)}
            disabled={seedingPlan === item.userId}
            title="Seed Free Plan for this user"
            className="text-green-700 hover:text-green-800 hover:bg-green-50"
          >
            {seedingPlan === item.userId ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
            ) : (
              <span className="text-xs font-semibold">Free</span>
            )}
          </Button>
          <Button
            size="sm"
            variant={item.whatsappVerified ? "outline" : "default"}
            onClick={() => handleToggleWhatsapp(item.id, !!item.whatsappVerified, item.name)}
            disabled={togglingWhatsApp === item.id}
            title={item.whatsappVerified ? "Disable WhatsApp Verified" : "Enable WhatsApp Verified"}
            className={item.whatsappVerified ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-700 hover:text-green-800 hover:bg-green-50"}
          >
            {togglingWhatsApp === item.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <span className="text-xs font-semibold">{item.whatsappVerified ? "Unverify" : "Verify"}</span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleClearPlans(item.userId, item.name)}
            disabled={clearingPlans === item.userId}
            title="Clear all plans/subscriptions"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {clearingPlans === item.userId ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-rows-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-blue-700/90">
                  Total (all)
                </p>
                <p className="text-xl font-bold text-blue-900">
                  {pagination.totalItems}
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">All</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-emerald-700/90">
                  Approved
                </p>
                <p className="text-xl font-bold text-emerald-900">
                  {
                    profiles.filter((p) => p.adminApprovalStatus === "approved")
                      .length
                  }
                </p>
              </div>
              <Badge variant="success">OK</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-amber-700/90">
                  Pending
                </p>
                <p className="text-xl font-bold text-amber-900">
                  {
                    profiles.filter((p) => p.adminApprovalStatus === "pending")
                      .length
                  }
                </p>
              </div>
              <Badge className="bg-amber-100 text-amber-800">Waiting</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-rose-50 border-rose-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-rose-700/90">
                  Rejected
                </p>
                <p className="text-xl font-bold text-rose-900">
                  {
                    profiles.filter((p) => p.adminApprovalStatus === "rejected")
                      .length
                  }
                </p>
              </div>
              <Badge variant="destructive">No</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-indigo-700/90">
                  Available (page)
                </p>
                <p className="text-xl font-bold text-indigo-900">
                  {
                    profiles.filter((p) => p.currentStatus === "available")
                      .length
                  }
                </p>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800">Now</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Data Table with unified toolbar */}
      <DataTable
        data={profiles}
        columns={columns}
        searchPlaceholder="Search by name, email, phone, skills, location, bio..."
        loading={loading}
        hideSearch
        unstyled
        headerContent={
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, phone, skills, location, bio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button className="h-11" onClick={applyFilters}>
                  Apply
                </Button>
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Level</label>
                <Select
                  value={filters.level}
                  onValueChange={(value) => handleFilterChange("level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="FRESHER">Fresher</SelectItem>
                    <SelectItem value="MID">Mid</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Approval Status
                </label>
                <Select
                  value={filters.approvalStatus}
                  onValueChange={(value) =>
                    handleFilterChange("approvalStatus", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Approval Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Approval Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        }
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

      {/* Profile Detail Dialog */}
      {selectedProfile && (
        <Dialog
          open={!!selectedProfile}
          onOpenChange={() => setSelectedProfile(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Developer Profile Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedProfile.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Role Status Section */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-2">Account Status</h3>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Role</label>
                    <div className="mt-1">
                      {selectedProfile.userRole && selectedProfile.userRole !== null ? (
                        <Badge
                          variant={
                            selectedProfile.userRole === "ADMIN"
                              ? "destructive"
                              : selectedProfile.userRole === "DEVELOPER"
                                ? "default"
                                : selectedProfile.userRole === "CLIENT"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {selectedProfile.userRole}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          No Role (Reset)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Profile Status</label>
                    <div className="mt-1">
                      <Badge variant={selectedProfile.isProfileCompleted ? "success" : "outline"}>
                        {selectedProfile.isProfileCompleted ? "Completed" : "Incomplete"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm">{selectedProfile.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm">{selectedProfile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm">
                    {selectedProfile.phone}
                    {selectedProfile.isPhoneVerified && (
                      <Badge variant="default" className="ml-2">
                        Verified
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Level</label>
                  <p className="text-sm">{selectedProfile.level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Experience</label>
                  <p className="text-sm">
                    {selectedProfile.experienceYears} years
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Rating</label>
                  <p className="text-sm">
                    {selectedProfile.averageRating.toFixed(1)} (
                    {selectedProfile.totalReviews} reviews)
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Bio</label>
                <p className="text-sm">
                  {selectedProfile.bio || "No bio provided"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Skills</label>
                <p className="text-sm">
                  {selectedProfile.skills || "No skills listed"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">LinkedIn</label>
                <p className="text-sm">
                  {selectedProfile.linkedinUrl ? (
                    <a
                      href={selectedProfile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedProfile.linkedinUrl}
                    </a>
                  ) : (
                    "No LinkedIn provided"
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Portfolio Links</label>
                <div className="space-y-1">
                  {selectedProfile.portfolioLinks &&
                  selectedProfile.portfolioLinks.length > 0 ? (
                    selectedProfile.portfolioLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 hover:underline text-sm"
                      >
                        {link}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No portfolio links provided
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="text-sm">
                    {new Date(selectedProfile.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Updated</label>
                  <p className="text-sm">
                    {new Date(selectedProfile.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedProfile(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Reason Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Profile</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this developer profile.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedProfile) {
                  handleApproval(
                    selectedProfile.id,
                    "rejected",
                    rejectionReason
                  );
                }
              }}
              disabled={!rejectionReason.trim()}
            >
              Reject Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
