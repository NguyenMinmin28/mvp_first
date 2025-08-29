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
import { CheckCircle, XCircle, Clock, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] =
    useState<DeveloperProfile | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    level: "all",
    approvalStatus: "all",
  });

  // Fetch profiles
  const fetchProfiles = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...filters,
      });

      const response = await fetch(`/api/admin/developer-profiles?${params}`);
      if (!response.ok) throw new Error("Failed to fetch profiles");

      const data = await response.json();
      setProfiles(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to fetch developer profiles");
    } finally {
      setLoading(false);
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
    fetchProfiles(1);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Table columns
  const columns: Column<DeveloperProfile>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      filterable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-3">
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
            variant: "default" as const,
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
            <Badge variant="default" className="w-full justify-center">
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
        <Badge variant={value === "available" ? "default" : "secondary"}>
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
      width: "w-24",
      render: (_, item) => (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedProfile(item)}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="flex space-x-2 mt-4">
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        data={profiles}
        columns={columns}
        title={`Developer Profiles (${pagination.totalItems})`}
        searchPlaceholder="Search by name, email, bio..."
        loading={loading}
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
