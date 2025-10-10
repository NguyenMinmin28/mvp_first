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
import { Eye, Search, RotateCcw, Users, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/ui/components/input";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  isProfileCompleted: boolean;
  status: string;
  phoneE164: string | null;
  isPhoneVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Profile info
  profileType?: string; // "CLIENT" | "DEVELOPER" | null
  profileStatus?: string; // For developers: approval status
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resettingRole, setResettingRole] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    profileCompleted: "all",
  });
  const [search, setSearch] = useState("");

  // Fetch users
  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...filters,
        search,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
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
        // Refresh the users list
        fetchUsers(pagination.currentPage);
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

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      role: "all",
      status: "all",
      profileCompleted: "all",
    });
    setSearch("");
    fetchUsers(1);
  };

  useEffect(() => {
    fetchUsers();
  }, [filters, search]);

  // Table columns
  const columns: Column<User>[] = [
    {
      key: "name",
      label: "User",
      sortable: true,
      filterable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-3 text-nowrap w-fit">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs text-gray-600">
              {value?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <div className="font-medium">{value || "No name"}</div>
            <div className="text-xs text-gray-500">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
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
          {value || "No role"}
        </Badge>
      ),
    },
    {
      key: "profileType",
      label: "Profile",
      render: (value, item) => {
        if (!value) return <Badge variant="outline">No profile</Badge>;
        
        if (value === "DEVELOPER") {
          return (
            <div className="flex flex-col gap-1">
              <Badge variant="default">Developer</Badge>
              {item.profileStatus && (
                <Badge 
                  variant={
                    item.profileStatus === "approved" ? "success" :
                    item.profileStatus === "rejected" ? "destructive" :
                    "secondary"
                  }
                  className="text-xs"
                >
                  {item.profileStatus}
                </Badge>
              )}
            </div>
          );
        }
        
        return <Badge variant="secondary">Client</Badge>;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Badge variant={value === "ACTIVE" ? "success" : "destructive"}>
          {value}
        </Badge>
      ),
    },
    {
      key: "isProfileCompleted",
      label: "Completed",
      render: (value) => (
        <Badge variant={value ? "success" : "outline"}>
          {value ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : "Never",
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
      width: "w-32",
      render: (_, item) => (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedUser(item)}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {item.role && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResetRole(item.id, item.name || item.email || "User")}
              disabled={resettingRole === item.id}
              title="Reset Role (Allow user to choose role again)"
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              {resettingRole === item.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-blue-700/90">
                  Total Users
                </p>
                <p className="text-xl font-bold text-blue-900">
                  {pagination.totalItems}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-emerald-700/90">
                  With Roles
                </p>
                <p className="text-xl font-bold text-emerald-900">
                  {users.filter(u => u.role).length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-orange-700/90">
                  No Role
                </p>
                <p className="text-xl font-bold text-orange-900">
                  {users.filter(u => !u.role).length}
                </p>
              </div>
              <UserX className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-purple-700/90">
                  Completed
                </p>
                <p className="text-xl font-bold text-purple-900">
                  {users.filter(u => u.isProfileCompleted).length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select
                value={filters.role}
                onValueChange={(value) => handleFilterChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DEVELOPER">Developer</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                  <SelectItem value="none">No Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Profile</label>
              <Select
                value={filters.profileCompleted}
                onValueChange={(value) => handleFilterChange("profileCompleted", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={users}
            columns={columns}
            loading={loading}
          />
          {!loading && users.length === 0 && (
            <div className="text-sm text-gray-500 mt-3">No users found</div>
          )}
          
          {pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={fetchUsers}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
