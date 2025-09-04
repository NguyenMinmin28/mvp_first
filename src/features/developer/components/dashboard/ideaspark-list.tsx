"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";

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

export default function IdeaSparkList() {
  const [logs, setLogs] = useState<PresenceLogItem[]>([]);

  useEffect(() => {
    setLogs(loadPresenceLogs());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "presenceLogs") setLogs(loadPresenceLogs());
    };
    const onCustom = () => setLogs(loadPresenceLogs());
    window.addEventListener("storage", onStorage);
    window.addEventListener("presence-log-updated", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("presence-log-updated", onCustom as EventListener);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 && (
          <div className="text-sm text-gray-600">Chưa có hoạt động nào.</div>
        )}
        {logs.length > 0 && (
          <div className="relative mt-4 pl-12">
            {/* Đường timeline dọc bên trái, căn giữa dots */}
            <div className="absolute left-4 top-5 bottom-0 w-px bg-gray-200" />
            <div className="space-y-6">
              {logs.slice(0, 3).map((item, idx, arr) => (
                <div key={`${item.at}-${idx}`} className="relative flex items-center gap-4">
                  {/* Dot trạng thái */}
                  <span
                    className={`w-4 h-4 rounded-full border-2 border-white flex-shrink-0 grid place-items-center 
                    ${item.status === "available" ? "bg-green-400" : "bg-red-300"}`}
                    style={{ zIndex: 1 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shadow-sm" />
                  </span>
                  {/* Đường nối từ đáy dot trên xuống đỉnh dot dưới */}
                  {idx < arr.length - 1 && (
                    <span
                      className="absolute left-[14px]"
                      style={{
                        width: '0.5px',
                        height: "40px",
                        backgroundColor: '#E5E7EB',
                        top: "24px",
                        zIndex: 0,
                      }}
                      aria-hidden
                    />
                  )}
                  {/* Nội dung trạng thái */}
                  <div className="flex-1 ml-1 bg-white/50 rounded-lg border p-3">
                    <div className="text-sm">
                      Changed status to <span className="font-semibold">{item.status === "available" ? "Available" : "Busy"}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(item.at).toLocaleString()}
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
