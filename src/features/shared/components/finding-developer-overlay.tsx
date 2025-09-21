"use client";

import { Dialog, DialogContent } from "@/ui/components/dialog";
import { Loader2 } from "lucide-react";

interface FindingDeveloperOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  developerName?: string;
}

export function FindingDeveloperOverlay({ 
  isOpen, 
  onClose, 
  developerName 
}: FindingDeveloperOverlayProps) {
  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-black" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Finding Developer
            </h3>
            <p className="text-sm text-gray-600">
              Sending your message to {developerName || "the developer"}...
            </p>
          </div>

          <div className="w-full max-w-xs">
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-black h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            This may take a few moments. Please don't close this window.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
