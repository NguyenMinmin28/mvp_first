"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { useRouter } from "next/navigation";

export default function VerificationStep() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl font-extrabold">Verification</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <Label>Government ID</Label>
            <Input type="file" />
          </div>
          <div className="space-y-1">
            <Label>Take Selfie</Label>
            <Input type="file" />
          </div>
          <div className="space-y-1">
            <Label>Choose Date</Label>
            <Input type="date" />
          </div>
          <div className="space-y-1">
            <Label>Enter LinkedIn/GitHub profile URL</Label>
            <Input placeholder="https://" />
          </div>

          <div className="pt-2">
            <Button className="min-w-28" onClick={() => router.push("/onboarding/freelancer/agreement")}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


