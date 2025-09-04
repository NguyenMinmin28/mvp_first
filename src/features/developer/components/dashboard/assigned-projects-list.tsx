"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { cn } from "@/core/utils/utils";
import type { ProjectStatus } from "../project-status-filter";

interface AssignedProjectItem {
  id: string;
  name: string;
  description?: string;
  status: "recent" | "in_progress" | "completed";
  date: string;
  budget?: number | null;
  currency?: string | null;
  skills?: string[];
  assignmentStatus?: string;
}

interface AssignedProjectsListProps {
  filter: ProjectStatus;
}

export default function AssignedProjectsList({ filter }: AssignedProjectsListProps) {
  const [items, setItems] = useState<AssignedProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setItems(Array.isArray(data.projects) ? data.projects : []);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    switch (filter) {
      case "NEW":
        return items.filter((p) => p.status === "recent");
      case "IN_PROGRESS":
        return items.filter((p) => p.status === "in_progress");
      case "COMPLETED":
        return items.filter((p) => p.status === "completed");
      case "REJECTED":
        return items.filter((p) => p.assignmentStatus === "rejected");
      default:
        return items;
    }
  }, [items, filter]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-600">Loading projects...</CardContent>
      </Card>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-600">No projects found.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((p) => (
        <Card key={p.id} className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base font-semibold truncate">{p.name}</CardTitle>
              <div className="flex items-center gap-2">
                {p.assignmentStatus ? (
                  <Badge variant="secondary" className="text-xs">{p.assignmentStatus}</Badge>
                ) : null}
                <Badge className={cn("text-xs", p.status === "in_progress" && "bg-green-600 text-white", p.status === "completed" && "bg-purple-600 text-white", p.status === "recent" && "bg-gray-200 text-gray-800")}> 
                  {p.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            {p.description ? (
              <p className="text-sm text-gray-700 line-clamp-2 mb-2">{p.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span>{p.date}</span>
              {typeof p.budget === "number" && p.currency ? (
                <span>• Budget: {p.currency} {p.budget}</span>
              ) : null}
              {Array.isArray(p.skills) && p.skills.length > 0 ? (
                <span className="truncate">• Skills: {p.skills.slice(0, 4).join(", ")}{p.skills.length > 4 ? "…" : ""}</span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


