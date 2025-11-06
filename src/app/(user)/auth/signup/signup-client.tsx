"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";

import { ErrorDisplay, FieldError } from "@/ui/components/error-display";
import { Mail, Eye, EyeOff, HelpCircle } from "lucide-react";
import { Checkbox } from "@/ui/components/checkbox";
import { Label } from "@/ui/components/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { useFormSubmit } from "@/core/hooks/use-api";
import VerifyOTP from "@/features/auth/components/verify-otp";
import { cn } from "@/core/utils/utils";

// Use the same email validation rule as async availability check
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

const signUpSchema = z.object({
  email: z
    .string()
    .regex(EMAIL_REGEX, "Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpClient() {
  const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "signup" | "verify-otp" | "google-password"
  >("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPassword, setUserPassword] = useState<string>("");
  const [googleEmail, setGoogleEmail] = useState<string>("");
  const [googlePassword, setGooglePassword] = useState<string>("");
  const [confirmGooglePassword, setConfirmGooglePassword] = useState<string>("");
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [showConfirmGooglePassword, setShowConfirmGooglePassword] = useState(false);
  const [isAddingPassword, setIsAddingPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true); // Default checked
  const [openTermsModal, setOpenTermsModal] = useState<string | null>(null); // 'terms' | 'user-agreement' | 'privacy-policy'
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showTermsValidation, setShowTermsValidation] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckCompleted, setEmailCheckCompleted] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);

  const router = useRouter();

  // Debounced email check function
  const lastCheckedEmailRef = useRef<string>("");
  const checkedResultsRef = useRef<Map<string, { available: boolean; exists: boolean }>>(new Map());
  const activeEmailCheckControllerRef = useRef<AbortController | null>(null);

  // Stricter email format validator (require TLD letters, min length 2)
  const isValidEmailFormat = (email: string) => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email);

  const checkEmailExists = async (email: string) => {
    if (!email || !isValidEmailFormat(email)) {
      setEmailExistsError(false);
      setEmailCheckCompleted(false);
      setEmailAvailable(false);
      return;
    }

    // Normalize email (lowercase) for comparison
    const normalizedEmail = email.toLowerCase().trim();
    
    // If this email has already been checked, reuse cached result
    const cached = checkedResultsRef.current.get(normalizedEmail);
    if (cached) {
      console.log("✅ Using cached email check:", normalizedEmail, cached);
      setEmailExistsError(cached.exists);
      setEmailAvailable(cached.available);
      setEmailCheckCompleted(true);
      setIsCheckingEmail(false);
      return;
    }

    setIsCheckingEmail(true);
    setEmailCheckCompleted(false);
    setEmailAvailable(false);
    setEmailExistsError(false);
    lastCheckedEmailRef.current = normalizedEmail;
    
    try {
      console.log("🔍 Checking email:", normalizedEmail);
      
      // Create AbortController for timeout (8 seconds)
      const controller = new AbortController();
      activeEmailCheckControllerRef.current = controller;
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 8000);
      
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (activeEmailCheckControllerRef.current === controller) {
        activeEmailCheckControllerRef.current = null;
      }

      // Guard against race conditions: only apply if this is the latest requested email
      if (lastCheckedEmailRef.current !== normalizedEmail) {
        console.log("⏭️ Skipping outdated email check result");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Email check response:", data);
        const exists = Boolean(data?.exists);
        setEmailExistsError(exists);
        setEmailAvailable(exists === false);
        setEmailCheckCompleted(true);
        setIsCheckingEmail(false);
        // Cache the result
        checkedResultsRef.current.set(normalizedEmail, { available: !exists, exists });
      } else {
        // Handle non-ok responses
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ Email check failed:", response.status, errorData);
        setEmailExistsError(false);
        setEmailAvailable(false);
        setEmailCheckCompleted(false);
        setIsCheckingEmail(false);
      }
    } catch (error: any) {
      console.error("💥 Error checking email:", error);
      // Only update state if this is still the latest email check
      if (lastCheckedEmailRef.current === normalizedEmail) {
        if (error.name === 'AbortError') {
          console.error("⏱️ Request timeout after 8 seconds");
        }
        setEmailExistsError(false);
        setEmailAvailable(false);
        setEmailCheckCompleted(false);
        setIsCheckingEmail(false);
      }
      if (activeEmailCheckControllerRef.current) {
        activeEmailCheckControllerRef.current = null;
      }
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout>();

  // Track previous email to detect changes
  const previousEmailRef = useRef<string>("");

  // Clear errors when user starts typing (only when email value changes)
  useEffect(() => {
    if (emailValue && errors.email) {
      clearErrors("email");
    }
    
    // Only reset states if email actually changed
    const normalizedEmail = emailValue ? emailValue.toLowerCase().trim() : "";
    if (normalizedEmail !== previousEmailRef.current) {
      const oldEmail = previousEmailRef.current;
      previousEmailRef.current = normalizedEmail;
      
      // Check if new email has cached result
      const cached = normalizedEmail ? checkedResultsRef.current.get(normalizedEmail) : null;
      
      if (cached) {
        // Email has cached result, apply immediately
        console.log("✅ Email changed to cached email, applying immediately:", normalizedEmail, cached);
        setEmailExistsError(cached.exists);
        setEmailAvailable(cached.available);
        setEmailCheckCompleted(true);
        setIsCheckingEmail(false);
      } else {
        // Email changed to new email without cache, reset states
        setEmailExistsError(false);
        setEmailAvailable(false);
        setEmailCheckCompleted(false);
        setIsCheckingEmail(false);
      }
    }

    // If email becomes empty or invalid, abort any in-flight request and stop spinner
    const isValid = normalizedEmail && isValidEmailFormat(normalizedEmail);
    if (!isValid) {
      if (activeEmailCheckControllerRef.current) {
        try { activeEmailCheckControllerRef.current.abort(); } catch {}
        activeEmailCheckControllerRef.current = null;
      }
      setIsCheckingEmail(false);
      setEmailCheckCompleted(false);
      setEmailAvailable(false);
      setEmailExistsError(false);
    }
  }, [emailValue, errors.email, clearErrors]);

  useEffect(() => {
    if (passwordValue && errors.password) {
      clearErrors("password");
    }
  }, [passwordValue, errors.password, clearErrors]);

  // Debounced email check - only depends on emailValue to avoid re-checking when password changes
  useEffect(() => {
    // Clear any pending timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
      emailCheckTimeoutRef.current = undefined;
    }

    // Validate email format before checking
    const normalizedEmail = emailValue ? emailValue.toLowerCase().trim() : "";
    const isValidEmail = normalizedEmail && isValidEmailFormat(normalizedEmail);

    if (isValidEmail) {
      // If cached, use immediately; otherwise, schedule check
      const cached = checkedResultsRef.current.get(normalizedEmail);
      if (cached) {
        console.log("✅ Email already checked, using cached result:", normalizedEmail, cached);
        setEmailExistsError(cached.exists);
        setEmailAvailable(cached.available);
        setEmailCheckCompleted(true);
        setIsCheckingEmail(false);
      } else {
        console.log("⏳ Scheduling email check for:", normalizedEmail);
        emailCheckTimeoutRef.current = setTimeout(() => {
          console.log("⏰ Executing email check for:", normalizedEmail);
          checkEmailExists(normalizedEmail);
        }, 300); // Faster debounce to handle rapid typing
      }
    } else {
      // Reset states if email is invalid or empty
      if (!normalizedEmail) {
        setEmailExistsError(false);
        setEmailCheckCompleted(false);
        setEmailAvailable(false);
        setIsCheckingEmail(false);
      }
    }

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
        emailCheckTimeoutRef.current = undefined;
      }
    };
  }, [emailValue]); // Only depend on emailValue, not errors.email

  // Derived flag that mirrors UI rules without relying on RHF's isValid timing
  const canSubmitBasic = (() => {
    const normalizedEmail = emailValue ? emailValue.toLowerCase().trim() : "";
    const emailOk = EMAIL_REGEX.test(normalizedEmail);
    const passwordOk = (passwordValue?.length ?? 0) >= 8;
    return emailOk && passwordOk;
  })();

  const {
    submit,
    error: formError,
    isLoading: formSubmitLoading,
    reset,
  } = useFormSubmit({
    onSuccess: async (data: any) => {
      setServerError(null); // Clear any existing errors
      setSuccessMessage(
        "Signup successful! Redirecting to role selection..."
      );

      console.log("🎉 Signup successful, showing success message...");

      // Check if user has saved form data (from any session)
      const savedFormData = sessionStorage.getItem("guestProjectForm");
      const pendingRole = localStorage.getItem("pendingRole");
      
      // If user has saved form data or pendingRole is CLIENT, they want to be a client
      if (savedFormData || pendingRole === "CLIENT") {
        localStorage.setItem("pendingRole", "CLIENT");
      }

      // Wait for message to show before redirecting
      setTimeout(() => {
        console.log("🔄 Redirecting after success message delay...");
        // Always redirect to role-selection first (user will choose role, then redirect to /pricing if CLIENT)
        console.log("🔄 Redirecting to /role-selection");
        window.location.href = "/role-selection";
      }, 2000); // Wait 2 seconds for message to show
    },
    onError: (error) => {
      console.error("Sign up error:", error);
      setServerError(error);
    },
  });

  const handleEmailSignUp = async (formData: SignUpFormData) => {
    setServerError(null); // Reset error state
    setSuccessMessage(null); // Reset success message

    // Check if user agreed to terms
    if (!agreeToTerms) {
      setShowTermsValidation(true);
      toast.error("Please agree to the Terms of Service to continue");
      return;
    }

    // Validate email and password
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsEmailLoading(true);

    try {
      // Store email and password for verification flow
      setUserEmail(formData.email);
      setUserPassword(formData.password);

      // First, check if email already exists
      try {
        const checkEmailResponse = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });

        if (checkEmailResponse.ok) {
          const emailData = await checkEmailResponse.json();
          if (emailData.exists) {
            setEmailExistsError(true);
            toast.error("This email is already registered. Please use a different email or try signing in.");
            return; // Stop here - don't proceed to OTP
          }
        }
      } catch (emailCheckError) {
        console.error("Error checking email:", emailCheckError);
        toast.error("Unable to verify email. Please try again.");
        return; // Stop here if email check fails
      }

      // Clear email exists error if we get here
      setEmailExistsError(false);

      // If email doesn't exist, send OTP and go to verify-otp step
      try {
        const response = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: formData.email,
            type: "signup"
          }),
        });

        if (response.ok) {
          // Go directly to OTP verification step
          setCurrentStep("verify-otp");
          toast.success("Verification code sent to your email!");
        } else {
          // For testing flow, go to OTP page even if send fails
          setCurrentStep("verify-otp");
          
          // Try to parse error message safely
          try {
            const errorData = await response.json();
            toast.error(errorData.message || "Failed to send verification code, but you can still proceed to test");
          } catch (parseError) {
            toast.error("Failed to send verification code, but you can still proceed to test");
          }
        }
      } catch (fetchError) {
        // For testing flow, go to OTP page even if API call fails
        setCurrentStep("verify-otp");
        toast.error("Network error, but you can still proceed to test the flow");
      }
    } catch (error) {
      console.error("Error in handleEmailSignUp:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsEmailLoading(false);
    }
  };


  const handleEmailVerified = async () => {
    // Now create the account after email verification
    const formData = {
      email: userEmail,
      password: userPassword,
      name: userEmail.split("@")[0], // Use email prefix as name
    };
    await submit("/api/auth/signup", formData);
  };

  const handleBackToSignup = () => {
    setCurrentStep("signup");
    setUserEmail("");
    setUserPassword("");
    setAgreeToTerms(false);
    setEmailNotifications(true);
  };

  // Check if user just signed up with Google and needs to set password
  useEffect(() => {
    const checkGoogleSignup = async () => {
      if (session?.user?.email && currentStep === "signup") {
        try {
          const res = await fetch("/api/user/me", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            // If user exists but doesn't have password, show password form
            if (data.user && !data.user.hasPassword) {
              setGoogleEmail(session.user.email || "");
              setCurrentStep("google-password");
            }
          }
        } catch (error) {
          console.error("Error checking user:", error);
        }
      }
    };

    checkGoogleSignup();
  }, [session, currentStep]);

  const handleGoogleSignUp = async () => {
    setServerError(null); // Reset error state
    setSuccessMessage(null); // Reset success message
    setIsGoogleLoading(true);

    try {
      // Check if user has saved form data (from any session)
      const savedFormData = sessionStorage.getItem("guestProjectForm");
      if (savedFormData) {
        // Store pending role as CLIENT since they want to post projects
        localStorage.setItem("pendingRole", "CLIENT");
      }

      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/auth/signup",
      });

      if (result?.error) {
        if (result.error === "AccessDenied") {
          setServerError(
            "Google sign up was denied. Please try again."
          );
        } else {
          setServerError("Google sign up failed. Please try again.");
        }
        return;
      }

      if (result?.ok) {
        console.log("🎉 Google signup successful, waiting for session...");
        // Session will be updated, useEffect will handle showing password form
      }
    } catch (error) {
      console.error("Google sign up error:", error);
      setServerError("An error occurred during Google sign up");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGooglePasswordSubmit = async () => {
    // Validate password
    if (!googlePassword) {
      toast.error("Please enter a password");
      return;
    }

    if (googlePassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (googlePassword !== confirmGooglePassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Check if user agreed to terms
    if (!agreeToTerms) {
      setShowTermsValidation(true);
      toast.error("Please agree to the Terms of Service to continue");
      return;
    }

    setIsAddingPassword(true);
    try {
      const response = await fetch("/api/user/add-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: googlePassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password added successfully!");
        setSuccessMessage("Sign up successful! Redirecting...");
        
        // Check if user has saved form data (from any session)
        const savedFormData = sessionStorage.getItem("guestProjectForm");
        const pendingRole = localStorage.getItem("pendingRole");
        
        // If user has saved form data or pendingRole is CLIENT, they want to be a client
        if (savedFormData || pendingRole === "CLIENT") {
          localStorage.setItem("pendingRole", "CLIENT");
        }
        
        // Redirect after success - always go to role-selection first
        setTimeout(() => {
          console.log("🔄 Redirecting to /role-selection after Google password setup");
          window.location.href = "/role-selection";
        }, 1500);
      } else {
        toast.error(data.error || "Failed to add password");
      }
    } catch (error) {
      console.error("Error adding password:", error);
      toast.error("An error occurred while adding password");
    } finally {
      setIsAddingPassword(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Terms Modals */}
      <Dialog open={openTermsModal === "terms"} onOpenChange={(open) => !open && setOpenTermsModal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
            <DialogDescription>
              Last updated: {new Date().toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p className="mb-3">
                By accessing and using Clevrs, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Description of Service</h3>
              <p className="mb-3">
                Clevrs is a platform that connects clients with freelance developers. We provide a marketplace for project posting, talent discovery, and collaboration tools.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. User Accounts</h3>
              <p className="mb-3">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. User Conduct</h3>
              <p className="mb-3">
                Users agree not to use the service to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any malicious code or viruses</li>
                <li>Interfere with the operation of the service</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Payment and Fees</h3>
              <p className="mb-3">
                Payment terms will be agreed upon between clients and freelancers. Clevrs may charge service fees as outlined in our pricing documentation.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Intellectual Property</h3>
              <p className="mb-3">
                All content and materials available on Clevrs, including but not limited to text, graphics, logos, and software, are the property of Clevrs or its content suppliers.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Limitation of Liability</h3>
              <p className="mb-3">
                Clevrs shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Termination</h3>
              <p className="mb-3">
                We reserve the right to terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Changes to Terms</h3>
              <p className="mb-3">
                We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Contact Information</h3>
              <p className="mb-3">
                If you have any questions about these Terms of Service, please contact us at support@clevrs.com.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openTermsModal === "user-agreement"} onOpenChange={(open) => !open && setOpenTermsModal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Agreement</DialogTitle>
            <DialogDescription>
              Last updated: {new Date().toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Agreement to Terms</h3>
              <p className="mb-3">
                This User Agreement constitutes a legally binding agreement between you and Clevrs. By creating an account or using our services, you agree to be bound by this agreement.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Eligibility</h3>
              <p className="mb-3">
                You must be at least 18 years old to use Clevrs. By using our service, you represent and warrant that you meet this age requirement.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Account Registration</h3>
              <p className="mb-3">
                To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Account Security</h3>
              <p className="mb-3">
                You are responsible for safeguarding your account credentials. You agree not to share your password with third parties and to notify us immediately of any unauthorized use.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. User Responsibilities</h3>
              <p className="mb-3">As a user, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use the platform in a professional manner</li>
                <li>Respect the rights of other users</li>
                <li>Provide accurate information in your profile and projects</li>
                <li>Honor commitments made through the platform</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Platform Usage</h3>
              <p className="mb-3">
                Clevrs provides a platform for connecting clients and freelancers. We are not a party to any agreements between users, and we do not guarantee the quality, safety, or legality of services provided through our platform.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Prohibited Activities</h3>
              <p className="mb-3">You may not:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Circumvent payment systems or attempt to work outside the platform</li>
                <li>Post false or misleading information</li>
                <li>Spam or harass other users</li>
                <li>Use automated systems to access the platform</li>
                <li>Violate any intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Dispute Resolution</h3>
              <p className="mb-3">
                In the event of disputes between users, we encourage parties to resolve issues directly. Clevrs may, at its discretion, assist in dispute resolution but is not obligated to do so.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Modification of Agreement</h3>
              <p className="mb-3">
                We reserve the right to modify this User Agreement at any time. Your continued use of the service after changes constitutes acceptance of the modified agreement.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openTermsModal === "privacy-policy"} onOpenChange={(open) => !open && setOpenTermsModal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
            <DialogDescription>
              Last updated: {new Date().toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
              <p className="mb-3">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Name, email address, and contact information</li>
                <li>Profile information and professional background</li>
                <li>Payment and billing information</li>
                <li>Messages and communications through our platform</li>
                <li>Project details and proposals</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. How We Use Your Information</h3>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Communicate with you about products and services</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Information Sharing</h3>
              <p className="mb-3">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>With other users when necessary to facilitate connections</li>
                <li>With service providers who assist us in operating our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Data Security</h3>
              <p className="mb-3">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Your Rights</h3>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access and update your personal information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of certain communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Cookies and Tracking</h3>
              <p className="mb-3">
                We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Third-Party Services</h3>
              <p className="mb-3">
                Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Children's Privacy</h3>
              <p className="mb-3">
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Changes to Privacy Policy</h3>
              <p className="mb-3">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Contact Us</h3>
              <p className="mb-3">
                If you have any questions about this Privacy Policy, please contact us at privacy@clevrs.com.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Centered form */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col max-w-md mx-auto justify-center py-16">
          <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                {currentStep === "signup"
                  ? "Create account"
                  : currentStep === "google-password"
                    ? "Set up password"
                    : "Enter verification code"}
              </h1>
              <p className="text-sm text-gray-600">
                {currentStep === "signup"
                  ? "Join the Clevrs community today. Create your free account to get started."
                  : currentStep === "google-password"
                    ? `Welcome ${googleEmail}! Please create a password to complete your registration.`
                    : "Enter the 6-digit code we sent to your email"}
              </p>
            </div>
          </div>

          {/* Server Error Display */}
          {serverError && (
            <div className="mb-4">
              <ErrorDisplay
                error={serverError}
                onDismiss={() => setServerError(null)}
              />
              {serverError.includes("has not been registered") && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    You need to register an account before signing in
                  </p>
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Go to Sign In →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Success Message Display */}
          {successMessage && (
            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      {successMessage}
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                        onClick={() => setSuccessMessage(null)}
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Form Error Display */}
          {formError && (
            <div className="mb-4">
              <ErrorDisplay error={formError} onDismiss={() => reset()} />
            </div>
          )}

          {/* Conditional rendering based on current step */}
          {currentStep === "signup" && (
            <>
              {/* Email + Password Form */}
              <TooltipProvider>
                <form
                  onSubmit={handleSubmit(handleEmailSignUp)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            tabIndex={-1}
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                            aria-label="Email help"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs bg-gray-900 text-white p-3">
                          <p className="text-sm">
                            Enter a valid email address you have access to. 
                            <br />
                            <span className="text-gray-300">Example: yourname@email.com</span>
                            <br />
                            <span className="text-gray-300 mt-1 block">We'll send a verification code to this email.</span>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="yourname@email.com"
                      autoFocus
                      autoComplete="email"
                      tabIndex={1}
                      {...register("email")}
                      onBlur={() => {
                        const normalizedEmail = emailValue ? emailValue.toLowerCase().trim() : "";
                        if (EMAIL_REGEX.test(normalizedEmail) && !isCheckingEmail) {
                          checkEmailExists(normalizedEmail);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !errors.email && !errors.password && isValid && agreeToTerms) {
                          e.preventDefault();
                          handleSubmit(handleEmailSignUp)();
                        }
                      }}
                      className={cn("h-12 transition-all hover:border-gray-400", (errors.email || emailExistsError) ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-black focus:ring-black/20")}
                    />
                    <FieldError error={errors.email?.message} />
                    {(
                      isCheckingEmail ||
                      (emailValue && EMAIL_REGEX.test(emailValue) && !emailCheckCompleted)
                    ) && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Checking email...
                      </p>
                    )}
                    {emailExistsError && !isCheckingEmail && (
                      <p className="text-sm text-red-600 mt-1">
                        This email is already registered. Please use a different email or try signing in.
                      </p>
                    )}
                    {emailAvailable && emailCheckCompleted && !isCheckingEmail && emailValue && !errors.email && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-2">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Email is available
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                            aria-label="Password help"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs bg-gray-900 text-white p-3">
                          <p className="text-sm">
                            Create a strong password with at least 8 characters.
                            <br />
                           
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password (min. 8 characters)"
                        autoComplete="new-password"
                        tabIndex={2}
                        {...register("password")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !errors.email && !errors.password && isValid && agreeToTerms) {
                            e.preventDefault();
                            handleSubmit(handleEmailSignUp)();
                          }
                        }}
                        className={cn(
                          "h-12 pr-12 transition-all hover:border-gray-400",
                          errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-black focus:ring-black/20"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <FieldError error={errors.password?.message} />
                    {!errors.password && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span>Password must be at least 8 characters long</span>
                      </p>
                    )}
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-4 pt-2">
                    {/* Email Notifications Checkbox */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="email-notifications"
                        checked={emailNotifications}
                        onCheckedChange={(checked) => setEmailNotifications(checked ?? true)}
                        tabIndex={-1}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="email-notifications"
                        className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                      >
                        Send me helpful emails to find rewarding work and job leads.
                      </Label>
                    </div>

                    {/* Terms of Service Checkbox */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms-agreement"
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => {
                          setAgreeToTerms(checked ?? false);
                          if (checked) setShowTermsValidation(false);
                        }}
                        tabIndex={3}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="terms-agreement"
                        className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                      >
                        Yes, I understand and agree to the{" "}
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-700 underline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenTermsModal("terms");
                          }}
                        >
                          Terms of Service
                        </button>
                        , including the{" "}
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-700 underline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenTermsModal("user-agreement");
                          }}
                        >
                          User Agreement
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-700 underline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenTermsModal("privacy-policy");
                          }}
                        >
                          Privacy Policy
                        </button>
                        .
                      </Label>
                    </div>
                    {showTermsValidation && !agreeToTerms && (
                      <p className="text-sm text-red-600 ml-7 -mt-2">
                        You must agree to the Terms of Service to continue
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      isEmailLoading ||
                      isGoogleLoading ||
                      emailExistsError ||
                      isCheckingEmail ||
                      !emailAvailable ||
                      !agreeToTerms ||
                      !canSubmitBasic
                    }
                    tabIndex={4}
                    className="w-full h-12 mt-2 bg-black text-white hover:bg-black/90 active:scale-[0.98] active:bg-black/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                  >
                    {isEmailLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating account...
                      </span>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              </TooltipProvider>

              {/* Divider */}
              <div className="flex items-center my-6">
                <span className="flex-1 h-px bg-gray-300" />
                <span className="px-4 text-gray-400">or</span>
                <span className="flex-1 h-px bg-gray-300" />
              </div>

              {/* Google Sign Up Button */}
              <Button
                onClick={handleGoogleSignUp}
                disabled={isEmailLoading || isGoogleLoading}
                variant="outline"
                type="button"
                className="w-full h-12 bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 text-gray-900 border border-gray-300 rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">
                  {isGoogleLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    "Continue with Google"
                  )}
                </span>
              </Button>

              <p className="text-xs text-center text-gray-500 mt-3">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>

              {/* Bottom call-to-action */}
              <Link href="/auth/signin" className="block mt-10">
                <Button className="w-full bg-black text-white hover:bg-black/90">
                  Already have an account? Log in here
                </Button>
              </Link>
            </>
          )}

          {/* Google Password Setup Form */}
          {currentStep === "google-password" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="google-password" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="google-password"
                    type={showGooglePassword ? "text" : "password"}
                    placeholder="Enter a password (min. 8 characters)"
                    value={googlePassword}
                    onChange={(e) => setGooglePassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && googlePassword && confirmGooglePassword && googlePassword.length >= 8 && agreeToTerms) {
                        e.preventDefault();
                        handleGooglePasswordSubmit();
                      }
                    }}
                    className="pr-10 h-12"
                    autoFocus
                    tabIndex={1}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGooglePassword(!showGooglePassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    aria-label={showGooglePassword ? "Hide password" : "Show password"}
                  >
                    {showGooglePassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-google-password" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirm-google-password"
                    type={showConfirmGooglePassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmGooglePassword}
                    onChange={(e) => setConfirmGooglePassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && googlePassword && confirmGooglePassword && googlePassword.length >= 8 && agreeToTerms) {
                        e.preventDefault();
                        handleGooglePasswordSubmit();
                      }
                    }}
                    className="pr-10 h-12"
                    tabIndex={2}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmGooglePassword(!showConfirmGooglePassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    aria-label={showConfirmGooglePassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmGooglePassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4 pt-2">
                {/* Email Notifications Checkbox */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="google-email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={(checked) => setEmailNotifications(checked ?? true)}
                    tabIndex={-1}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="google-email-notifications"
                    className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                  >
                    Send me helpful emails to find rewarding work and job leads.
                  </Label>
                </div>

                {/* Terms of Service Checkbox */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="google-terms-agreement"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => {
                      setAgreeToTerms(checked ?? false);
                      if (checked) setShowTermsValidation(false);
                    }}
                    tabIndex={3}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="google-terms-agreement"
                    className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                  >
                    Yes, I understand and agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-blue-600 hover:text-blue-700 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms of Service
                    </Link>
                    , including the{" "}
                    <Link
                      href="/user-agreement"
                      target="_blank"
                      className="text-blue-600 hover:text-blue-700 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      User Agreement
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      className="text-blue-600 hover:text-blue-700 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </Link>
                    .
                  </Label>
                </div>
                {showTermsValidation && !agreeToTerms && (
                  <p className="text-sm text-red-600 ml-7 -mt-2">
                    You must agree to the Terms of Service to continue
                  </p>
                )}
              </div>

              <Button
                onClick={handleGooglePasswordSubmit}
                disabled={isAddingPassword || !googlePassword || !confirmGooglePassword || !agreeToTerms}
                tabIndex={4}
                className="w-full h-12 bg-black text-white hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingPassword ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Complete Sign Up"
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                After setting up your password, you can sign in with your email and password
                or continue using Google.
              </p>
            </div>
          )}


          {currentStep === "verify-otp" && (
            <VerifyOTP
              email={userEmail}
              onVerified={handleEmailVerified}
              onBack={() => setCurrentStep("signup")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
