"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Textarea } from "@/ui/components/textarea";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { toast } from "sonner";

interface MessageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (data: { message: string; title?: string; budget?: string; description?: string }) => void;
  onBack?: () => void; // New prop for going back to contact options
  developerName?: string;
  projectId?: string;
}

export function MessageForm({ isOpen, onClose, onNext, onBack, developerName, projectId }: MessageFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (message.length > 300) {
      toast.error("Message must be 300 characters or less");
      return;
    }

    // No longer require project context for direct messages

    setIsSubmitting(true);
    
    try {
      // Call the onNext callback with all the data
      onNext({
        message: message.trim(),
        title: title.trim() || undefined,
        budget: budget.trim() || undefined,
        description: description.trim() || undefined,
      });
    } catch (error) {
      console.error("Error submitting message:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open?: boolean) => {
    if (open === false && !isSubmitting) {
      setMessage("");
      setTitle("");
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
          <DialogTitle>Send Message to Developer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Developer Info - Always visible */}
          <div>
            <Label htmlFor="developer-name" className="text-sm font-medium text-gray-700">
              Developer
            </Label>
            <div className="mt-1 text-sm text-gray-900 font-medium">
              {developerName || "Developer"}
            </div>
          </div>

          {/* Step 1: Message only */}
          {currentStep === 1 && (
            <div>
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                Message *
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell the developer about your project requirements..."
                className="mt-1"
                rows={4}
                maxLength={300}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {message.length}/300 characters
              </div>
            </div>
          )}

          {/* Step 2: Title, Budget and Description */}
          {currentStep === 2 && (
            <>
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Message Title (Optional)
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Website Development Project"
                  className="mt-1"
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {title.length}/100 characters
                </div>
              </div>

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

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="p-3 bg-green-50 rounded-md">
              <div className="text-xs text-green-700 font-medium mb-1">
                ✅ Ready to Send
              </div>
              <div className="text-xs text-green-600">
                Your message will be sent to the developer. They can respond to your inquiry directly.
                {projectId && (
                  <>
                    <br />
                    Since this is related to a project, they can accept or decline your project invitation.
                    If they accept, you'll be able to contact them directly.
                  </>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between space-x-3 pt-4">
            <div>
              {(currentStep > 1 || onBack) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep > 1 ? handleBack : onBack}
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
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!message.trim()}
                  className="bg-black text-white hover:bg-black/90"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="bg-black text-white hover:bg-black/90"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
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
