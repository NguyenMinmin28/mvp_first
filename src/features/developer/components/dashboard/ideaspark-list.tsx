"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";

interface IdeaSparkListProps {
  profile?: any;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
}

type PresenceStatus = "available" | "busy";

interface PresenceLogItem {
  status: PresenceStatus;
  at: string; // ISO
}

function loadPresenceLogs(): PresenceLogItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("presenceLogs");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr as PresenceLogItem[];
  } catch {}
  return [];
}

export default function IdeaSparkList({ profile }: IdeaSparkListProps = {}) {
  const [logs, setLogs] = useState<PresenceLogItem[]>([]);

  useEffect(() => {
    // Start with local logs
    const local = loadPresenceLogs();
    const merged = [...local];
    // Prepend a server-side activity hint if available
    try {
      if (profile?.currentStatus && profile?.lastLoginAt) {
        const lastAt = new Date(profile.lastLoginAt).toISOString();
        if (!merged.some((x) => x.at === lastAt)) {
          merged.unshift({
            status: (profile.currentStatus === "available"
              ? "available"
              : "busy") as PresenceStatus,
            at: lastAt,
          });
        }
      }
    } catch {}
    setLogs(merged);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "presenceLogs") setLogs(loadPresenceLogs());
    };
    const onCustom = () => setLogs(loadPresenceLogs());
    window.addEventListener("storage", onStorage);
    window.addEventListener("presence-log-updated", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "presence-log-updated",
        onCustom as EventListener
      );
    };
  }, [profile?.currentStatus, profile?.lastLoginAt]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Activity</CardTitle>
      </CardHeader>
      <CardContent className="text-sm pt-0">
        {logs.length === 0 && (
          <div className="text-sm text-gray-600 text-center py-4">
            No recent activity
          </div>
        )}
        {logs.length > 0 && (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-2 top-2 bottom-0 w-px bg-gray-200" />

            <div className="space-y-6">
              {logs.slice(0, 5).map((item, idx) => (
                <div
                  key={`${item.at}-${idx}`}
                  className="relative flex items-start gap-4"
                >
                  {/* Colored dot with small gray dot inside */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-white flex-shrink-0 flex items-center justify-center relative z-10 ${
                      item.status === "available"
                        ? "bg-green-300"
                        : idx === 1
                          ? "bg-yellow-300"
                          : "bg-orange-300"
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {profile?.name || "User"} changed status to{" "}
                      <span
                        className={`font-semibold ${
                          item.status === "available"
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {item.status === "available"
                          ? "Available"
                          : "Not Available"}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 mt-1">
                      <svg
                        className="w-3 h-3 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(new Date(item.at))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
