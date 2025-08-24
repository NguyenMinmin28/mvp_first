"use client";

import { useEffect, useState } from "react";
import { Badge } from "./badge";
import { CheckCircle } from "lucide-react";

interface SessionRefreshNoticeProps {
  isRefreshing?: boolean;
}

export function SessionRefreshNotice({ isRefreshing = false }: SessionRefreshNoticeProps) {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (isRefreshing) {
      setShowNotice(true);
      // Hide notice after 3 seconds
      const timer = setTimeout(() => setShowNotice(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing]);

  if (!showNotice) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
      <Badge variant="secondary" className="flex items-center gap-2 bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Session refreshed</span>
      </Badge>
    </div>
  );
}
