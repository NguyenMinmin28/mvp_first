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
import { toast } from "sonner";

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
      title: "🟦 Client",
      description: "I want to hire freelancers for my projects",
      icon: Building2,
      features: [
        "Post projects and connect directly with developers",
        "Browse verified profiles across Starter, Professional, and Expert levels",
        "Hire freelancers without middlemen or extra commission fees",
        "Manage projects and track progress from your dashboard",
        "Contact freelancers directly via WhatsApp or email",
      ],
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
    {
      type: "DEVELOPER" as const,
      title: "🟩 Freelancer",
      description: "I want to find projects and offer my services",
      icon: Code2,
      features: [
        "Post your services and showcase your portfolio",
        "Receive direct project invites from clients",
        "Build trust with a verified profile & rating system",
        "Connect directly with clients via projects — keep 100% of your earnings",
      ],
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
            Choose Your Role to Get Started
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.type;

            return (
              <Card
                key={role.type}
                className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-0 shadow-lg ${
                  role.type === "CLIENT" 
                    ? "bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50" 
                    : "bg-gradient-to-br from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50"
                } ${
                  isSelected 
                    ? role.type === "CLIENT" 
                      ? "ring-2 ring-blue-400 shadow-blue-200/50" 
                      : "ring-2 ring-green-400 shadow-green-200/50"
                    : ""
                }`}
                onClick={() => setSelectedRole(role.type)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-white/80 shadow-sm border ${
                      role.type === "CLIENT" ? "border-blue-200" : "border-green-200"
                    }`}>
                      <Icon className={`h-7 w-7 ${
                        role.type === "CLIENT" ? "text-blue-600" : "text-green-600"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
                        {role.title}
                      </CardTitle>
                      <CardDescription className="text-base text-gray-600 leading-relaxed">
                        {role.description}
                      </CardDescription>
                    </div>
                    {isSelected && (
                      <Badge 
                        variant="secondary" 
                        className={`ml-auto px-3 py-1 text-sm font-medium ${
                          role.type === "CLIENT" 
                            ? "bg-blue-100 text-blue-700 border-blue-200" 
                            : "bg-green-100 text-green-700 border-green-200"
                        }`}
                      >
                        Selected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      Benefits:
                    </h4>
                    <ul className="space-y-3">
                      {role.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start text-sm text-gray-700 leading-relaxed"
                        >
                          <div className={`w-2 h-2 rounded-full mr-3 mt-2 flex-shrink-0 ${
                            role.type === "CLIENT" ? "bg-blue-500" : "bg-green-500"
                          }`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            disabled={isLoading}
            onClick={() => {
              if (!selectedRole) {
                // Show message to choose profile
                toast.error("Please choose your profile");
                return;
              }
              onRoleSelect(selectedRole);
            }}
            className={`px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
              selectedRole === "CLIENT"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                : selectedRole === "DEVELOPER"
                  ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                Creating profile...
              </>
            ) : (
              <>
                <Users className="mr-3 h-5 w-5" />
                {selectedRole ? (
                  <>
                    Join as{" "}
                    {selectedRole === "CLIENT"
                      ? "Client"
                      : "Freelancer"}
                  </>
                ) : (
                  "Get Started"
                )}
              </>
            )}
          </Button>

          {!selectedRole && (
            <p className="text-sm text-gray-500 mt-4">
              Please select a role to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
