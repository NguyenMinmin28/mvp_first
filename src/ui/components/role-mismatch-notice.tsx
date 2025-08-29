"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/ui/components/alert";
import { X } from "lucide-react";

interface RoleMismatchNoticeProps {
  userRole?: string;
  targetPortal?: string;
}

export function RoleMismatchNotice({ userRole, targetPortal }: RoleMismatchNoticeProps) {
  const [showNotice, setShowNotice] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if there's a role mismatch notice in URL params
    const roleMismatch = searchParams.get("roleMismatch");
    if (roleMismatch === "true") {
      setShowNotice(true);
    }
  }, [searchParams]);

  if (!showNotice) return null;

  const getMessage = () => {
    if (userRole === "CLIENT" && targetPortal === "freelancer") {
      return "You have been redirected to the Freelancer portal because your account has a Client role.";
    }
    if (userRole === "DEVELOPER" && targetPortal === "client") {
      return "You have been redirected to the Client portal because your account has a Developer role.";
    }
    return "You have been redirected to the appropriate portal for your role.";
  };

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <AlertDescription className="flex items-center justify-between">
        <span className="text-yellow-800">
          {getMessage()}
        </span>
        <button
          onClick={() => setShowNotice(false)}
          className="text-yellow-600 hover:text-yellow-800"
        >
          <X className="h-4 w-4" />
        </button>
      </AlertDescription>
    </Alert>
  );
}
