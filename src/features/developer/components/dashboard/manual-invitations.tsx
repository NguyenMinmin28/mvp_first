"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { MessageCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface ManualInvitation {
  id: string;
  project: {
    id: string;
    title: string;
    description: string;
    budget?: number;
    currency?: string;
  } | null;
  client: {
    name: string;
    companyName?: string | null;
  } | null;
  message: string;
  title?: string; // Client-entered title
  budget?: string; // Client-entered budget
  description?: string; // Client-entered description
  assignedAt: string;
  responseStatus: "pending" | "accepted" | "rejected" | "expired";
}

export default function ManualInvitations() {
  const [invitations, setInvitations] = useState<ManualInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/me/invitations", {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);
        // Filter only manual invites
        const manualInvites = data.data?.filter((inv: any) => inv.isManualInvite) || [];
        console.log("Manual Invites:", manualInvites);
        setInvitations(manualInvites);
      } else {
        toast.error("Failed to load invitations");
      }
    } catch (error) {
      console.error("Error fetching manual invitations:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchInvitations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keep page in bounds
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(invitations.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [invitations, page, pageSize]);

  const handleResponse = async (candidateId: string, action: "accept" | "reject") => {
    console.log(`🔄 Starting ${action} for candidate:`, candidateId);
    
    setProcessingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(candidateId);
      return newSet;
    });

    try {
      console.log(`📡 Making API call to /api/candidates/${candidateId}/${action}`);
      const response = await fetch(`/api/candidates/${candidateId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include'
      });

      console.log(`📡 API response status:`, response.status);
      console.log(`📡 API response ok:`, response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ API response data:`, result);
        toast.success(`Invitation ${action}ed successfully!`);
        fetchInvitations(); // Refresh the list
      } else {
        const errorData = await response.json();
        console.error(`❌ API error:`, errorData);
        toast.error(errorData.error || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error(`❌ Network error ${action}ing invitation:`, error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidateId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Manual Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading invitations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Manual Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No manual invitations yet.</p>
            <p className="text-sm text-gray-400 mt-1">Clients can send you direct invitations through the "Get in Touch" feature.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalItems = invitations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleInvitations = invitations.slice(startIndex, endIndex);

  const getPageList = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const left = Math.max(1, page - 1);
    const right = Math.min(totalPages, page + 1);
    if (left > 1) pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (right < totalPages) pages.push(totalPages);
    return pages;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          Manual Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleInvitations.map((invitation) => {
          const isProcessing = processingIds.has(invitation.id);
          
          console.log("Rendering invitation:", {
            id: invitation.id,
            status: invitation.responseStatus,
            isPending: invitation.responseStatus === "pending",
            shouldShowButtons: invitation.responseStatus === "pending"
          });
          
          return (
            <Card key={invitation.id} className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="space-y-3">
          <div className="flex justify-between items-start">
                    <div>
              <h3 className="font-semibold text-lg">{invitation.title || invitation.project?.title || 'Message'}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>From: {invitation.client?.name || 'Client'}</span>
                {invitation.client?.companyName && (
                          <span>• {invitation.client.companyName}</span>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-blue-600 text-white">
                      {invitation.responseStatus}
                    </Badge>
                  </div>

                  <div className="bg-white border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-800">Message from client:</p>
                        <p className="text-sm text-blue-700 italic">"{invitation.message}"</p>
                      </div>
                    </div>
                  </div>

                  {invitation.budget && (
                    <div className="text-sm font-medium text-green-600">
                      Budget: {invitation.budget}
                    </div>
                  )}

                  {invitation.description && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Project Description:</p>
                        <p className="text-sm text-gray-600">{invitation.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Received: {new Date(invitation.assignedAt).toLocaleString()}
                  </div>

                  {(invitation.responseStatus as string) === "expired" && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <div className="text-xs text-red-700 font-medium">
                        ⏰ This invitation has expired - the project was accepted by another developer
                      </div>
                    </div>
                  )}

                  {(() => {
                    const shouldShowButtons = invitation.responseStatus === "pending";
                    console.log("Should show buttons:", shouldShowButtons, "for invitation:", invitation.id, "status:", invitation.responseStatus);
                    return shouldShowButtons;
                  })() && (
                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={() => handleResponse(invitation.id, "accept")} 
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleResponse(invitation.id, "reject")} 
                        disabled={isProcessing}
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Pagination controls (shadcn style) */}
        {totalItems > 0 && (
          <div className="border-t pt-3 sm:pt-4">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md px-3"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 mr-2"><path d="m15 18-6-6 6-6"/></svg>
                Previous
              </Button>
              {getPageList().map((pItem, idx) => (
                typeof pItem === 'number' ? (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className={`h-9 rounded-md px-3 ${pItem === page ? 'bg-black text-white border-black' : ''}`}
                    onClick={() => setPage(pItem as number)}
                  >
                    {pItem}
                  </Button>
                ) : (
                  <span key={idx} className="px-3 py-2 text-sm text-muted-foreground">...</span>
                )
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md px-3"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 ml-2"><path d="m9 18 6-6-6-6"/></svg>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
