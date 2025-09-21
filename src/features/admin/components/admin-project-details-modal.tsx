"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  MessageSquare,
  Star,
  Eye,
  DollarSign,
  FileText,
  Activity,
  TrendingUp,
  MapPin,
  Briefcase
} from "lucide-react";

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

export function AdminProjectDetailsModal({
  isOpen,
  onClose,
  project,
}: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!project) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "assigning":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getResponseStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "EXPERT":
        return "bg-purple-100 text-purple-800";
      case "MID":
        return "bg-blue-100 text-blue-800";
      case "FRESHER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatResponseTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Details: {project.title}
          </DialogTitle>
          <DialogDescription>
            Complete information about the project and related activities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Status & Basic Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(project.status)}>
                {project.status.toUpperCase()}
              </Badge>
              <div className="text-sm text-muted-foreground">
                Created: {formatDate(project.createdAt)}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Updated: {formatDate(project.updatedAt)}</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="freelancers">Freelancers</TabsTrigger>
              <TabsTrigger value="batches">Batches</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Title</label>
                      <p className="font-medium">{project.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="text-sm">{project.description}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Required Skills</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.skillsRequired.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Budget</label>
                        <p className="font-medium">
                          {project.budget ? `$${project.budget}` : 
                           project.budgetMin && project.budgetMax ? 
                           `$${project.budgetMin} - $${project.budgetMax}` : 
                           "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                        <p className="font-medium">{project.paymentMethod || "Not specified"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {project._count.assignmentBatches}
                        </div>
                        <div className="text-sm text-blue-600">Batches</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {project._count.assignmentCandidates}
                        </div>
                        <div className="text-sm text-green-600">Candidates</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {project._count.contactRevealEvents}
                        </div>
                        <div className="text-sm text-purple-600">Contact Reveals</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {project._count.progressUpdates}
                        </div>
                        <div className="text-sm text-orange-600">Updates</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Client Tab */}
            <TabsContent value="client" className="space-y-4">
              <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Client Information
                    </CardTitle>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
                      {(project.client.user.name || project.client.user.email)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {project.client.user.name || "No name"}
                      </h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {project.client.user.email}
                        </div>
                        {project.client.user.phoneE164 && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {project.client.user.phoneE164}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Joined: {formatDate(project.client.user.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {project.contactRevealEnabled && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">Contact Reveal Enabled</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Revealed {project.contactRevealsCount} times
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Freelancers Tab */}
            <TabsContent value="freelancers" className="space-y-4">
              <div className="space-y-4">
                {/* Current Batch Candidates */}
                {project.currentBatch && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Current Batch (Batch #{project.currentBatch.batchNumber})
                      </CardTitle>
                      <CardDescription>
                        Status: <Badge variant="outline">{project.currentBatch.status}</Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {project.currentBatch.candidates.map((candidate: any) => (
                          <div key={candidate.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                                {(candidate.developer.user.name || candidate.developer.user.email)?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {candidate.developer.user.name || candidate.developer.user.email}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {candidate.developer.user.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getLevelColor(candidate.developer.level)}>
                                {candidate.developer.level}
                              </Badge>
                              <Badge className={getResponseStatusColor(candidate.responseStatus)}>
                                {candidate.responseStatus}
                              </Badge>
                              {candidate.developer.whatsappVerified && (
                                <Badge className="bg-green-100 text-green-800">
                                  WhatsApp
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Assignment Candidates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      All Assigned Freelancers
                    </CardTitle>
                    <CardDescription>
                      History of all freelancers assigned to this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {project.assignmentCandidates.map((candidate: any) => (
                        <div key={candidate.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                              {(candidate.developer.user.name || candidate.developer.user.email)?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">
                                {candidate.developer.user.name || candidate.developer.user.email}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {candidate.developer.user.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Assigned: {formatDate(candidate.assignedAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getLevelColor(candidate.developer.level)}>
                              {candidate.developer.level}
                            </Badge>
                            <Badge className={getResponseStatusColor(candidate.responseStatus)}>
                              {candidate.responseStatus}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              Batch #{candidate.batch.batchNumber}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Reveals */}
                {project.contactRevealEvents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Contact Reveals
                      </CardTitle>
                      <CardDescription>
                        History of contact reveals
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {project.contactRevealEvents.map((event: any) => (
                          <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                                {(event.developer.user.name || event.developer.user.email)?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {event.developer.user.name || event.developer.user.email}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {event.developer.user.email}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {event.channel === "whatsapp" ? "WhatsApp" : "Email"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(event.revealedAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Batches Tab */}
            <TabsContent value="batches" className="space-y-4">
              <div className="space-y-4">
                {project.assignmentBatches.map((batch: any) => (
                  <Card key={batch.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Batch #{batch.batchNumber}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4">
                          <span>Trạng thái: <Badge variant="outline">{batch.status}</Badge></span>
                          <span>Tạo lúc: {formatDate(batch.createdAt)}</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {batch.candidates.map((candidate: any) => (
                          <div key={candidate.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                                {(candidate.developer.user.name || candidate.developer.user.email)?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {candidate.developer.user.name || candidate.developer.user.email}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {candidate.developer.user.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getLevelColor(candidate.developer.level)}>
                                {candidate.developer.level}
                              </Badge>
                              <Badge className={getResponseStatusColor(candidate.responseStatus)}>
                                {candidate.responseStatus}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.progressUpdates.map((update: any) => (
                      <div key={update.id} className="flex gap-3 p-3 border rounded-lg">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                          {(update.author.name || update.author.email)?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {update.author.name || update.author.email}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {update.authorRole}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(update.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{update.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.reviews.map((review: any) => (
                      <div key={review.id} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-sm font-semibold text-yellow-600">
                            {(review.fromUser.name || review.fromUser.email)?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">
                                {review.fromUser.name || review.fromUser.email}
                              </span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {review.type === "client_for_developer" ? "Client → Developer" : "Developer → Client"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(review.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
