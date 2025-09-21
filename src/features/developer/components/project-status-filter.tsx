"use client";

import React from "react";
import { Button } from "@/ui/components/button";
import { cn } from "@/core/utils/utils";

export type ProjectStatus = "NEW" | "IN_PROGRESS" | "COMPLETED" | "APPROVED" | "REJECTED" | "MANUAL_INVITATIONS";

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
    <div className={cn("flex gap-4 flex-wrap", className)}>
      {statusItems.map((item) => {
        const isActive = value === item.key;
        return (
          <Button
            key={item.key}
            variant={isActive ? "default" : "outline"}
            onClick={() => onChange(item.key)}
            className={cn(
              "rounded-xl px-8",
              isActive ? "bg-black text-white hover:bg-black" : ""
            )}
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}


