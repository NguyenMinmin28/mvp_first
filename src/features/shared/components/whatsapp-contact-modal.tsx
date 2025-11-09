"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { toast } from "sonner";
import { Copy, Phone, ArrowLeft } from "lucide-react";

interface WhatsAppContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  developer: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    whatsapp: string | null;
  };
  projectId?: string;
  onWhatsAppClick?: () => void; // Callback when WhatsApp is clicked
}

export function WhatsAppContactModal({
  isOpen,
  onClose, 
  onBack,
  developer,
  projectId,
  onWhatsAppClick
}: WhatsAppContactModalProps) {
  const [projectDetails, setProjectDetails] = useState<{ title: string; budget: string; description: string } | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);

  // Fetch project details when projectId is provided
  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDetails(projectId);
    }
  }, [isOpen, projectId]);

  const fetchProjectDetails = async (projectId: string) => {
    setLoadingProject(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' } as RequestInit);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.project) {
          const budget = json.project.budgetMin 
            ? `${json.project.currency || 'USD'} ${json.project.budgetMin.toLocaleString()}${json.project.budgetMax ? ` - ${json.project.budgetMax.toLocaleString()}` : ''}`
            : json.project.budget 
            ? `${json.project.currency || 'USD'} ${json.project.budget.toLocaleString()}`
            : '';
          
          setProjectDetails({
            title: json.project.title,
            budget,
            description: json.project.description || ''
          });
        }
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
    } finally {
      setLoadingProject(false);
    }
  };

  const generateWhatsAppMessage = () => {
    if (projectDetails) {
      const budgetText = projectDetails.budget ? `Budget: ${projectDetails.budget}` : '';
      const descriptionText = projectDetails.description ? `\n\nProject Summary:\n${projectDetails.description.substring(0, 200)}${projectDetails.description.length > 200 ? '...' : ''}` : '';
      return `Hi! I'd like to discuss this project with you:\n\nProject: ${projectDetails.title}${budgetText ? `\n${budgetText}` : ''}${descriptionText}\n\nWould you be interested in working on this project?`;
    }
    return "Hi! I'd like to discuss a project with you. Would you be interested?";
  };

  const handleClose = () => {
    onClose();
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleWhatsAppClick = () => {
    if (developer.whatsapp) {
      // Call callback to add to favorites
      if (onWhatsAppClick) {
        onWhatsAppClick();
      }
      
      // Generate message with project details
      const message = generateWhatsAppMessage();
      const encodedMessage = encodeURIComponent(message);
      const phoneNumber = developer.whatsapp.replace("+", "");
      
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span>WhatsApp Contact</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Developer Info */}
          <div className="flex items-center space-x-4 animate-in fade-in-0 slide-in-from-left-2 duration-500 delay-100">
            <Avatar className="h-16 w-16 ring-4 ring-green-100">
              <AvatarImage 
                src={developer.image || '/images/avata/default.jpeg'} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/avata/default.jpeg';
                }}
              />
              <AvatarFallback className="bg-gray-200 w-full h-full flex items-center justify-center">
                <img 
                  src="/images/avata/default.jpeg" 
                  alt="Default Avatar"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{developer.name || "Developer"}</h3>
              <p className="text-sm text-green-600 font-medium">WhatsApp contact available</p>
            </div>
          </div>

          {/* WhatsApp Number */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full animate-pulse">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Contact Number</p>
                  <p className="text-lg font-mono text-green-900 font-bold tracking-wider">{developer.whatsapp}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(developer.whatsapp!, "WhatsApp number")}
                className="h-8 w-8 p-0 hover:bg-green-100 transition-colors"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300">
            <Button
              onClick={handleWhatsAppClick}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-all duration-200 hover:scale-105"
            >
              <Phone className="h-4 w-4 mr-2" />
              Open WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(developer.whatsapp!, "WhatsApp number")}
              className="transition-all duration-200 hover:scale-105 hover:border-green-300"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>

          {/* Info Note */}
          <div className="p-3 bg-green-50 rounded-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-400">
            <p className="text-xs text-green-700">
              💡 Click "Open WhatsApp" to start a conversation directly, or copy the number to use in your WhatsApp app.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end space-x-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-500">
            <Button onClick={onBack} variant="outline" className="transition-all duration-200 hover:scale-105">
              Back
            </Button>
            <Button onClick={handleClose} className="bg-black text-white hover:bg-gray-800 transition-all duration-200 hover:scale-105">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
