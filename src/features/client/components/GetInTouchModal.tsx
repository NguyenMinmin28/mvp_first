"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Textarea } from "@/ui/components/textarea";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";
import { toast } from "sonner";
import { MessageCircle, Phone } from "lucide-react";

interface GetInTouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceTitle: string;
  developerName?: string;
  developerImage?: string | null;
}

export function GetInTouchModal({
  isOpen,
  onClose,
  serviceId,
  serviceTitle,
  developerName,
  developerImage,
}: GetInTouchModalProps) {
  const [currentStep, setCurrentStep] = useState<number | "choice">("choice");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [contactVia, setContactVia] = useState("IN_APP");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ connectsPerMonth: number; connectsUsed: number; remaining: number } | null>(null);

  // Normalize step for numeric comparisons
  const numericStep = typeof currentStep === "number" ? currentStep : 0;

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/billing/quotas', { cache: 'no-store' } as RequestInit);
      const json = await res.json();
      if (res.ok && json?.hasActiveSubscription) {
        const connectsPerMonth = json.quotas?.connectsPerMonth ?? 0;
        const connectsUsed = json.usage?.connectsUsed ?? 0;
        const remaining = json.remaining?.connects ?? Math.max(0, connectsPerMonth - connectsUsed);
        setQuotaInfo({ connectsPerMonth, connectsUsed, remaining });
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    if (!showConfirm) {
      await fetchQuota();
      setShowConfirm(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/services/${serviceId}`, {
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
        setCurrentStep("choice");
        setShowConfirm(false);
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
      setCurrentStep("choice");
      setShowConfirm(false);
      onClose();
    }
  };

  const handleNext = () => {
    if (currentStep !== "choice" && numericStep < 3) {
      setCurrentStep((currentStep as number) + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === "choice") return;
    if (numericStep > 1) {
      setCurrentStep((currentStep as number) - 1);
    }
  };

  // Choice screen (Message vs WhatsApp)
  if (isOpen && currentStep === "choice") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{`Contact ${developerName || "Developer"}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <span className="relative flex shrink-0 overflow-hidden rounded-full h-16 w-16">
                {developerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={developerImage} alt={developerName || "Developer"} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                    {(developerName || "D").charAt(0)}
                  </span>
                )}
              </span>
              <div>
                <h3 className="text-lg font-semibold">{developerName || "Developer"}</h3>
                <p className="text-sm text-gray-600">Choose how you'd like to contact</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                className="whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-input bg-background hover:text-accent-foreground px-4 py-2 h-20 flex flex-col items-center justify-center space-y-2 border-2 hover:border-blue-500 hover:bg-blue-50"
                onClick={() => {
                  setContactVia("IN_APP");
                  setCurrentStep(1);
                }}
              >
                <MessageCircle className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">Message</span>
                <span className="text-xs text-gray-500">Send a message</span>
              </button>

              <button
                className="whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-input bg-background hover:text-accent-foreground px-4 py-2 h-20 flex flex-col items-center justify-center space-y-2 border-2 hover:border-green-500 hover:bg-green-50"
                onClick={() => {
                  setContactVia("WHATSAPP");
                  setCurrentStep(3);
                }}
              >
                <Phone className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">WhatsApp</span>
                <span className="text-xs text-gray-500">Check availability</span>
              </button>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">💡 Message: Send a project invitation through our platform.<br/>WhatsApp: Check if the developer has shared their contact number.</p>
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const headerTitle = currentStep === 1 ? "Send Message to Developer" : "Get in Touch";
  const isNextDisabled = currentStep === 1 && message.trim().length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{headerTitle}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Info - Always visible */}
          <div>
            {currentStep === 1 ? (
              <>
                <Label htmlFor="developer-name" className="text-sm font-medium text-gray-700">Developer</Label>
                <div className="mt-1 text-sm text-gray-900 font-medium">{developerName || "Developer"}</div>
              </>
            ) : (
              <>
                <Label htmlFor="service-title" className="text-sm font-medium text-gray-700">Service</Label>
                <div className="mt-1 text-sm text-gray-900 font-medium">{serviceTitle}</div>
                {developerName && (
                  <div className="text-xs text-gray-500 mt-1">by {developerName}</div>
                )}
              </>
            )}
          </div>

          {/* Step 1: Message required */}
          {currentStep === 1 && (
            <div>
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">Message *</Label>
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
              <div className="text-xs text-gray-500 mt-1">{message.length}/300 characters</div>
            </div>
          )}

          {/* Step 2: Budget and Description */}
          {currentStep === 2 && (
            <>
              <div>
                <Label htmlFor="budget" className="text-sm font-medium text-gray-700">Budget (Optional)</Label>
                <Input id="budget" type="text" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g., $500-1000, $50/hour, Fixed $2000" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Project Description (Optional)</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your project in more detail..." className="mt-1" rows={3} maxLength={500} />
                <div className="text-xs text-gray-500 mt-1">{description.length}/500 characters</div>
              </div>
            </>
          )}

          {/* Step 3: Contact Method */}
          {currentStep === 3 && (
            <div>
              <Label htmlFor="contact-via" className="text-sm font-medium text-gray-700">Preferred Contact Method</Label>
              <Select value={contactVia} onValueChange={setContactVia}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_APP">In-app messaging</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="text-xs text-blue-700 font-medium mb-1">📊 Activity Log Sharing</div>
                <div className="text-xs text-blue-600">By contacting this developer, you agree to share your activity logs including project history, communication patterns, and collaboration preferences to help them understand your needs better.</div>
              </div>
              
              <div className="mt-2 p-3 bg-green-50 rounded-md">
                <div className="text-xs text-green-700 font-medium mb-1">✅ Ready to Send</div>
                <div className="text-xs text-green-600">Your message and project details will be sent to the developer. They will be able to see your activity logs to better understand your needs.</div>
              </div>
            </div>
          )}

          {/* Confirmation Notice for Connect Quota */}
          {showConfirm && (
            <div className="p-3 rounded-md border bg-amber-50 border-amber-200">
              <div className="text-sm font-semibold text-amber-800">This action will cost 1 connect quota to contact this developer.</div>
              <div className="text-xs text-amber-700 mt-1">Free: 3 projects/month, 0 connects. Plus: 10 projects, 5 connects. Pro: Unlimited projects, 10 connects.</div>
              {quotaInfo && (<div className="text-xs text-amber-800 mt-2">Remaining connects this month: <span className="font-semibold">{quotaInfo.remaining}</span> of {quotaInfo.connectsPerMonth}</div>)}
              {quotaInfo && quotaInfo.remaining <= 0 && (<div className="text-xs text-red-600 mt-2">You have no connects left. Upgrade your plan to continue contacting developers.</div>)}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between space-x-3 pt-4">
            <div>
              {numericStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>Back</Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
              {numericStep < 3 && !showConfirm ? (
                <Button type="button" onClick={handleNext} className="bg-black text-white hover:bg-black/90" disabled={isNextDisabled}>Next</Button>
              ) : showConfirm ? (
                <Button type="submit" disabled={isSubmitting || (!!quotaInfo && quotaInfo.remaining <= 0)} className="bg-black text-white hover:bg-black/90">{!!quotaInfo && quotaInfo.remaining <= 0 ? "No connects left" : (isSubmitting ? "Sending..." : "Send Lead")}</Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="bg-black text-white hover:bg-black/90">{isSubmitting ? "Sending..." : "Send Lead"}</Button>
              )}
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center space-x-2 pt-2">
            <div className={`w-2 h-2 rounded-full ${numericStep >= 1 ? 'bg-black' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full ${numericStep >= 2 ? 'bg-black' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full ${numericStep >= 3 ? 'bg-black' : 'bg-gray-300'}`} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default GetInTouchModal;

