"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { 
  RefreshCw, 
  Eye, 
  Clock, 
  Star, 
  TrendingUp, 
  User, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Users,
  Award,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  title: string;
  description: string;
  skillsRequired: string[];
  status: string;
  contactRevealEnabled: boolean;
  currentBatchId?: string;
}

interface Candidate {
  id: string;
  developerId: string;
  level: "EXPERT" | "MID" | "FRESHER";
  responseStatus: "pending" | "accepted" | "rejected" | "expired" | "invalidated";
  acceptanceDeadline: string;
  assignedAt: string;
  respondedAt?: string;
  usualResponseTimeMsSnapshot: number;
  statusTextForClient: string;
  developer: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    level: string;
    skills: Array<{
      skill: {
        name: string;
      };
      years: number;
    }>;
  };
}

interface AssignmentData {
  project: ProjectData;
  candidates: Candidate[];
  skills: Array<{ id: string; name: string }>;
}

interface Props {
  projectId: string;
}

export default function ProjectAssignmentView({ projectId }: Props) {
  const [data, setData] = useState<AssignmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);
  const [contactInfo, setContactInfo] = useState<{ whatsapp?: string; email: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = async (showLoadingToast = false) => {
    try {
      if (showLoadingToast) {
        toast.loading("Fetching latest data...", { id: "fetch-data" });
      }
      
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/projects/${projectId}/assignment?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const assignmentData = await response.json();
        setData(assignmentData);
        if (showLoadingToast) {
          toast.success("Data updated successfully!", { id: "fetch-data" });
        }
      } else {
        toast.error("Failed to load project data");
        if (showLoadingToast) {
          toast.dismiss("fetch-data");
        }
      }
    } catch (error) {
      console.error("Error fetching assignment data:", error);
      toast.error("Something went wrong");
      if (showLoadingToast) {
        toast.dismiss("fetch-data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset states when projectId changes
    setData(null);
    setIsLoading(true);
    setContactInfo(null);
    setRefreshKey(0);
    
    fetchData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setShowRefreshConfirm(false);

    try {
      // Show refreshing toast
      toast.loading("Refreshing batch...", { id: "refresh-batch" });
      
      const response = await fetch(`/api/projects/${projectId}/batches/refresh`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fresherCount: 5,
          midCount: 5,
          expertCount: 3,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Batch refreshed successfully!", { id: "refresh-batch" });
        
        // Force refresh key to trigger re-render
        setRefreshKey(prev => prev + 1);
        
        // Clear any existing data to force re-render
        setData(null);
        setIsLoading(true);
        
        // Fetch fresh data immediately
        await fetchData(true);
        
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to refresh batch", { id: "refresh-batch" });
      }
    } catch (error) {
      console.error("Error refreshing batch:", error);
      toast.error("Something went wrong", { id: "refresh-batch" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRevealContact = async () => {
    setShowRevealConfirm(false);

    try {
      const response = await fetch(`/api/projects/${projectId}/contact-reveal`, {
        method: "POST",
      });

      if (response.ok) {
        const contactData = await response.json();
        setContactInfo(contactData);
        toast.success("Contact information revealed!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to reveal contact");
      }
    } catch (error) {
      console.error("Error revealing contact:", error);
      toast.error("Something went wrong");
    }
  };

  const formatTimeRemaining = (deadline: string) => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const remaining = deadlineTime - now;

    if (remaining <= 0) return "Expired";

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatResponseTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    if (minutes < 60) return `~${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `~${hours}h`;
  };

  const groupCandidatesByLevel = (candidates: Candidate[]) => {
    return {
      EXPERT: candidates.filter(c => c.level === "EXPERT"),
      MID: candidates.filter(c => c.level === "MID"),
      FRESHER: candidates.filter(c => c.level === "FRESHER"),
    };
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "EXPERT": return <Award className="h-4 w-4" />;
      case "MID": return <TrendingUp className="h-4 w-4" />;
      case "FRESHER": return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "EXPERT": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "MID": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "FRESHER": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  const { project, candidates, skills } = data;
  const groupedCandidates = groupCandidatesByLevel(candidates);
  const hasAcceptedCandidate = candidates.some(c => c.responseStatus === "accepted");
  const pendingCandidates = candidates.filter(c => c.responseStatus === "pending");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back to Projects */}
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{project.title}</CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{project.description}</p>
              <div className="flex items-center gap-2 mt-4">
                <Badge variant="outline" className="capitalize">
                  {project.status.replace('_', ' ')}
                </Badge>
                <div className="flex flex-wrap gap-1">
                  {skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="text-xs">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRefreshConfirm(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowRevealConfirm(true)}
                disabled={!project.contactRevealEnabled || !!contactInfo}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {contactInfo ? "Contact Revealed" : "Reveal Contact"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Assignment Status */}
      {project.status === "assigning" && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Assignment in Progress
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {pendingCandidates.length} developers are reviewing your project
                  </p>
                </div>
              </div>
              {hasAcceptedCandidate && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accepted
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidates by Level */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" key={refreshKey}>
        {(["EXPERT", "MID", "FRESHER"] as const).map((level) => (
          <Card key={`${level}-${refreshKey}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getLevelIcon(level)}
                {level} Developers ({groupedCandidates[level].length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedCandidates[level].length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No {level.toLowerCase()} developers assigned
                </p>
              ) : (
                groupedCandidates[level].map((candidate) => {
                  // Race condition logic
                  const isWinner = candidate.responseStatus === "accepted";
                  const isLoser = hasAcceptedCandidate && candidate.responseStatus === "pending";
                  const isExpired = candidate.responseStatus === "expired";
                  const isRejected = candidate.responseStatus === "rejected";
                  
                  // Determine card styling based on status
                  let cardClassName = "border-2";
                  let statusBadge = null;
                  
                  if (isWinner) {
                    cardClassName += " border-green-500 bg-green-50 dark:bg-green-950";
                    statusBadge = (
                      <Badge className="bg-green-500 text-white text-xs mb-2">
                        <Award className="h-3 w-3 mr-1" />
                        Winner
                      </Badge>
                    );
                  } else if (isLoser) {
                    cardClassName += " opacity-60 bg-gray-100 dark:bg-gray-800";
                    statusBadge = (
                      <Badge variant="secondary" className="text-xs mb-2">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unavailable
                      </Badge>
                    );
                  } else if (isExpired) {
                    cardClassName += " opacity-50 bg-gray-50 dark:bg-gray-900";
                    statusBadge = (
                      <Badge variant="outline" className="text-gray-500 text-xs mb-2">
                        <Clock className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    );
                  } else if (isRejected) {
                    cardClassName += " opacity-50 bg-red-50 dark:bg-red-950";
                    statusBadge = (
                      <Badge variant="outline" className="text-red-500 text-xs mb-2">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    );
                  }

                  return (
                    <Card key={`${candidate.id}-${refreshKey}`} className={cardClassName}>
                      <CardContent className="pt-4 space-y-3">
                        {/* Status Badge for Race Condition */}
                        {statusBadge}
                        
                        {/* Developer Info */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`font-semibold ${isLoser || isExpired || isRejected ? 'text-gray-500' : ''}`}>
                              {candidate.developer.user.name}
                            </h4>
                            <Badge className={`text-xs ${getLevelColor(candidate.level)} ${isLoser || isExpired || isRejected ? 'opacity-50' : ''}`}>
                              {candidate.level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(candidate.responseStatus)}
                            <span className={`text-xs capitalize ${isLoser || isExpired || isRejected ? 'text-gray-500' : ''}`}>
                              {candidate.responseStatus}
                            </span>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {candidate.developer.skills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="outline" className={`text-xs ${isLoser || isExpired || isRejected ? 'opacity-50' : ''}`}>
                                {skill.skill.name} ({skill.years}y)
                              </Badge>
                            ))}
                            {candidate.developer.skills.length > 3 && (
                              <Badge variant="outline" className={`text-xs ${isLoser || isExpired || isRejected ? 'opacity-50' : ''}`}>
                                +{candidate.developer.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Response Time & Status */}
                        <div className="flex justify-between items-center text-xs">
                          <span className={`${isLoser || isExpired || isRejected ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            Usual response: {formatResponseTime(candidate.usualResponseTimeMsSnapshot)}
                          </span>
                          {candidate.responseStatus === "pending" && !isLoser && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimeRemaining(candidate.acceptanceDeadline)}
                            </Badge>
                          )}
                        </div>

                        {/* Status Text */}
                        <p className={`text-xs text-center p-2 rounded ${
                          isWinner 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                            : isLoser 
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            : isExpired
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            : isRejected
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : 'bg-gray-50 dark:bg-gray-800'
                        }`}>
                          {isWinner 
                            ? "🎉 This developer accepted your project!" 
                            : isLoser 
                            ? "This developer is no longer available for this project"
                            : candidate.statusTextForClient
                          }
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Information Modal */}
      {contactInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Developer Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm"><strong>Email:</strong> {contactInfo.email}</p>
                {contactInfo.whatsapp && (
                  <p className="text-sm"><strong>WhatsApp:</strong> {contactInfo.whatsapp}</p>
                )}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p>Please reach out to discuss project details and next steps.</p>
              </div>
              <Button onClick={() => setContactInfo(null)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refresh Confirmation Modal */}
      {showRefreshConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Refresh Batch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                This will generate a new batch of developers. Current pending candidates will be invalidated and cannot accept anymore.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRefreshConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex-1"
                >
                  {isRefreshing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Refreshing...
                    </>
                  ) : (
                    "Confirm Refresh"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reveal Contact Confirmation Modal */}
      {showRevealConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                Reveal Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p>You are about to reveal the developer's contact information.</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <p><strong>Note:</strong> This action will be logged and may count towards your contact reveal quota in paid plans.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRevealConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRevealContact}
                  className="flex-1"
                >
                  Reveal Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
