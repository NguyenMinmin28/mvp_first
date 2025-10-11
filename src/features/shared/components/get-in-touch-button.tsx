"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { toast } from "sonner";
import { useCanViewContact } from "../hooks/use-can-view-contact";
import { useManualInvite } from "../hooks/use-manual-invite";
import { ContactCard } from "./contact-card";
import { MessageForm } from "./message-form";
import { FindingDeveloperOverlay } from "./finding-developer-overlay";
import { ContactOptionsModal } from "./contact-options-modal";
import { WhatsAppContactModal } from "./whatsapp-contact-modal";

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

  const { contactInfo, loading: contactLoading } = useCanViewContact(developerId, projectId);
  const { sendInvite, loading: inviteLoading } = useManualInvite(projectId);


  const handleGetInTouch = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to parent card
    e.preventDefault(); // Prevent default behavior
    e.nativeEvent.stopImmediatePropagation(); // Stop all event propagation
    
    if (contactLoading) return;

    // Always show contact options modal first (Message vs WhatsApp)
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

  // Disable if explicitly disabled, loading, or response status is not "accepted"
  // If responseStatus is provided (project context), only enable for "accepted"
  // If responseStatus is not provided (service context), allow normal behavior
  const isDisabled = disabled || contactLoading || inviteLoading || (responseStatus !== undefined && responseStatus !== "accepted");

  return (
    <>
      <Button
        className={className}
        variant={variant}
        size={size}
        onClick={handleGetInTouch}
        disabled={isDisabled}
      >
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
      />
    </>
  );
}
