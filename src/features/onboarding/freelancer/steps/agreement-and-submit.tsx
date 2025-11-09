"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { Label } from "@/ui/components/label";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";

export default function AgreementAndSubmitStep() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [agreeTerms, setAgreeTerms] = useState(true); // Default to checked
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreeTerms) {
      alert("Please agree to the Terms and Privacy Policy before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      // First, save any pending onboarding data
      const saveResponse = await fetch("/api/user/save-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Add any pending data here if needed
          adminApprovalStatus: "draft", // Ensure it's in draft status
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "Failed to save onboarding data");
      }

      // Then submit for approval
      const submitResponse = await fetch("/api/user/submit-approval", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || "Failed to submit for approval");
      }

      // Force session refresh to get updated user data
      await updateSession();
      
      // Also call our custom refresh endpoint to ensure session is updated
      try {
        await fetch("/api/auth/refresh-session", { method: "POST" });
      } catch (e) {
        console.warn("Failed to refresh session via API:", e);
      }
      
      // Wait a bit more to ensure session is fully updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to dashboard/workspace page after successful submission
      window.location.href = "/dashboard-user";
    } catch (error) {
      console.error("Error submitting:", error);
      alert(error instanceof Error ? error.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl font-extrabold">Agreement & Submit</h1>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <label className="flex items-center gap-3">
            <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(!!v)} />
            <Label className="text-sm">
              I agree to Clevrs{" "}
              <Link 
                href="/help/terms" 
                target="_blank"
                className="text-blue-600 hover:text-blue-700 underline"
                onClick={(e) => e.stopPropagation()}
              >
                Terms
              </Link>
              {" "}&{" "}
              <Link 
                href="/privacy-policy" 
                target="_blank"
                className="text-blue-600 hover:text-blue-700 underline"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
            </Label>
          </label>

          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3">
            <Button 
              variant="outline"
              className="flex-1 sm:flex-initial min-w-28" 
              onClick={() => router.push("/onboarding/freelancer/verification")}
              disabled={submitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              className="flex-1 sm:flex-initial min-w-28" 
              disabled={submitting} 
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Finish"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


