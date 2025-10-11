"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { 
  MessageCircle, 
  User, 
  Building, 
  Calendar, 
  DollarSign, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code,
  MapPin,
  Target,
  TrendingUp,
  Users,
  Star,
  ExternalLink
} from "lucide-react";

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  budget?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  paymentMethod?: string;
  skillsRequired?: string[]; // Now contains skill names instead of IDs
  expectedStartAt?: string;
  expectedEndAt?: string;
  status: string;
  postedAt?: string;
  candidateCount?: number;
}

interface MessageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    id: string;
    projectTitle: string;
    title?: string;
    message?: string;
    clientMessage?: string;
    budget?: string;
    description?: string;
    responseStatus: string;
    assignedAt: string;
    referencedProject?: {
      id: string;
      title: string;
    } | null;
    developer: {
      name: string;
      email: string;
      image?: string;
    };
    client?: {
      name: string;
      companyName?: string;
    };
  } | null;
}

export function MessageDetailModal({ isOpen, onClose, message }: MessageDetailModalProps) {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);

  useEffect(() => {
    if (message?.referencedProject?.id && isOpen) {
      fetchProjectDetails(message.referencedProject.id);
    }
  }, [message?.referencedProject?.id, isOpen]);

  const fetchProjectDetails = async (projectId: string) => {
    setLoadingProject(true);
    console.log('🔍 Fetching project details for ID:', projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 Project API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Project API response data:', data);
        if (data.success && data.project) {
          console.log('✅ Setting project details:', data.project);
          setProjectDetails(data.project);
        } else {
          console.error('❌ Invalid project data received:', data);
          setProjectDetails(null);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch project details:', response.status, response.statusText, errorText);
        setProjectDetails(null);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      setProjectDetails(null);
    } finally {
      setLoadingProject(false);
    }
  };

  if (!message) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "expired":
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200";
      case "pending":
        return "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200";
      case "expired":
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200";
      default:
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      case "pending":
        return "Pending Response";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  const formatBudget = (budget?: number, currency = "USD") => {
    if (!budget) return null;
    if (budget >= 1000000) {
      return `$${(budget / 1000000).toFixed(1)}M ${currency}`;
    } else if (budget >= 1000) {
      return `$${(budget / 1000).toFixed(1)}K ${currency}`;
    } else {
      return `$${budget.toLocaleString()} ${currency}`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200";
      case "accepted":
        return "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200";
      case "submitted":
        return "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200";
      case "assigning":
        return "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200";
      case "draft":
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200";
      case "canceled":
        return "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200";
      default:
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <DialogTitle className="flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">Message Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Left Column - Message Information */}
          <div className="flex-1 lg:border-r border-slate-200 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Message Header */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                      {message.title || `Message to ${message.developer?.name || 'Developer'}`}
                    </h2>
                    <p className="text-slate-600 font-medium">
                      Project: {message.projectTitle}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(message.responseStatus)} flex items-center gap-2 px-3 py-1.5 text-sm font-medium`}>
                    {getStatusIcon(message.responseStatus)}
                    {getStatusText(message.responseStatus)}
                  </Badge>
                </div>
              </div>

              {/* Developer Info */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  Developer Information
                </h3>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
                    <AvatarImage src={message.developer?.image} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                      {message.developer?.name?.charAt(0).toUpperCase() || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-indigo-900 text-lg">{message.developer?.name || 'Developer'}</p>
                    <p className="text-indigo-700 font-medium">{message.developer?.email || 'No email'}</p>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  Message Content
                </h3>
                <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
                  <p className="text-slate-700 leading-relaxed text-base">{message.message || message.clientMessage}</p>
                </div>
              </div>

              {/* Message Project Details (from form) */}
              {(message.budget || message.description) && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                  <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    Message Project Details
                  </h3>
                  <div className="space-y-4">
                    {message.budget && (
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-amber-200">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-slate-700">Budget:</span>
                        <span className="text-green-600 font-bold text-lg">{message.budget}</span>
                      </div>
                    )}
                    {message.description && (
                      <div className="bg-white rounded-lg p-4 border border-amber-200">
                        <span className="font-semibold text-slate-700 mb-2 block">Description:</span>
                        <p className="text-slate-700 leading-relaxed">{message.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-700 font-medium">Sent: {new Date(message.assignedAt).toLocaleString()}</span>
                  </div>
                  {message.responseStatus === "accepted" && (
                    <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-green-200">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-green-700 font-medium">Developer accepted the invitation</span>
                    </div>
                  )}
                  {message.responseStatus === "rejected" && (
                    <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-red-200">
                      <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                        <XCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-red-700 font-medium">Developer declined the invitation</span>
                    </div>
                  )}
                  {message.responseStatus === "expired" && (
                    <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-orange-200">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-orange-700 font-medium">Invitation expired</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Referenced Project Details */}
          {message.referencedProject && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-violet-900 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      Referenced Project Details
                    </h3>
                    {projectDetails && (
                      <Badge className={`${getProjectStatusColor(projectDetails.status)} text-xs px-3 py-1.5 font-medium`}>
                        {projectDetails.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  {loadingProject ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                        <span className="text-violet-600 font-medium">Loading project details...</span>
                      </div>
                    </div>
                  ) : projectDetails ? (
                    <div className="space-y-6">
                      {/* Project Header */}
                      <div className="bg-white border border-violet-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-xl font-bold text-slate-800">{projectDetails.title}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-violet-600 border-violet-300 hover:bg-violet-50 font-medium"
                            onClick={() => window.open(`/projects/${projectDetails.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Project
                          </Button>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-base">{projectDetails.description}</p>
                      </div>

                      {/* Project Stats Grid */}
                      <div className="grid grid-cols-1 gap-6">
                        {/* Budget Information */}
                        {(projectDetails.budget || projectDetails.budgetMin || projectDetails.budgetMax) && (
                          <div className="bg-white border border-violet-200 rounded-xl p-6 shadow-sm">
                            <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                <DollarSign className="h-4 w-4 text-white" />
                              </div>
                              Budget Information
                            </h5>
                            <div className="space-y-3">
                              {projectDetails.budget && (
                                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3 border border-green-200">
                                  <span className="text-slate-700 font-medium">Fixed Budget:</span>
                                  <span className="font-bold text-green-600 text-lg">
                                    {formatBudget(projectDetails.budget, projectDetails.currency)}
                                  </span>
                                </div>
                              )}
                              {(projectDetails.budgetMin || projectDetails.budgetMax) && (
                                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3 border border-green-200">
                                  <span className="text-slate-700 font-medium">Budget Range:</span>
                                  <span className="font-bold text-green-600 text-lg">
                                    {formatBudget(projectDetails.budgetMin, projectDetails.currency)} - {formatBudget(projectDetails.budgetMax, projectDetails.currency)}
                                  </span>
                                </div>
                              )}
                              {projectDetails.paymentMethod && (
                                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200">
                                  <span className="text-slate-700 font-medium">Payment Method:</span>
                                  <span className="font-semibold text-slate-800 capitalize">
                                    {projectDetails.paymentMethod}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Timeline Information */}
                        {(projectDetails.expectedStartAt || projectDetails.expectedEndAt || projectDetails.postedAt) && (
                          <div className="bg-white border border-violet-200 rounded-xl p-6 shadow-sm">
                            <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                                <Calendar className="h-4 w-4 text-white" />
                              </div>
                              Timeline
                            </h5>
                            <div className="space-y-3">
                              {projectDetails.postedAt && (
                                <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200">
                                  <span className="text-slate-700 font-medium">Posted:</span>
                                  <span className="font-semibold text-slate-800">
                                    {formatDate(projectDetails.postedAt)}
                                  </span>
                                </div>
                              )}
                              {projectDetails.expectedStartAt && (
                                <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200">
                                  <span className="text-slate-700 font-medium">Start Date:</span>
                                  <span className="font-semibold text-slate-800">
                                    {formatDate(projectDetails.expectedStartAt)}
                                  </span>
                                </div>
                              )}
                              {projectDetails.expectedEndAt && (
                                <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200">
                                  <span className="text-slate-700 font-medium">End Date:</span>
                                  <span className="font-semibold text-slate-800">
                                    {formatDate(projectDetails.expectedEndAt)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Skills Required */}
                        {projectDetails.skillsRequired && projectDetails.skillsRequired.length > 0 && (
                          <div className="bg-white border border-violet-200 rounded-xl p-6 shadow-sm">
                            <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                <Code className="h-4 w-4 text-white" />
                              </div>
                              Required Skills
                            </h5>
                            <div className="flex flex-wrap gap-3">
                              {projectDetails.skillsRequired.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 px-3 py-1.5 font-medium">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Project Stats */}
                        <div className="bg-white border border-violet-200 rounded-xl p-6 shadow-sm">
                          <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-white" />
                            </div>
                            Project Statistics
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            {projectDetails.candidateCount !== undefined && (
                              <div className="text-center bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="text-2xl font-bold text-blue-600">{projectDetails.candidateCount}</div>
                                <div className="text-sm text-slate-600 font-medium">Candidates</div>
                              </div>
                            )}
                            <div className="text-center bg-green-50 rounded-lg p-4 border border-green-200">
                              <div className="text-2xl font-bold text-green-600">
                                {projectDetails.status === 'completed' ? '✅' : 
                                 projectDetails.status === 'in_progress' ? '🔄' :
                                 projectDetails.status === 'accepted' ? '👥' : '📋'}
                              </div>
                              <div className="text-sm text-slate-600 font-medium">Status</div>
                            </div>
                            <div className="text-center bg-purple-50 rounded-lg p-4 border border-purple-200">
                              <div className="text-2xl font-bold text-purple-600">
                                {projectDetails.paymentMethod === 'hourly' ? '⏰' : '💰'}
                              </div>
                              <div className="text-sm text-slate-600 font-medium">Payment</div>
                            </div>
                            <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-200">
                              <div className="text-2xl font-bold text-orange-600">
                                {projectDetails.skillsRequired?.length || 0}
                              </div>
                              <div className="text-sm text-slate-600 font-medium">Skills</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-violet-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                          <AlertCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Project: {message.referencedProject.title}</p>
                          <p className="text-slate-600 font-medium">Unable to load detailed project information</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-2 font-medium border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Close
            </Button>
            {message.responseStatus === "accepted" && (
              <Button 
                className="px-6 py-2 font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                View Project
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}