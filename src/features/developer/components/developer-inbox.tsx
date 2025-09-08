"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { RoleMismatchNotice } from "@/ui/components/role-mismatch-notice";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { User, TestTube } from "lucide-react";
import { toast } from "sonner";
import PendingInvitations from "./components/PendingInvitations";
import RecentActivity from "./components/RecentActivity";
import EmptyState from "./components/EmptyState";
import { InvitationCandidate } from "./components/types";

// Type moved to components/types

export default function DeveloperInbox() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const userRole = session?.user?.role as string | undefined;
  const targetPortal = searchParams.get("targetPortal") as string | undefined;
  
  const [invitations, setInvitations] = useState<InvitationCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTestingBatch, setIsTestingBatch] = useState(false);

  // Real-time countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/developer/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      } else {
        toast.error("Failed to load invitations");
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchInvitations, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResponse = async (candidateId: string, action: "accept" | "reject") => {
    setProcessingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(candidateId);
      return newSet;
    });

    try {
      const response = await fetch(`/api/candidates/${candidateId}/${action}`, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        
        if (action === "accept") {
          toast.success("🎉 Congratulations! You won this assignment!");
        } else {
          toast.success("Assignment rejected");
        }
        
        // Refresh invitations
        await fetchInvitations();
      } else {
        const error = await response.json();
        
        // Enhanced error messages for race conditions
        if (response.status === 409 || error.message?.includes("already accepted") || error.message?.includes("already has an accepted developer")) {
          toast.error("⏰ This project was already accepted by another developer. Please refresh the page to see the updated status.");
        } else if (error.message?.includes("no longer pending")) {
          toast.error("⏰ This invitation is no longer available");
        } else if (error.message?.includes("deadline passed")) {
          toast.error("⏰ The acceptance deadline has passed");
        } else {
          toast.error(error.message || `Failed to ${action} assignment`);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing assignment:`, error);
      toast.error("Something went wrong");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidateId);
        return newSet;
      });
    }
  };

  // Test batch assignment function
  const handleTestBatchAssignment = async () => {
    setIsTestingBatch(true);
    try {
      const response = await fetch("/api/test-assign-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("🧪 Test batch assignment created! Check your notifications and inbox.");
        
        // Refresh invitations to show the new test assignment
        await fetchInvitations();
        
        // Trigger notification refresh in header
        window.dispatchEvent(new CustomEvent('notification-refresh'));
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create test batch assignment");
      }
    } catch (error) {
      console.error("Error creating test batch assignment:", error);
      toast.error("Something went wrong");
    } finally {
      setIsTestingBatch(false);
    }
  };

  // UI helpers moved to components/utils

  const pendingInvitations = invitations.filter(inv => inv.responseStatus === "pending");
  const respondedInvitations = invitations.filter(inv => inv.responseStatus !== "pending");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Mismatch Notice */}
      <RoleMismatchNotice userRole={userRole} targetPortal={targetPortal} />
      
      {/* Test Batch Assignment Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TestTube className="h-5 w-5" />
            Test Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Create a test batch assignment to simulate receiving a new project invitation and notification.
            </p>
            <Button
              onClick={handleTestBatchAssignment}
              disabled={isTestingBatch}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isTestingBatch ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Test Assignment...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Create Test Batch Assignment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Pending Invitations */}
      <PendingInvitations
        items={pendingInvitations}
        now={currentTime}
        isProcessing={(id) => processingIds.has(id)}
        onRespond={handleResponse}
      />

      {/* Recent Activity */}
      <RecentActivity items={respondedInvitations} />

      {/* Empty State */}
      {invitations.length === 0 && <EmptyState />}
    </div>
  );
}
