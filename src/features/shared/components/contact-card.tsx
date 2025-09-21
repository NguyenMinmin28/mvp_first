"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { toast } from "sonner";
import { Copy, Phone, Mail, MessageCircle } from "lucide-react";

interface ContactCardProps {
  isOpen: boolean;
  onClose: () => void;
  developer: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
  projectId?: string;
}

export function ContactCard({ isOpen, onClose, developer, projectId }: ContactCardProps) {
  const [loggingView, setLoggingView] = useState(false);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onClose();
  };

  const logContactView = async () => {
    try {
      setLoggingView(true);
      await fetch("/api/contacts/log-view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          developerId: developer.id,
          projectId: projectId || null,
          context: window.location.pathname
        }),
      });
    } catch (error) {
      console.error("Failed to log contact view:", error);
    } finally {
      setLoggingView(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handlePhoneClick = () => {
    if (developer.phone) {
      window.open(`tel:${developer.phone}`, "_self");
    }
  };

  const handleWhatsAppClick = () => {
    if (developer.whatsapp) {
      window.open(`https://wa.me/${developer.whatsapp.replace("+", "")}`, "_blank");
    }
  };

  const handleEmailClick = () => {
    if (developer.email) {
      window.open(`mailto:${developer.email}`, "_self");
    }
  };

  // Log view when component opens
  useState(() => {
    if (isOpen) {
      logContactView();
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Developer Contact</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Developer Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={developer.image || undefined} />
              <AvatarFallback>
                {developer.name?.charAt(0)?.toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{developer.name || "Developer"}</h3>
              <p className="text-sm text-gray-600">Available for contact</p>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="space-y-3">
            {developer.phone && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Phone</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePhoneClick}
                    className="h-8 px-3"
                  >
                    Call
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(developer.phone!, "Phone number")}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {developer.email && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEmailClick}
                    className="h-8 px-3"
                  >
                    Email
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(developer.email!, "Email address")}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {developer.whatsapp && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWhatsAppClick}
                    className="h-8 px-3"
                  >
                    Chat
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(developer.whatsapp!, "WhatsApp number")}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 You can now contact this developer directly. This contact information 
              will remain available for this project.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={handleClose} className="bg-black text-white hover:bg-gray-800">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
