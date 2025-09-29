"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function VerificationStep() {
  const router = useRouter();
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [xUrl, setXUrl] = useState("");

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
            <Label>LinkedIn profile</Label>
            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/username" />
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

          <div className="pt-2">
            <Button className="min-w-28" onClick={async () => {
              try {
                await fetch('/api/user/save-onboarding', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    linkedinUrl: linkedin || undefined,
                    portfolioLinks: undefined,
                  }),
                }).catch(() => {});
              } catch {}
              router.push("/onboarding/freelancer/agreement");
            }}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


