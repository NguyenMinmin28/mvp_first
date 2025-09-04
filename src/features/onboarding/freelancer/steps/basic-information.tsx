"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";

export default function BasicInformationStep() {
  const router = useRouter();
  const { data: session } = useSession();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [countryCode, setCountryCode] = useState("+84");
  const countries = [
    { code: "+84", label: "Vietnam (+84)" },
    { code: "+1", label: "USA/Canada (+1)" },
    { code: "+44", label: "UK (+44)" },
    { code: "+61", label: "Australia (+61)" },
    { code: "+65", label: "Singapore (+65)" },
    { code: "+62", label: "Indonesia (+62)" },
    { code: "+60", label: "Malaysia (+60)" },
    { code: "+81", label: "Japan (+81)" },
    { code: "+82", label: "Korea (+82)" },
    { code: "+91", label: "India (+91)" },
  ];

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
    if (session?.user?.name) {
      setFullName(session.user.name);
    }
  }, [session]);

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
            <Input type="email" value={email} readOnly disabled placeholder="Registered email" />
          </div>
          {/* Removed duplicate email field */}
          <div className="space-y-1">
            <Label>Enter Phone number</Label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
              <Button disabled={!phone || sending} onClick={async () => {
                setSending(true);
                try {
                  const res = await fetch("/api/auth/wa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber: `${countryCode}${phone.replace(/[^0-9]/g, "")}` }) });
                  const data = await res.json();
                  if (res.ok) {
                    setOtpSent(true);
                  } else {
                    console.error(data?.error || "Failed to send OTP");
                  }
                } catch (e) {
                  console.error(e);
                } finally {
                  setSending(false);
                }
              }}>Verify via WhatsApp</Button>
            </div>
            {otpSent && (
              <div className="flex gap-2 pt-2">
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
                <Button disabled={!otp || verifying} onClick={async () => {
                  setVerifying(true);
                  try {
                    const res = await fetch("/api/auth/wa/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber: `${countryCode}${phone.replace(/[^0-9]/g, "")}`, verificationCode: otp }) });
                    const data = await res.json();
                    if (!res.ok) {
                      console.error(data?.error || "Invalid code");
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setVerifying(false);
                  }
                }}>Confirm</Button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button className="min-w-28" onClick={() => router.push("/onboarding/freelancer/skills-and-roles")}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


