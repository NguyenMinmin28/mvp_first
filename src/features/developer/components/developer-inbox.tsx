"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star, 
  User, 
  Calendar,
  AlertTriangle,
  Trophy,
  Building2
} from "lucide-react";
import { toast } from "sonner";

interface InvitationCandidate {
  id: string;
  level: "EXPERT" | "MID" | "FRESHER";
  responseStatus: "pending" | "accepted" | "rejected" | "expired" | "invalidated";
  acceptanceDeadline: string;
  assignedAt: string;
  respondedAt?: string;
  isFirstAccepted: boolean;
  batch: {
    id: string;
    status: string;
    project: {
      id: string;
      title: string;
      description: string;
      skillsRequired: string[];
      status: string;
      client: {
        user: {
          name: string;
        };
        companyName?: string;
      };
    };
  };
  skills?: Array<{ name: string }>;
}

export default function DeveloperInbox() {
  const [invitations, setInvitations] = useState<InvitationCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

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
    setProcessingIds(prev => new Set([...prev, candidateId]));

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
        if (error.message?.includes("already accepted")) {
          toast.error("⏰ This project was already accepted by another developer");
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

  const formatTimeRemaining = (deadline: string) => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const remaining = deadlineTime - now;

    if (remaining <= 0) return { text: "Expired", color: "text-red-500", urgent: false };

    const totalMinutes = Math.floor(remaining / (1000 * 60));
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    const isUrgent = totalMinutes < 5;
    const color = isUrgent ? "text-red-500" : totalMinutes < 10 ? "text-yellow-500" : "text-green-500";
    
    return {
      text: `${totalMinutes}:${seconds.toString().padStart(2, '0')}`,
      color,
      urgent: isUrgent
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-500" />;
      case "expired": return <Clock className="h-4 w-4 text-gray-500" />;
      case "invalidated": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      EXPERT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      MID: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      FRESHER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors] || colors.MID}>
        {level}
      </Badge>
    );
  };

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
      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvitations.map((invitation) => {
              const timeRemaining = formatTimeRemaining(invitation.acceptanceDeadline);
              const isProcessing = processingIds.has(invitation.id);
              
              return (
                <Card key={invitation.id} className="border-2 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {invitation.batch.project.title}
                            </h3>
                            {getLevelBadge(invitation.level)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Building2 className="h-4 w-4" />
                            <span>{invitation.batch.project.client.user.name}</span>
                            {invitation.batch.project.client.companyName && (
                              <span>• {invitation.batch.project.client.companyName}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`font-mono text-lg font-bold ${timeRemaining.color} ${timeRemaining.urgent ? 'animate-pulse' : ''}`}>
                            {timeRemaining.text}
                          </div>
                          <div className="text-xs text-gray-500">remaining</div>
                        </div>
                      </div>

                      {/* Project Description */}
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                        {invitation.batch.project.description}
                      </p>

                      {/* Skills */}
                      {invitation.skills && invitation.skills.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Required Skills:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {invitation.skills.map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {skill.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assignment Info */}
                      <div className="text-xs text-gray-500 border-t pt-3">
                        <div className="flex justify-between">
                          <span>Assigned: {formatDate(invitation.assignedAt)}</span>
                          <span>Expires: {formatDate(invitation.acceptanceDeadline)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleResponse(invitation.id, "accept")}
                          disabled={isProcessing || timeRemaining.text === "Expired"}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Accept
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => handleResponse(invitation.id, "reject")}
                          disabled={isProcessing || timeRemaining.text === "Expired"}
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          {isProcessing ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </Button>
                      </div>

                      {timeRemaining.urgent && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded text-red-700 dark:text-red-300 text-xs">
                          <AlertTriangle className="h-4 w-4" />
                          <span>⚠️ Urgent: Less than 5 minutes remaining!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {respondedInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity ({respondedInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {respondedInvitations.slice(0, 5).map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(invitation.responseStatus)}
                  <div>
                    <h4 className="font-medium">{invitation.batch.project.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {invitation.batch.project.client.user.name}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {getLevelBadge(invitation.level)}
                    {invitation.isFirstAccepted && (
                      <Trophy className="h-4 w-4 text-yellow-500" title="Won Assignment" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {invitation.respondedAt ? formatDate(invitation.respondedAt) : 'No response'}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {invitations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No invitations yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Project invitations will appear here when clients select you for their projects.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
