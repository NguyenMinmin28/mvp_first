"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Textarea } from "@/ui/components/textarea";
import { Label } from "@/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";
import { toast } from "sonner";

interface GetInTouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceTitle: string;
  developerName?: string;
}

export function GetInTouchModal({
  isOpen,
  onClose,
  serviceId,
  serviceTitle,
  developerName,
}: GetInTouchModalProps) {
  const [message, setMessage] = useState("");
  const [contactVia, setContactVia] = useState("IN_APP");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/services/${serviceId}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim() || null,
          contactVia,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Lead sent successfully!");
        setMessage("");
        onClose();
      } else {
        toast.error(data.error || "Failed to send lead");
      }
    } catch (error) {
      console.error("Error sending lead:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get in Touch</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="service-title" className="text-sm font-medium text-gray-700">
              Service
            </Label>
            <div className="mt-1 text-sm text-gray-900 font-medium">
              {serviceTitle}
            </div>
            {developerName && (
              <div className="text-xs text-gray-500 mt-1">
                by {developerName}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the developer about your project requirements..."
              className="mt-1"
              rows={4}
              maxLength={300}
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}/300 characters
            </div>
          </div>

          <div>
            <Label htmlFor="contact-via" className="text-sm font-medium text-gray-700">
              Preferred Contact Method
            </Label>
            <Select value={contactVia} onValueChange={setContactVia}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_APP">In-app messaging</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-black/90"
            >
              {isSubmitting ? "Sending..." : "Send Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default GetInTouchModal;

