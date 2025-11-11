"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/ui/components/dialog";
import { toast } from "sonner";
import { MessageCircle, AlertCircle, Send } from "lucide-react";
import { useCanViewContact } from "../hooks/use-can-view-contact";
import { useManualInvite } from "../hooks/use-manual-invite";
import { ContactCard } from "./contact-card";
import { MessageForm } from "./message-form";
import { FindingDeveloperOverlay } from "./finding-developer-overlay";
import { ContactOptionsModal } from "./contact-options-modal";
import { WhatsAppContactModal } from "./whatsapp-contact-modal";
import { AuthRequiredModal } from "./auth-required-modal";

interface GetInTouchButtonProps {
  developerId: string;
  developerName?: string;
  projectId?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  responseStatus?: string; // For project candidates: "pending", "accepted", "rejected", "expired", "invalidated"
}

export function GetInTouchButton({
  developerId,
  developerName,
  projectId,
  className = "w-full mt-auto h-8 border border-[#838383] bg-transparent hover:bg-black hover:text-white text-gray-900 text-sm",
  variant = "outline",
  size = "default",
  disabled = false,
  responseStatus
}: GetInTouchButtonProps) {
  const [showContactCard, setShowContactCard] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showFindingOverlay, setShowFindingOverlay] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [showWhatsAppContact, setShowWhatsAppContact] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();
  const { contactInfo, loading: contactLoading } = useCanViewContact(developerId, projectId);
  const { sendInvite, loading: inviteLoading } = useManualInvite(projectId);

  // Add developer to favorites
  const addToFavorites = async (devId: string) => {
    try {
      // Only add if user is a client
      if (session?.user?.role !== "CLIENT") return;
      
      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          developerId: devId,
          ensure: true // Idempotent: only add, don't toggle
        }),
      });
      
      if (response.ok) {
        console.log('Developer added to favorites:', devId);
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      // Silently fail - don't interrupt user flow
    }
  };

  const handleGetInTouch = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to parent card
    e.preventDefault(); // Prevent default behavior
    e.nativeEvent.stopImmediatePropagation(); // Stop all event propagation
    
    if (contactLoading) return;

    // Check if user is authenticated
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    // Show warning modal if developer hasn't reviewed/approved yet (for project context)
    if (projectId && responseStatus && responseStatus !== "accepted") {
      setShowWarningModal(true);
      return;
    }

    // Always show contact options modal first (Message vs WhatsApp)
    proceedToContact();
  };

  const proceedToContact = () => {
    console.log("Showing contact options modal", { 
      developerId, 
      developerName, 
      projectId, 
      contactInfo: contactInfo?.canView 
    });
    setShowContactOptions(true);
  };

  const handleMessageSubmit = async (data: { message: string; title?: string; budget?: string; description?: string; selectedProjectId?: string }) => {
    setShowMessageForm(false);
    setShowFindingOverlay(true);

    let loadingToastId: string | number | undefined;
    try {
      loadingToastId = toast.loading("Sending message...");
      // Send all the data including message, budget, description, and selected project
      const result = await sendInvite(developerId, data);
      
      if (result.success) {
        toast.dismiss(loadingToastId);
        toast.success("Message sent successfully! The developer will be notified.");
        // Add developer to favorites when message is sent successfully
        addToFavorites(developerId);
        // Keep the overlay open for a moment to show success
        setTimeout(() => {
          setShowFindingOverlay(false);
          setShowContactOptions(false);
          setShowMessageForm(false);
          setShowWhatsAppContact(false);
        }, 1200);
      } else {
        toast.dismiss(loadingToastId);
        toast.error(result.message || "Failed to send message");
        setShowFindingOverlay(false);
      }
    } catch (error) {
      if (loadingToastId) toast.dismiss(loadingToastId);
      console.error("Error sending manual invite:", error);
      toast.error("Something went wrong. Please try again.");
      setShowFindingOverlay(false);
    }
  };

  const handleSelectMessage = () => {
    setShowContactOptions(false);
    setShowMessageForm(true);
  };

  const handleBackFromMessage = () => {
    setShowMessageForm(false);
    setShowContactOptions(true);
  };

  const handleSelectWhatsApp = () => {
    console.log("handleSelectWhatsApp called");
    console.log("contactInfo:", contactInfo);
    setShowContactOptions(false);
    setShowWhatsAppContact(true);
  };

  const handleBackFromWhatsApp = () => {
    setShowWhatsAppContact(false);
    setShowContactOptions(true);
  };

  const getButtonText = () => {
    if (contactLoading) return "Loading...";
    if (projectId && contactInfo?.canView) return "Get in Touch";
    return "Get in Touch";
  };

  // Always allow Get in Touch - no restrictions based on response status
  // Only disable if explicitly disabled or loading
  const isDisabled = disabled || contactLoading || inviteLoading;

  // Icon size based on button size
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const iconMargin = size === "sm" ? "mr-1.5" : "mr-2";

  return (
    <>
      <Button
        className={className}
        variant={variant}
        size={size}
        onClick={handleGetInTouch}
        disabled={isDisabled}
      >
        <Send className={`${iconSize} ${iconMargin} flex-shrink-0`} />
        {getButtonText()}
      </Button>

      {/* Contact Card - shown when developer has accepted project */}
      {/* Temporarily disabled to test new ContactOptionsModal */}
      {/* {projectId && contactInfo?.canView && contactInfo.developer && (
        <ContactCard
          isOpen={showContactCard}
          onClose={() => setShowContactCard(false)}
          developer={contactInfo.developer}
          projectId={projectId}
        />
      )} */}

      {/* Message Form - shown when developer hasn't accepted yet */}
      <MessageForm
        isOpen={showMessageForm}
        onClose={() => setShowMessageForm(false)}
        onNext={handleMessageSubmit}
        onBack={projectId ? handleBackFromMessage : undefined}
        developerName={developerName}
        projectId={projectId}
      />

      {/* Finding Developer Overlay */}
      <FindingDeveloperOverlay
        isOpen={showFindingOverlay}
        onClose={() => setShowFindingOverlay(false)}
        developerName={developerName}
      />

      {/* Contact Options Modal */}
      <ContactOptionsModal
        isOpen={showContactOptions}
        onClose={() => setShowContactOptions(false)}
        onSelectMessage={handleSelectMessage}
        onSelectWhatsApp={handleSelectWhatsApp}
        developer={contactInfo?.developer || {
          id: developerId,
          name: developerName || "Developer",
          email: null,
          image: null,
          whatsapp: null
        }}
        projectId={projectId}
      />

      {/* WhatsApp Contact Modal */}
      <WhatsAppContactModal
        isOpen={showWhatsAppContact}
        onClose={() => setShowWhatsAppContact(false)}
        onBack={handleBackFromWhatsApp}
        developer={contactInfo?.developer || {
          id: developerId,
          name: developerName || "Developer",
          email: null,
          image: null,
          whatsapp: contactInfo?.developer?.whatsapp || null
        }}
        projectId={projectId}
        onWhatsAppClick={() => addToFavorites(developerId)}
      />

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="contact developers"
      />

      {/* Warning Modal - Developer hasn't reviewed yet */}
      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle className="text-left">Developer Not Yet Reviewed</DialogTitle>
            </div>
            <DialogDescription className="text-left pt-2">
              This developer has not yet reviewed the project details or given approval. Do you still want to connect?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowWarningModal(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowWarningModal(false);
                proceedToContact();
              }}
              className="flex-1 sm:flex-none bg-black text-white hover:bg-gray-800"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
