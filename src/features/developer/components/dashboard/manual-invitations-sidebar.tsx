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
  };
  client: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    companyName: string;
  };
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
        <p className="text-sm text-gray-600">
          {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((invitation) => {
          const isSelected = selectedInvitationId === invitation.id;
          const isPending = invitation.responseStatus === "pending";
          
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
                    {invitation.project.title}
                  </h4>
                  <Badge 
                    variant={isPending ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isPending ? "Pending" : invitation.responseStatus}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>From: {invitation.client.name}</span>
                  {invitation.client.companyName && (
                    <>
                      <span>•</span>
                      <span>{invitation.client.companyName}</span>
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
      </CardContent>
    </Card>
  );
}
