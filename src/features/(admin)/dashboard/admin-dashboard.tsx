"use client";

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
} from "lucide-react";

import { AdminLayout } from "@/features/shared/components/admin-layout";
import { Role } from "@prisma/client";

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

export function AdminDashboard({ user }: AdminDashboardProps) {
  const adminStats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12%",
      changeType: "positive",
      icon: Users,
      color: "blue",
    },
    {
      title: "Active Sessions",
      value: "89",
      change: "+5%",
      changeType: "positive",
      icon: Activity,
      color: "green",
    },
    {
      title: "Database Size",
      value: "2.4 GB",
      change: "+8%",
      changeType: "neutral",
      icon: Database,
      color: "purple",
    },
    {
      title: "System Status",
      value: "Healthy",
      change: "100%",
      changeType: "positive",
      icon: Shield,
      color: "green",
    },
  ];

  const quickActions = [
    {
      title: "User Management",
      description: "Manage user accounts and permissions",
      icon: Users,
      color: "blue",
      href: "#",
    },
    {
      title: "System Settings",
      description: "Configure application settings",
      icon: Settings,
      color: "gray",
      href: "#",
    },
    {
      title: "Analytics",
      description: "View system analytics and reports",
      icon: BarChart3,
      color: "green",
      href: "#",
    },
    {
      title: "Logs",
      description: "View system logs and activity",
      icon: FileText,
      color: "orange",
      href: "#",
    },
  ];

  return (
    <AdminLayout
      user={user}
      title="Dashboard Overview"
      description="Monitor system performance and manage your admin account"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {adminStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900 rounded-lg flex items-center justify-center`}
              >
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <span
                className={`text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stat.title}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickActions.map((action, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div
              className={`w-12 h-12 bg-${action.color}-100 dark:bg-${action.color}-900 rounded-lg flex items-center justify-center mb-4`}
            >
              <action.icon className={`w-6 h-6 text-${action.color}-600`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {action.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {action.description}
            </p>
          </div>
        ))}
      </div>

      {/* Admin Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Admin Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Profile
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your administrator account details
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Mail className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> {user.email || "Not provided"}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <User className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Name:</strong> {user.name || "Not provided"}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-red-800 dark:text-red-200">
                <strong>Role:</strong> {user.role}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">
                <strong>User ID:</strong> {user.id}
              </span>
            </div>
          </div>
        </div>

        {/* System Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                System Status
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Current system health and performance
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-800 dark:text-green-200">
                <strong>Database:</strong> Online
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-800 dark:text-green-200">
                <strong>Authentication:</strong> Active
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-800 dark:text-green-200">
                <strong>API Services:</strong> Running
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Bell className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 dark:text-blue-200">
                <strong>Last Updated:</strong> Just now
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="container mx-auto text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 Admin Dashboard. All rights reserved.</p>
        </div>
      </footer>
    </AdminLayout>
  );
}
