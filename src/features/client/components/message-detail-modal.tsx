"use client";

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
  AlertCircle
} from "lucide-react";

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
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Message Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with title and status */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {message.title || `Message to ${message.developer?.name || 'Developer'}`}
              </h2>
              <p className="text-sm text-gray-600">
                Project: {message.projectTitle}
              </p>
            </div>
            <Badge className={`${getStatusColor(message.responseStatus)} flex items-center gap-1`}>
              {getStatusIcon(message.responseStatus)}
              {getStatusText(message.responseStatus)}
            </Badge>
          </div>

          {/* Developer Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Developer Information
            </h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={message.developer?.image} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {message.developer?.name?.charAt(0).toUpperCase() || 'D'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-blue-900">{message.developer?.name || 'Developer'}</p>
                <p className="text-sm text-blue-700">{message.developer?.email || 'No email'}</p>
              </div>
            </div>
          </div>


          {/* Message Content */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Message Content
            </h3>
            <div className="bg-white border border-blue-200 rounded-md p-3">
              <p className="text-gray-700 leading-relaxed">{message.message || message.clientMessage}</p>
            </div>
          </div>

          {/* Project Details */}
          {(message.budget || message.description) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Project Details
              </h3>
              <div className="space-y-3">
                {message.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-700">Budget:</span>
                    <span className="text-green-600 font-semibold">{message.budget}</span>
                  </div>
                )}
                {message.description && (
                  <div>
                    <span className="font-medium text-gray-700">Description:</span>
                    <div className="mt-1 bg-white border border-gray-200 rounded-md p-3">
                      <p className="text-gray-700 leading-relaxed">{message.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Sent: {new Date(message.assignedAt).toLocaleString()}</span>
              </div>
              {message.responseStatus === "accepted" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Developer accepted the invitation</span>
                </div>
              )}
              {message.responseStatus === "rejected" && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>Developer declined the invitation</span>
                </div>
              )}
              {message.responseStatus === "expired" && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Invitation expired</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {message.responseStatus === "accepted" && (
              <Button className="bg-green-600 hover:bg-green-700">
                View Project
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
