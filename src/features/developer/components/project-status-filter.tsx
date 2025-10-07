"use client";

import React from "react";
import { Button } from "@/ui/components/button";
import { cn } from "@/core/utils/utils";

export type ProjectStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "APPROVED"
  | "REJECTED"
  | "MANUAL_INVITATIONS";

export interface ProjectStatusFilterProps {
  value: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
  className?: string;
}

const statusItems: { key: ProjectStatus; label: string }[] = [
  { key: "NEW", label: "New" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "MANUAL_INVITATIONS", label: "Manual Invitations" },
];

export default function ProjectStatusFilter({
  value,
  onChange,
  className,
}: ProjectStatusFilterProps) {
  return (
    <div className={cn("overflow-x-auto scrollbar-none", className)}>
      <div className="bg-white/90 backdrop-blur-lg border-2 border-gray-200 rounded-2xl p-2 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex gap-2 min-w-max">
          {statusItems.map((item, index) => {
            const isActive = value === item.key;
            return (
              <div key={item.key} className="relative group/btn">
                {/* Shadow effect */}
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-md transition-opacity duration-300",
                  isActive 
                    ? "bg-black opacity-20 group-hover/btn:opacity-30" 
                    : "bg-black opacity-0 group-hover/btn:opacity-10"
                )} />
                
                <Button
                  variant={isActive ? "default" : "outline"}
                  onClick={() => onChange(item.key)}
                  className={cn(
                    "relative px-6 py-6 cursor-pointer whitespace-nowrap flex-shrink-0 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden",
                    isActive 
                      ? "bg-gradient-to-r from-gray-900 to-black text-white hover:from-black hover:to-gray-900 shadow-lg hover:shadow-xl scale-105 border-0" 
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 shadow-md hover:shadow-lg hover:scale-105"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Shine effect for active button */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
