"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SearchableCountrySelect } from "@/ui/components/searchable-country-select";

export default function BasicInformationStep() {
  const router = useRouter();
  const { data: session, status } = useSession();
  // Initialize from localStorage immediately on first render
  const initialBasic = (() => {
    if (typeof window === 'undefined') return {} as any;
    try { return JSON.parse(localStorage.getItem('onboarding.basicInfo') || '{}'); } catch { return {}; }
  })() as { fullName?: string; email?: string; countryCode?: string; phone?: string };
  const [fullName, setFullName] = useState(initialBasic.fullName || "");
  const [email, setEmail] = useState(initialBasic.email || "");
  const [phone, setPhone] = useState(initialBasic.phone || "");
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [countryCode, setCountryCode] = useState(initialBasic.countryCode || "");
  const [sessionTimeout, setSessionTimeout] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
    if (session?.user?.name) {
      setFullName(session.user.name);
    }
  }, [session, status]);

  // Add timeout for session loading
  useEffect(() => {
    if (status === "loading") {
      const timeout = setTimeout(() => {
        setSessionTimeout(true);
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeout);
    } else {
      setSessionTimeout(false);
    }
  }, [status]);

  // Autosave basic info (name only here) so Back/Next preserves data
  useEffect(() => {
    try {
      const payload = { fullName, email, countryCode, phone };
      localStorage.setItem("onboarding.basicInfo", JSON.stringify(payload));
    } catch {}
  }, [fullName, email, countryCode, phone]);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem("onboarding.basicInfo") : null;
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (typeof draft.fullName === 'string') setFullName(draft.fullName);
      if (typeof draft.email === 'string') setEmail(draft.email);
      if (typeof draft.countryCode === 'string') setCountryCode(draft.countryCode);
      if (typeof draft.phone === 'string') setPhone(draft.phone);
    } catch {}
  }, []);


  // Handle loading state
  if (status === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl md:text-4xl font-extrabold">Basic Information</h1>
        <div className="bg-blue-100 p-4 rounded-lg text-sm">
          <p><strong>Loading session...</strong></p>
          <p>Please wait while we load your information.</p>
          {sessionTimeout && (
            <div className="mt-2">
              <p className="text-red-600">Session loading is taking too long.</p>
              <Button 
                onClick={() => router.push("/auth/signin")} 
                className="mt-2"
                variant="outline"
              >
                Try Sign In Again
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl md:text-4xl font-extrabold">Basic Information</h1>
        <div className="bg-red-100 p-4 rounded-lg text-sm">
          <p><strong>Authentication Required</strong></p>
          <p>You need to be logged in to access this page.</p>
          <Button 
            onClick={() => router.push("/auth/signin")} 
            className="mt-2"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="relative">
              <Input 
                type="email" 
                value={email || session?.user?.email || ""} 
                readOnly 
                disabled 
                placeholder="Registered email" 
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </div>
              </div>
            </div>
          </div>
          {/* Removed duplicate email field */}
          <div className="space-y-1">
            <Label>Enter Phone number</Label>
            <div className="flex gap-2">
              <SearchableCountrySelect
                value={countryCode}
                onValueChange={setCountryCode}
                placeholder="Select country"
                className="w-44"
              />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
              <Button disabled={!phone || sending} onClick={async () => {
                setSending(true);
                console.log("🚀 Frontend: Starting WhatsApp OTP request...");
                console.log("📱 Phone number:", `${countryCode}${phone.replace(/[^0-9]/g, "")}`);
                
                try {
                  const phoneNumber = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;
                  console.log("📞 Sending request to /api/auth/wa with phone:", phoneNumber);
                  
                  const res = await fetch("/api/auth/wa", { 
                    method: "POST", 
                    headers: { "Content-Type": "application/json" }, 
                    body: JSON.stringify({ phoneNumber }) 
                  });
                  
                  console.log("📡 Response status:", res.status);
                  console.log("📡 Response ok:", res.ok);
                  
                  const data = await res.json();
                  console.log("📦 Response data:", data);
                  
                  const autoCode = (data && (data.demoCode || data.code)) ? String(data.demoCode || data.code) : "";
                  if (autoCode) {
                    setOtp(autoCode);
                  }

                  setOtpSent(true);

                  if (res.ok) {
                    console.log("✅ OTP request successful!");
                  } else {
                    console.error("❌ OTP request failed:", data?.error || "Failed to send OTP");
                  }
                } catch (e) {
                  console.error("💥 Frontend error:", e);
                  alert(`Network error: ${e}`);
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
                    const fullPhoneNumber = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;
                    const res = await fetch("/api/auth/wa/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber: fullPhoneNumber, verificationCode: otp }) });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      // Save verified WhatsApp number to database
                      try {
                        const saveRes = await fetch("/api/user/update-whatsapp", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            whatsappNumber: fullPhoneNumber,
                            whatsappVerified: true,
                          }),
                        });
                        if (saveRes.ok) {
                          console.log("WhatsApp number saved successfully");
                        } else {
                          console.error("Failed to save WhatsApp number");
                        }
                      } catch (saveError) {
                        console.error("Error saving WhatsApp number:", saveError);
                      }
                    } else {
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
            <Button className="min-w-28" onClick={async () => {
              try {
                // Best-effort server save of whatsapp/name
                await fetch('/api/user/save-onboarding', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fullName: fullName || undefined,
                    whatsappNumber: countryCode && phone ? `${countryCode}${phone.replace(/[^0-9]/g, "")}` : undefined,
                  }),
                }).catch(() => {});
              } catch {}
              router.push("/onboarding/freelancer/skills-and-roles");
            }}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


