"use client";

import { useState } from "react";

interface ManualInviteResult {
  success: boolean;
  message: string;
  data?: {
    batchId: string;
    candidateId: string;
  };
}

interface UseManualInviteResult {
  sendInvite: (developerId: string, data: { message: string; title?: string; budget?: string; description?: string; selectedProjectId?: string }) => Promise<ManualInviteResult>;
  loading: boolean;
  error: string | null;
}

export function useManualInvite(projectId?: string): UseManualInviteResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInvite = async (developerId: string, data: { message: string; title?: string; budget?: string; description?: string; selectedProjectId?: string }): Promise<ManualInviteResult> => {
    try {
      setLoading(true);
      setError(null);

      // Use different endpoints based on whether we have a project context
      const endpoint = projectId 
        ? `/api/projects/${projectId}/invites/manual`
        : `/api/messages/send`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          developerId,
          message: data.message.trim(),
          title: data.title?.trim() || null,
          budget: data.budget?.trim() || null,
          description: data.description?.trim() || null,
          selectedProjectId: data.selectedProjectId || null,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to send message");
      }

      return responseData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendInvite,
    loading,
    error
  };
}
