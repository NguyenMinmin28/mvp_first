"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { fireAndForget } from "@/core/utils/fireAndForget";

export default function VerificationStep() {
  const router = useRouter();
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [linkedinError, setLinkedinError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("onboarding.verification");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.linkedin === 'string') setLinkedin(d.linkedin);
      if (typeof d.facebook === 'string') setFacebook(d.facebook);
      if (typeof d.instagram === 'string') setInstagram(d.instagram);
      if (typeof d.xUrl === 'string') setXUrl(d.xUrl);
    } catch {}
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem("onboarding.verification", JSON.stringify({ linkedin, facebook, instagram, xUrl })); } catch {}
    }, 250);
    return () => clearTimeout(id);
  }, [linkedin, facebook, instagram, xUrl]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl font-extrabold">Verification</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label>LinkedIn profile</Label>
              <span className="text-red-500 text-sm">Required</span>
            </div>
            <Input 
              value={linkedin} 
              onChange={(e) => {
                setLinkedin(e.target.value);
                setLinkedinError("");
              }} 
              placeholder="https://www.linkedin.com/in/username"
              className={linkedinError ? "border-red-500 focus:ring-red-500" : ""}
            />
            {linkedinError && (
              <p className="text-sm text-red-500">{linkedinError}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Facebook profile</Label>
            <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://www.facebook.com/username" />
          </div>
          <div className="space-y-1">
            <Label>Instagram profile</Label>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://www.instagram.com/username" />
          </div>
          <div className="space-y-1">
            <Label>X (Twitter) profile</Label>
            <Input value={xUrl} onChange={(e) => setXUrl(e.target.value)} placeholder="https://x.com/username" />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3">
            <Button 
              variant="outline"
              className="flex-1 sm:flex-initial min-w-28" 
              onClick={() => router.push("/onboarding/freelancer/portfolio")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              className="flex-1 sm:flex-initial min-w-28" 
              onClick={() => {
                // Validate LinkedIn URL
                const trimmedLinkedin = linkedin.trim();
                if (!trimmedLinkedin) {
                  setLinkedinError("LinkedIn profile is required");
                  return;
                }
                
                // Optional: Validate URL format
                if (!trimmedLinkedin.match(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\/.+$/i)) {
                  setLinkedinError("Please enter a valid LinkedIn profile URL");
                  return;
                }
                
                // Clear error
                setLinkedinError("");
                
                // Save to localStorage first
                try {
                  localStorage.setItem("onboarding.verification", JSON.stringify({ linkedin, facebook, instagram, xUrl }));
                } catch {}
                
                // Fire-and-forget server save (don't wait for response)
                fireAndForget('/api/user/save-onboarding', {
                  linkedinUrl: trimmedLinkedin,
                  portfolioLinks: undefined,
                });
                
                // Navigate immediately
                router.push("/onboarding/freelancer/agreement");
              }}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


