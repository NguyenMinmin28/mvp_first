"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Check, X, MessageCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/core/utils/utils";

interface ManualInvitation {
  id: string;
  project: {
    id: string;
    title: string;
    description: string;
    budget: number;
    currency: string;
    status: string;
  } | null;
  client: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    companyName: string | null;
  } | null;
  message: string;
  title?: string; // Client-entered title
  budget?: string; // Client-entered budget
  description?: string; // Client-entered description
  isManualInvite: boolean;
  hasDeadline: boolean;
  acceptanceDeadline: string | null;
  assignedAt: string;
  level: string;
  statusTextForClient: string;
  responseStatus: string;
}

interface ManualInvitationsSidebarProps {
  selectedInvitationId: string | null;
  onInvitationSelect: (invitation: ManualInvitation | null) => void;
}

export default function ManualInvitationsSidebar({ 
  selectedInvitationId, 
  onInvitationSelect 
}: ManualInvitationsSidebarProps) {
  const [invitations, setInvitations] = useState<ManualInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/me/invitations');
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        toast.error(`Failed to load invitations: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        const manualInvites = data.data?.filter((inv: any) => inv.isManualInvite) || [];
        setInvitations(manualInvites);
      } else {
        console.error('API returned error:', data.error);
        toast.error('Failed to load manual invitations');
      }
    } catch (error) {
      console.error('Error fetching manual invitations:', error);
      toast.error('Failed to load manual invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    
    // Temporarily disable auto-refresh to avoid continuous API calls
    // const interval = setInterval(fetchInvitations, 30000);
    // return () => clearInterval(interval);
  }, []);

  // Adjust page if current page goes out of bounds after any refresh
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(invitations.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [invitations, page, pageSize]);

  const totalItems = invitations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleInvitations = invitations.slice(startIndex, endIndex);

  const getPageList = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5; // show up to 5 number buttons
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

  const handleAccept = async (invitationId: string) => {
    console.log('🔄 Starting accept for invitation:', invitationId);
    
    try {
      console.log('📡 Making API call to /api/candidates/' + invitationId + '/accept');
      const response = await fetch(`/api/candidates/${invitationId}/accept`, {
        method: 'POST',
      });

      console.log('📡 API response status:', response.status);
      console.log('📡 API response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API response data:', result);
        toast.success('Invitation accepted successfully!');
        fetchInvitations(); // Refresh the list
        onInvitationSelect(null); // Clear selection
      } else {
        const error = await response.json();
        console.error('❌ API error:', error);
        toast.error(error.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('❌ Network error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleReject = async (invitationId: string) => {
    console.log('🔄 Starting reject for invitation:', invitationId);
    
    try {
      console.log('📡 Making API call to /api/candidates/' + invitationId + '/reject');
      const response = await fetch(`/api/candidates/${invitationId}/reject`, {
        method: 'POST',
      });

      console.log('📡 API response status:', response.status);
      console.log('📡 API response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API response data:', result);
        toast.success('Invitation rejected');
        fetchInvitations(); // Refresh the list
        onInvitationSelect(null); // Clear selection
      } else {
        const error = await response.json();
        console.error('❌ API error:', error);
        toast.error(error.message || 'Failed to reject invitation');
      }
    } catch (error) {
      console.error('❌ Network error rejecting invitation:', error);
      toast.error('Failed to reject invitation');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Manual Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Manual Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No manual invitations yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Clients can send you direct invitations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Manual Invitations</CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
          </p>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
            <span>Per page:</span>
            <select
              className="border rounded px-1 py-0.5 text-xs"
              value={String(pageSize)}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
            >
              <option value="5">5</option>
              <option value="8">8</option>
              <option value="10">10</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleInvitations.map((invitation) => {
          const isSelected = selectedInvitationId === invitation.id;
          const isPending = invitation.responseStatus === "pending";
          const title = invitation.project?.title || invitation.title || 'Message';
          const fromName = invitation.client?.name || 'Client';
          const companyName = invitation.client?.companyName || null;
          
          return (
            <div
              key={invitation.id}
              className={cn(
                "rounded-lg border p-3 cursor-pointer transition-colors",
                isSelected 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
              onClick={() => onInvitationSelect(invitation)}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm line-clamp-1">
                    {title}
                  </h4>
                  <Badge 
                    variant={isPending ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isPending ? "Pending" : invitation.responseStatus}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>From: {fromName}</span>
                  {companyName && (
                    <>
                      <span>•</span>
                      <span>{companyName}</span>
                    </>
                  )}
                </div>

                {invitation.message && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700 line-clamp-2">
                        "{invitation.message}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(invitation.assignedAt)}</span>
                  </div>
                  
                  {invitation.responseStatus === "expired" && (
                    <div className="text-xs text-red-600 font-medium">
                      ⏰ Expired
                    </div>
                  )}
                  
                  {isPending && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(invitation.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(invitation.id);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Pagination controls */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-600">
              Showing <span className="font-medium">{Math.min(totalItems, startIndex + 1)}</span> – {""}
              <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of {""}
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 rounded-md px-3" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
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
              <Button variant="outline" size="sm" className="h-9 rounded-md px-3" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
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
