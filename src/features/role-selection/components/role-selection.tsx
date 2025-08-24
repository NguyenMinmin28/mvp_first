"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Building2, Code2, Users, Briefcase } from "lucide-react";

interface RoleSelectionProps {
  onRoleSelect: (role: "CLIENT" | "DEVELOPER") => void;
  currentRole?: "CLIENT" | "DEVELOPER";
  isLoading?: boolean;
}

export default function RoleSelection({
  onRoleSelect,
  currentRole,
  isLoading = false,
}: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<
    "CLIENT" | "DEVELOPER" | null
  >(currentRole || null);

  const roles = [
    {
      type: "CLIENT" as const,
      title: "Client",
      description: "I want to hire developers for my projects",
      icon: Building2,
      features: [
        "Post projects and find developers",
        "Manage freelancer teams",
        "Track project progress",
        "Pay through platform",
      ],
      color:
        "bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800",
    },
    {
      type: "DEVELOPER" as const,
      title: "Developer",
      description: "I want to receive jobs and work as a freelancer",
      icon: Code2,
      features: [
        "Receive jobs from clients",
        "Showcase portfolio and skills",
        "Manage professional profile",
        "Receive direct payments",
      ],
      color:
        "bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:border-green-800",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to the platform!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Choose the role that fits you to complete your profile
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.type;

            return (
              <Card
                key={role.type}
                className={`cursor-pointer transition-all duration-200 ${role.color} ${
                  isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""
                }`}
                onClick={() => setSelectedRole(role.type)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{role.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {role.description}
                      </CardDescription>
                    </div>
                    {isSelected && (
                      <Badge variant="secondary" className="ml-auto">
                        Selected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {role.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                      >
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            disabled={!selectedRole || isLoading}
            onClick={() => selectedRole && onRoleSelect(selectedRole)}
            className="px-8 py-3 text-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Creating profile...
              </>
            ) : (
              <>
                <Users className="mr-2 h-5 w-5" />
                Continue with role{" "}
                {selectedRole === "CLIENT"
                  ? "Client"
                  : selectedRole === "DEVELOPER"
                    ? "Developer"
                    : ""}
              </>
            )}
          </Button>

          {!selectedRole && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Please select a role to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
