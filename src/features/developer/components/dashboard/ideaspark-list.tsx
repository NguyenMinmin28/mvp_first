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
    <div className="relative group">
      {/* Shine overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl pointer-events-none z-20" />
      
      <Card className="border-2 border-gray-200 hover:border-black shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden bg-white">
        <CardHeader className="pb-4 bg-gradient-to-br from-gray-50 to-white border-b-2 border-gray-100">
          <div className="flex items-center gap-3">
            {/* Premium Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-black rounded-xl blur-lg opacity-20" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Activity Timeline</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="text-sm pt-6 pb-6" style={{ height: '280px', overflowY: 'auto' }}>
          {logs.length === 0 && (
            <div className="text-center py-8 flex flex-col justify-center h-full">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-base font-bold text-gray-600 mb-2">No recent activity</p>
              <p className="text-sm text-gray-500">Your status changes will appear here</p>
            </div>
          )}
          {logs.length > 0 && (
            <div className="relative px-2">
              {/* Premium Vertical Timeline Line with Gradient */}
              <div className="absolute left-4 top-0 w-0.5 bg-gradient-to-b from-gray-900 via-gray-400 to-gray-200 rounded-full" style={{ height: '240px' }} />

              <div className="space-y-4">
                {logs.slice(0, 3).map((item, idx) => (
                  <div
                    key={`${item.at}-${idx}`}
                    className="relative flex items-start gap-5 group/item animate-fade-in-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Premium Status Indicator */}
                    <div className="relative flex-shrink-0">
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-full blur-lg opacity-30 group-hover/item:opacity-50 transition-opacity duration-300 ${
                        item.status === "available" ? "bg-green-500" : "bg-orange-500"
                      }`} />
                      
                      {/* Outer ring */}
                      <div
                        className={`relative w-6 h-6 rounded-full border-2 border-white flex-shrink-0 flex items-center justify-center z-10 shadow-md group-hover/item:scale-110 transition-all duration-300 ${
                          item.status === "available"
                            ? "bg-gradient-to-br from-green-400 to-green-600"
                            : "bg-gradient-to-br from-orange-400 to-orange-600"
                        }`}
                      >
                        {/* Inner icon */}
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          {item.status === "available" ? (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          )}
                        </svg>
                      </div>
                    </div>

                    {/* Activity Content Card */}
                    <div className="flex-1 min-w-0 group-hover/item:translate-x-1 transition-transform duration-300">
                      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-3 shadow-sm group-hover/item:shadow-md group-hover/item:border-gray-300 transition-all duration-300">
                        <div className="text-xs font-semibold text-gray-900 leading-relaxed">
                          <span className="text-gray-800">{profile?.name || "User"}</span>
                          {" "}changed status to{" "}
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold text-xs ${
                              item.status === "available"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-orange-100 text-orange-700 border border-orange-200"
                            }`}
                          >
                            {item.status === "available" ? (
                              <>
                                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                Available
                              </>
                            ) : (
                              <>
                                <span className="w-1 h-1 rounded-full bg-orange-500" />
                                Not Available
                              </>
                            )}
                          </span>
                        </div>

                        {/* Premium Timestamp */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-gray-200 shadow-sm">
                            <svg
                              className="w-3 h-3 text-gray-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-xs font-medium text-gray-600">
                              {getTimeAgo(new Date(item.at))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
