"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { MessageCircle, Phone } from "lucide-react";

interface ContactOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: () => void;
  onSelectWhatsApp: () => void;
  developer: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    whatsapp: string | null;
  };
  projectId?: string;
}

export function ContactOptionsModal({ 
  isOpen, 
  onClose, 
  onSelectMessage, 
  onSelectWhatsApp, 
  developer,
  projectId 
}: ContactOptionsModalProps) {
  console.log("ContactOptionsModal render:", { isOpen, developer, projectId });
  
  const handleClose = () => {
    console.log("ContactOptionsModal handleClose called");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md z-[70] [&>div]:z-[70]">
        <DialogHeader>
          <DialogTitle>Contact {developer.name || "Developer"}</DialogTitle>
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
              <p className="text-sm text-gray-600">Choose how you'd like to contact</p>
            </div>
          </div>

          {/* Contact Options */}
          <div className="grid grid-cols-2 gap-4">
            {/* Message Option */}
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2 border-2 hover:border-blue-500 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onSelectMessage();
              }}
            >
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">Message</span>
              <span className="text-xs text-gray-500">Send a message</span>
            </Button>

            {/* WhatsApp Option */}
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2 border-2 hover:border-green-500 hover:bg-green-50"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log("WhatsApp button clicked");
                onSelectWhatsApp();
              }}
            >
              <Phone className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">WhatsApp</span>
              <span className="text-xs text-gray-500">
                {developer.whatsapp ? "Direct contact" : "Check availability"}
              </span>
            </Button>
          </div>

          {/* Info Note */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Message: Send a project invitation through our platform.<br/>
              WhatsApp: Check if the developer has shared their contact number.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
