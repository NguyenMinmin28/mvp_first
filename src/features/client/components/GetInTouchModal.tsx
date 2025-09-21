"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Textarea } from "@/ui/components/textarea";
import { Input } from "@/ui/components/input";
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
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
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
          budget: budget.trim() || null,
          description: description.trim() || null,
          contactVia,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Lead sent successfully!");
        setMessage("");
        setBudget("");
        setDescription("");
        setCurrentStep(1);
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
      setBudget("");
      setDescription("");
      setCurrentStep(1);
      onClose();
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md z-[70] [&>div]:z-[70]">
        <DialogHeader>
          <DialogTitle>Get in Touch</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Info - Always visible */}
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

          {/* Step 1: Message only */}
          {currentStep === 1 && (
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
          )}

          {/* Step 2: Budget and Description */}
          {currentStep === 2 && (
            <>
              <div>
                <Label htmlFor="budget" className="text-sm font-medium text-gray-700">
                  Budget (Optional)
                </Label>
                <Input
                  id="budget"
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g., $500-1000, $50/hour, Fixed $2000"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Project Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project in more detail..."
                  className="mt-1"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {description.length}/500 characters
                </div>
              </div>
            </>
          )}

          {/* Step 3: Contact Method */}
          {currentStep === 3 && (
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
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="text-xs text-blue-700 font-medium mb-1">
                  📊 Activity Log Sharing
                </div>
                <div className="text-xs text-blue-600">
                  By contacting this developer, you agree to share your activity logs including project history, 
                  communication patterns, and collaboration preferences to help them understand your needs better.
                </div>
              </div>
              
              <div className="mt-2 p-3 bg-green-50 rounded-md">
                <div className="text-xs text-green-700 font-medium mb-1">
                  ✅ Ready to Send
                </div>
                <div className="text-xs text-green-600">
                  Your message and project details will be sent to the developer. They will be able to see your activity logs to better understand your needs.
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between space-x-3 pt-4">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-black text-white hover:bg-black/90"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black text-white hover:bg-black/90"
                >
                  {isSubmitting ? "Sending..." : "Send Lead"}
                </Button>
              )}
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center space-x-2 pt-2">
            <div className={`w-2 h-2 rounded-full ${currentStep >= 1 ? 'bg-black' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full ${currentStep >= 2 ? 'bg-black' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full ${currentStep >= 3 ? 'bg-black' : 'bg-gray-300'}`} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default GetInTouchModal;

