"use client";

import { useState, useEffect } from "react";

interface ContactInfo {
  canView: boolean;
  developer?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
}

interface UseCanViewContactResult {
  contactInfo: ContactInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCanViewContact(
  developerId: string,
  projectId?: string
): UseCanViewContactResult {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContactInfo = async () => {
    try {
      console.log("useCanViewContact: Starting fetch", { developerId, projectId });
      setLoading(true);
      setError(null);

      // If no projectId, we can't check contact permissions, so default to canView: false
      if (!projectId) {
        console.log("useCanViewContact: No projectId, setting canView: false");
        setContactInfo({ canView: false });
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        developerId
      });
      
      params.append("projectId", projectId);

      console.log("useCanViewContact: Making API call to", `/api/contacts/can-view?${params}`);
      const response = await fetch(`/api/contacts/can-view?${params}`);
      
      console.log("useCanViewContact: API response", { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("useCanViewContact: API error", { status: response.status, errorText });
        throw new Error(`Failed to fetch contact info: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("useCanViewContact: API success", data);
      setContactInfo(data);
    } catch (err) {
      console.error("useCanViewContact: Error", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setContactInfo({ canView: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (developerId) {
      fetchContactInfo();
    } else {
      // If no developerId, set loading to false
      setLoading(false);
    }
  }, [developerId, projectId]);

  return {
    contactInfo,
    loading,
    error,
    refetch: fetchContactInfo
  };
}
