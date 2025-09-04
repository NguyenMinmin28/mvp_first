"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PortfolioStep() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl font-extrabold">Portfolio</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <Label>Upload up to 5 Work Samples</Label>
            <Input type="file" multiple />
          </div>
          <div className="space-y-1">
            <Label>Title/Project Name</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title/Project Name" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          </div>
          <div className="space-y-1">
            <Label>Enter URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL" />
          </div>

          <div className="pt-2">
            <Button className="min-w-28" onClick={() => router.push("/onboarding/freelancer/verification")}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


