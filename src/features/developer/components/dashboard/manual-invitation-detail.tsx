"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Check, X, MessageCircle, Clock, DollarSign, User, Building } from "lucide-react";
import { toast } from "sonner";

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

interface ManualInvitationDetailProps {
  invitation: ManualInvitation | null;
  onAccept: (invitationId: string) => void;
  onReject: (invitationId: string) => void;
}

export default function ManualInvitationDetail({ 
  invitation, 
  onAccept, 
  onReject 
}: ManualInvitationDetailProps) {
  if (!invitation) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a Manual Invitation
            </h3>
            <p className="text-gray-500">
              Choose an invitation from the sidebar to view details
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const isPending = invitation.responseStatus === "pending";

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{invitation.project.title}</CardTitle>
            <Badge 
              variant={isPending ? "default" : "secondary"}
              className="w-fit"
            >
              {isPending ? "Pending Response" : invitation.responseStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Client Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Information
          </h3>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={invitation.client.image || undefined} />
              <AvatarFallback>
                {invitation.client.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{invitation.client.name}</p>
              <p className="text-sm text-gray-600">{invitation.client.email}</p>
              {invitation.client.companyName && (
                <div className="flex items-center gap-1 mt-1">
                  <Building className="h-3 w-3 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {invitation.client.companyName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Project Details</h3>
          <div className="space-y-3">
            {invitation.budget && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Budget:</span>
                <span className="text-green-600 font-semibold">
                  {invitation.budget}
                </span>
              </div>
            )}
            
            {invitation.description && (
              <div>
                <span className="font-medium">Description:</span>
                <p className="text-gray-700 mt-1 leading-relaxed">
                  {invitation.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Client Message */}
        {invitation.message && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Message from Client
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 italic leading-relaxed">
                "{invitation.message}"
              </p>
            </div>
          </div>
        )}

        {/* Invitation Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Invitation Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Received:</span>
              <span>{formatDate(invitation.assignedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Level:</span>
              <Badge variant="outline">{invitation.level}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Manual Invitation
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isPending && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onReject(invitation.id)}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onAccept(invitation.id)}
            >
              <Check className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>
        )}

        {!isPending && (
          <div className="pt-4 border-t">
            <div className="text-center">
              <Badge 
                variant={invitation.responseStatus === "accepted" ? "default" : "destructive"}
                className="text-sm"
              >
                {invitation.responseStatus === "accepted" ? "Accepted" : "Rejected"}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                You have already responded to this invitation
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
