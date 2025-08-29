"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { useState } from "react";

export default function BasicInformationStep() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [altEmail, setAltEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl font-extrabold">Basic Information</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <Label>Enter Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter Full Name" />
          </div>
          <div className="space-y-1">
            <Label>Enter Email ID</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter Email ID" />
          </div>
          <div className="space-y-1">
            <Label>Enter Email ID</Label>
            <Input type="email" value={altEmail} onChange={(e) => setAltEmail(e.target.value)} placeholder="Enter Email ID" />
          </div>
          <div className="space-y-1">
            <Label>Enter Phone number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter Phone number" />
          </div>

          <div className="pt-2">
            <Button className="min-w-28">Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


