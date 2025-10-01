"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { X, Calendar, User, Tag, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Idea {
  id: string;
  title: string;
  summary: string;
  body?: string;
  cover?: {
    id?: string;
    storageKey: string;
  } | null;
  coverUrl?: string | null;
  status: string;
  adminTags: string[];
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  skills?: Array<{
    skill: {
      id: string;
      name: string;
      category: string;
    };
  }>;
}

interface IdeaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaId: string | null;
}

export function IdeaDetailModal({ isOpen, onClose, ideaId }: IdeaDetailModalProps) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ideaId) {
      fetchIdeaDetails();
    }
  }, [isOpen, ideaId]);

  const fetchIdeaDetails = async () => {
    if (!ideaId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ideas/${ideaId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIdea(data);
      } else if (response.status === 404) {
        toast.error("Idea not found");
        setIdea(null);
      } else if (response.status === 401) {
        toast.error("Authentication required");
        setIdea(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(errorData.error || "Failed to load idea details");
        setIdea(null);
      }
    } catch (error) {
      console.error("Error fetching idea details:", error);
      toast.error("Failed to load idea details");
      setIdea(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Idea Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : idea ? (
            <div className="space-y-6">
              {/* Cover Image */}
              {(idea.coverUrl || idea.cover?.storageKey) && (
                <div className="aspect-video w-full overflow-hidden rounded-lg">
                  <img
                    src={idea.coverUrl || idea.cover?.storageKey || ""}
                    alt={idea.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Title and Status */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">{idea.title}</h1>
                  <Badge className={getStatusColor(idea.status)}>
                    {idea.status}
                  </Badge>
                </div>

                {/* Summary */}
                <p className="text-gray-700 text-lg leading-relaxed">{idea.summary}</p>

                {/* Body */}
                {idea.body && (
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Description</h3>
                    <div className="text-gray-700 whitespace-pre-wrap">{idea.body}</div>
                  </div>
                )}
              </div>

              {/* Skills */}
              {idea.skills && idea.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Skills & Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {idea.skills
                      .filter(skillItem => skillItem?.skill?.name) // Filter out invalid skills
                      .map((skillItem, index) => (
                        <Badge key={index} variant="secondary">
                          {skillItem.skill.name} ({skillItem.skill.category})
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Admin Tags */}
              {idea.adminTags && idea.adminTags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {idea.adminTags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Info */}
              {idea.author && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Author Information
                  </h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={idea.author.image || ""} alt={idea.author.name || "User"} />
                      <AvatarFallback>
                        {idea.author.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{idea.author.name || "Unknown User"}</p>
                      <p className="text-sm text-gray-500">{idea.author.email || "No email"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Submission Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span>
                    <p className="text-gray-600">{formatDate(idea.createdAt)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className="text-gray-600 capitalize">{idea.status}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load idea details</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {idea && (
            <Button
              onClick={() => window.open(`/ideas/${idea.id}`, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
