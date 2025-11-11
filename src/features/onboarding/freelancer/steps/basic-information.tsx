"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { Textarea } from "@/ui/components/textarea";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SearchableCountrySelect } from "@/ui/components/searchable-country-select";
import { CountryCitySelect, countriesWithCities } from "@/ui/components/country-city-select";
import { toast } from "sonner";
import { fireAndForget } from "@/core/utils/fireAndForget";

export default function BasicInformationStep() {
  const router = useRouter();
  const { data: session, status } = useSession();
  // Initialize from localStorage immediately on first render
  const initialBasic = (() => {
    if (typeof window === 'undefined') return {} as any;
    try { return JSON.parse(localStorage.getItem('onboarding.basicInfo') || '{}'); } catch { return {}; }
  })() as { 
    fullName?: string; 
    email?: string; 
    countryCode?: string; 
    phone?: string;
    bio?: string;
    location?: string;
    age?: number;
    hourlyRateUsd?: number;
    experienceYears?: number;
  };
  const [fullName, setFullName] = useState(initialBasic.fullName || "");
  const [email, setEmail] = useState(initialBasic.email || "");
  const [phone, setPhone] = useState(initialBasic.phone || "");
  const [bio, setBio] = useState(initialBasic.bio || "");
  const [location, setLocation] = useState(initialBasic.location || "");
  const [locationCountry, setLocationCountry] = useState<string>("");
  const [locationCity, setLocationCity] = useState<string>("");
  const [age, setAge] = useState(initialBasic.age || "");
  const [hourlyRateUsd, setHourlyRateUsd] = useState(initialBasic.hourlyRateUsd || "");
  const [experienceYears, setExperienceYears] = useState(initialBasic.experienceYears || "");
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [countryCode, setCountryCode] = useState(initialBasic.countryCode || "");
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [hourlyRateError, setHourlyRateError] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  
  // Count characters in bio
  const countCharacters = (text: string): number => {
    return text.length;
  };
  
  const bioCharCount = countCharacters(bio);
  const minChars = 50; // Minimum characters required
  const maxChars = 100; // Maximum characters allowed

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
    if (session?.user?.name) {
      setFullName(session.user.name);
    }
  }, [session, status]);

  // Check WhatsApp verification status on mount and when phone changes
  useEffect(() => {
    const checkWhatsAppVerification = async () => {
      if (!countryCode || !phone || !session?.user?.id) {
        setWhatsappVerified(false);
        return;
      }

      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          const fullPhoneNumber = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;
          if (data?.whatsappNumber === fullPhoneNumber && data?.whatsappVerified) {
            setWhatsappVerified(true);
            setWhatsappError(null);
            setPhoneError(null);
          } else {
            setWhatsappVerified(false);
          }
        }
      } catch (error) {
        // Silent fail, just assume not verified
        setWhatsappVerified(false);
      }
    };

    checkWhatsAppVerification();
  }, [countryCode, phone, session]);

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

  // Parse existing location if it's in the old format (only on initial load)
  useEffect(() => {
    if (location && !locationCountry && !locationCity && typeof window !== 'undefined') {
      // Try to parse existing location format (e.g., "San Francisco, CA, United States")
      // This is a simple parser - may need refinement
      const parts = location.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        // Try to find country from the last part
        const countryName = parts[parts.length - 1];
        const countryData = countriesWithCities.find(
          (c) => c.name.toLowerCase() === countryName.toLowerCase()
        );
        if (countryData) {
          setLocationCountry(countryData.code);
          // Try to match city
          const cityPart = parts.slice(0, -1).join(", ");
          const cityMatch = countryData.cities.find((c) =>
            c.toLowerCase().includes(cityPart.toLowerCase())
          );
          if (cityMatch) {
            setLocationCity(cityMatch);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update location string when country/city changes
  useEffect(() => {
    if (locationCountry && locationCity) {
      const countryData = countriesWithCities.find((c) => c.code === locationCountry);
      if (countryData) {
        const newLocation = `${locationCity}, ${countryData.name}`;
        setLocation(newLocation);
      }
    } else if (!locationCountry && !locationCity) {
      // Clear location if both are cleared
      setLocation("");
    }
  }, [locationCountry, locationCity]);

  // Autosave basic info so Back/Next preserves data
  useEffect(() => {
    try {
      const payload = { 
        fullName, 
        email, 
        countryCode, 
        phone,
        bio,
        location,
        age,
        hourlyRateUsd,
        experienceYears
      };
      localStorage.setItem("onboarding.basicInfo", JSON.stringify(payload));
    } catch {}
  }, [fullName, email, countryCode, phone, bio, location, age, hourlyRateUsd, experienceYears]);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem("onboarding.basicInfo") : null;
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (typeof draft.fullName === 'string') setFullName(draft.fullName);
      if (typeof draft.email === 'string') setEmail(draft.email);
      if (typeof draft.countryCode === 'string') setCountryCode(draft.countryCode);
      if (typeof draft.phone === 'string') setPhone(draft.phone);
      if (typeof draft.bio === 'string') setBio(draft.bio);
      if (typeof draft.location === 'string') setLocation(draft.location);
      if (typeof draft.age === 'number') setAge(draft.age);
      if (typeof draft.hourlyRateUsd === 'number') setHourlyRateUsd(draft.hourlyRateUsd);
      if (typeof draft.experienceYears === 'number') setExperienceYears(draft.experienceYears);
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
            <Label>Enter Full Name <span className="text-red-500">*</span></Label>
            <Input 
              value={fullName} 
              onChange={(e) => {
                setFullName(e.target.value);
                setFullNameError(null);
              }} 
              placeholder="Enter Full Name"
              className={fullNameError ? "border-red-500" : ""}
            />
            {fullNameError && (
              <p className="text-sm text-red-600 mt-1">{fullNameError}</p>
            )}
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
            <Label>Verify WhatsApp Number <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <SearchableCountrySelect
                value={countryCode}
                onValueChange={(value) => {
                  setCountryCode(value);
                  setWhatsappVerified(false);
                  setPhoneError(null);
                  setWhatsappError(null);
                }}
                placeholder="Select country"
                className="w-44"
              />
              <Input 
                value={phone} 
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError(null); // Clear error when user types
                  setWhatsappError(null);
                  setOtpSent(false); // Reset OTP sent state when phone changes
                  setOtp(""); // Clear OTP when phone changes
                  setWhatsappVerified(false); // Reset verification when phone changes
                }} 
                placeholder="Phone number"
                className={(phoneError || whatsappError) ? "border-red-500" : ""}
              />
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
                  
                  if (res.ok) {
                    console.log("✅ OTP request successful!");
                    setPhoneError(null);
                    setWhatsappError(null);
                    
                    // Only set OTP sent and auto-fill code when request is successful
                    const autoCode = (data && (data.demoCode || data.code)) ? String(data.demoCode || data.code) : "";
                    if (autoCode) {
                      setOtp(autoCode);
                    }
                    setOtpSent(true);
                    toast.success("Verification code sent successfully!");
                  } else {
                    const errorMessage = data?.error || "Failed to send OTP";
                    console.error("❌ OTP request failed:", errorMessage);
                    setPhoneError(errorMessage);
                    // Check if it's a duplicate phone number error (409 status)
                    if (res.status === 409) {
                      setWhatsappError("This phone number is already verified and associated with another account. Please use a different phone number.");
                    }
                    setOtpSent(false); // Don't show OTP input if there's an error
                    setOtp(""); // Clear any existing OTP
                    toast.error(errorMessage);
                  }
                } catch (e) {
                  console.error("💥 Frontend error:", e);
                  const errorMessage = e instanceof Error ? e.message : "Network error occurred";
                  setPhoneError(errorMessage);
                  setWhatsappError(errorMessage);
                  setOtpSent(false); // Don't show OTP input if there's an error
                  setOtp(""); // Clear any existing OTP
                  toast.error(errorMessage);
                } finally {
                  setSending(false);
                }
              }}>Verify via WhatsApp</Button>
            </div>
            {phoneError && (
              <p className="text-sm text-red-600 mt-1">{phoneError}</p>
            )}
            {whatsappError && !phoneError && (
              <p className="text-sm text-red-600 mt-1">{whatsappError}</p>
            )}
            {whatsappVerified && !phoneError && !whatsappError && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                WhatsApp number verified successfully
              </p>
            )}
            {otpSent && !phoneError && (
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
                        const saveData = await saveRes.json();
                        if (saveRes.ok) {
                          console.log("WhatsApp number saved successfully");
                          setPhoneError(null);
                          setWhatsappError(null);
                          setWhatsappVerified(true);
                          toast.success("Phone number verified successfully!");
                        } else {
                          const errorMessage = saveData?.error || "Failed to save WhatsApp number";
                          console.error("Failed to save WhatsApp number:", errorMessage);
                          setPhoneError(errorMessage);
                          setWhatsappError(errorMessage);
                          setWhatsappVerified(false);
                          // Check if it's a duplicate phone number error (409 status)
                          if (saveRes.status === 409) {
                            setWhatsappError("This phone number is already verified and associated with another account. Please use a different phone number.");
                          }
                          toast.error(errorMessage);
                        }
                      } catch (saveError) {
                        console.error("Error saving WhatsApp number:", saveError);
                        const errorMessage = saveError instanceof Error ? saveError.message : "Error saving phone number";
                        setPhoneError(errorMessage);
                        toast.error(errorMessage);
                      }
                    } else {
                      const errorMessage = data?.error || "Invalid verification code";
                      console.error(errorMessage);
                      setPhoneError(errorMessage);
                      // Check if it's a duplicate phone number error (409 status)
                      if (res.status === 409) {
                        setWhatsappError("This phone number is already verified and associated with another account. Please use a different phone number.");
                      }
                      toast.error(errorMessage);
                    }
                  } catch (e) {
                    console.error(e);
                    const errorMessage = e instanceof Error ? e.message : "An error occurred";
                    setPhoneError(errorMessage);
                    toast.error(errorMessage);
                  } finally {
                    setVerifying(false);
                  }
                }}>Confirm</Button>
              </div>
            )}
          </div>

          {/* Bio Section */}
          <div className="space-y-1">
            <Label>Bio / About Me</Label>
            <Textarea 
              value={bio} 
              onChange={(e) => {
                setBio(e.target.value);
                // Clear error when user types
                if (bioError) setBioError(null);
              }} 
              placeholder="Tell us about yourself, your experience, and what makes you unique..."
              rows={6}
              className={`resize-none ${bioError ? "border-red-500" : ""}`}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Write at least {minChars} characters about yourself to create a strong first impression.
              </p>
              <p className={`text-xs ${
                (bioCharCount < minChars || bioCharCount > maxChars) 
                  ? "text-red-500" 
                  : "text-gray-500"
              }`}>
                {bioCharCount}/{maxChars} characters
              </p>
            </div>
            {bioError && (
              <p className="text-sm text-red-600 mt-1">{bioError}</p>
            )}
            {!bioError && bioCharCount > maxChars && (
              <p className="text-sm text-red-600 mt-1">
                Bio cannot exceed {maxChars} characters. Please reduce it by {bioCharCount - maxChars} character{(bioCharCount - maxChars) !== 1 ? "s" : ""}.
              </p>
            )}
          </div>

          {/* Location and Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Location <span className="text-red-500">*</span></Label>
              <CountryCitySelect
                country={locationCountry}
                city={locationCity}
                onCountryChange={(value) => {
                  setLocationCountry(value);
                  setLocationError(null);
                }}
                onCityChange={(value) => {
                  setLocationCity(value);
                  setLocationError(null);
                }}
              />
              {locationError && (
                <p className="text-sm text-red-600 mt-1">{locationError}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Age</Label>
              <Input 
                type="number"
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
                placeholder="Please enter your age" 
                min="18"
                max="100"
              />
            </div>
          </div>

          {/* Experience and Hourly Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Years of Experience <span className="text-red-500">*</span></Label>
              <Input 
                type="number"
                value={experienceYears} 
                onChange={(e) => {
                  setExperienceYears(e.target.value);
                  setExperienceError(null);
                }} 
                placeholder="Please enter your years of experience" 
                min="0"
                max="50"
                className={experienceError ? "border-red-500" : ""}
              />
              {experienceError && (
                <p className="text-sm text-red-600 mt-1">{experienceError}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Hourly Rate (USD) <span className="text-red-500">*</span></Label>
              <Input 
                type="number"
                value={hourlyRateUsd} 
                onChange={(e) => {
                  setHourlyRateUsd(e.target.value);
                  setHourlyRateError(null);
                }} 
                placeholder="Please enter your hourly rate" 
                min="5"
                max="1000"
                className={hourlyRateError ? "border-red-500" : ""}
              />
              <p className="text-xs text-gray-500">Your preferred hourly rate in USD</p>
              {hourlyRateError && (
                <p className="text-sm text-red-600 mt-1">{hourlyRateError}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button 
              className="min-w-28" 
              onClick={async () => {
                let hasErrors = false;

                // Validate full name
                if (!fullName || fullName.trim().length === 0) {
                  setFullNameError("Full name is required");
                  hasErrors = true;
                } else {
                  setFullNameError(null);
                }

                // Validate WhatsApp verification (temporarily disabled for testing)
                // if (!countryCode || !phone) {
                //   setWhatsappError("Please enter your phone number");
                //   hasErrors = true;
                // } else if (!whatsappVerified) {
                //   setWhatsappError("Please verify your WhatsApp number before proceeding");
                //   hasErrors = true;
                // } else {
                //   setWhatsappError(null);
                // }
                
                // Temporary: Allow proceeding without WhatsApp verification for testing
                // Only validate if phone is provided
                if (countryCode && phone && !whatsappVerified) {
                  // Show warning but don't block
                  console.log("WhatsApp not verified, but allowing to proceed for testing");
                }
                setWhatsappError(null);

                // Validate location
                if (!locationCountry || !locationCity) {
                  setLocationError("Please select both country and city");
                  hasErrors = true;
                } else {
                  setLocationError(null);
                }

                // Validate years of experience
                if (!experienceYears || experienceYears.toString().trim() === "") {
                  setExperienceError("Years of experience is required");
                  hasErrors = true;
                } else {
                  const expYears = parseInt(experienceYears.toString());
                  if (isNaN(expYears) || expYears < 0 || expYears > 50) {
                    setExperienceError("Please enter a valid number between 0 and 50");
                    hasErrors = true;
                  } else {
                    setExperienceError(null);
                  }
                }

                // Validate hourly rate
                if (!hourlyRateUsd || hourlyRateUsd.toString().trim() === "") {
                  setHourlyRateError("Hourly rate is required");
                  hasErrors = true;
                } else {
                  const rate = parseInt(hourlyRateUsd.toString());
                  if (isNaN(rate) || rate < 5 || rate > 1000) {
                    setHourlyRateError("Please enter a valid hourly rate between $5 and $1000");
                    hasErrors = true;
                  } else {
                    setHourlyRateError(null);
                  }
                }

                // Validate bio character count
                if (bioCharCount < minChars) {
                  setBioError(`Bio must contain at least ${minChars} characters. Currently you have ${bioCharCount} character${bioCharCount !== 1 ? "s" : ""}.`);
                  toast.error(`Bio must contain at least ${minChars} characters`);
                  hasErrors = true;
                } else if (bioCharCount > maxChars) {
                  setBioError(`Bio cannot exceed ${maxChars} characters. Currently you have ${bioCharCount} characters.`);
                  toast.error(`Bio cannot exceed ${maxChars} characters`);
                  hasErrors = true;
                } else {
                  setBioError(null);
                }

                // If there are validation errors, stop here
                if (hasErrors) {
                  toast.error("Please fix all required fields before proceeding");
                  return;
                }
                
                // Save to localStorage first for immediate persistence
                try {
                  const payload = {
                    fullName: fullName || undefined,
                    whatsappNumber: countryCode && phone ? `${countryCode}${phone.replace(/[^0-9]/g, "")}` : undefined,
                    bio: bio || undefined,
                    location: location || undefined,
                    age: age ? parseInt(age.toString()) : undefined,
                    hourlyRateUsd: hourlyRateUsd ? parseInt(hourlyRateUsd.toString()) : undefined,
                    experienceYears: experienceYears ? parseInt(experienceYears.toString()) : undefined,
                  };
                  localStorage.setItem("onboarding.basicInfo", JSON.stringify(payload));
                } catch {}
                
                // Fire-and-forget server save (don't wait for response)
                fireAndForget('/api/user/save-onboarding', {
                  fullName: fullName || undefined,
                  whatsappNumber: countryCode && phone ? `${countryCode}${phone.replace(/[^0-9]/g, "")}` : undefined,
                  bio: bio || undefined,
                  location: location || undefined,
                  age: age ? parseInt(age.toString()) : undefined,
                  hourlyRateUsd: hourlyRateUsd ? parseInt(hourlyRateUsd.toString()) : undefined,
                  experienceYears: experienceYears ? parseInt(experienceYears.toString()) : undefined,
                });
                
                // Navigate immediately
                router.push("/onboarding/freelancer/skills-and-roles");
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


