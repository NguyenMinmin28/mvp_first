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
  { key: "NEW", label: "Invite" },
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
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex gap-2 sm:gap-4 min-w-max px-1">
        {statusItems.map((item) => {
          const isActive = value === item.key;
          return (
            <Button
              key={item.key}
              variant={isActive ? "default" : "outline"}
              onClick={() => onChange(item.key)}
              className={cn(
                "rounded-none px-3 sm:px-6 lg:px-8 cursor-pointer whitespace-nowrap flex-shrink-0 text-xs sm:text-sm h-8 sm:h-10",
                isActive ? "bg-black text-white hover:bg-black" : ""
              )}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
