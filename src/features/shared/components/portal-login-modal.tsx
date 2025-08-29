"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { User, Briefcase } from "lucide-react";

interface PortalLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  portal: "client" | "freelancer";
  onLogin: () => void;
}

export function PortalLoginModal({ isOpen, onClose, portal, onLogin }: PortalLoginModalProps) {
  const portalInfo = {
    client: {
      title: "Login as Client",
      description: "Access your client dashboard to post projects and manage your hiring process.",
      icon: <Briefcase className="h-8 w-8" />,
      color: "bg-blue-500",
    },
    freelancer: {
      title: "Login as Freelancer", 
      description: "Access your freelancer dashboard to find projects and manage your work.",
      icon: <User className="h-8 w-8" />,
      color: "bg-green-500",
    },
  };

  const info = portalInfo[portal];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${info.color} text-white`}>
              {info.icon}
            </div>
            <DialogTitle className="text-xl">{info.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base mt-2">
            {info.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onLogin} className="flex-1">
            Login Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
