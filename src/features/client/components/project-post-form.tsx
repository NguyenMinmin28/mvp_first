"use client";

import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Badge } from "@/ui/components/badge";
import { Label } from "@/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import { toast } from "sonner";

type Skill = { id: string; name: string };

interface ProjectPostFormProps {
  title?: string;
  description?: string;
  showLoginLink?: boolean;
  onSuccess?: (projectId: string) => void;
}

export function ProjectPostForm({
  title = "Post Project",
  description = "",
  showLoginLink = true,
  onSuccess,
}: ProjectPostFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillOpen, setSkillOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("fixed"); // Default to fixed price
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const skillDropdownRef = useRef<HTMLDivElement>(null);

  // Load saved form data from sessionStorage
  useEffect(() => {
    // Only access sessionStorage on client side
    if (typeof window !== "undefined") {
      const savedData = sessionStorage.getItem("guestProjectForm");
      console.log(
        "🔍 Loading saved form data:",
        savedData,
        "Session status:",
        status
      );
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log("🔍 Parsed form data:", parsed);
          setProjectTitle(parsed.title || "");
          setProjectDescription(parsed.description || "");
          setSkills(parsed.skills || []);
          setPaymentMethod(parsed.paymentMethod || "fixed");
          setBudgetMin(parsed.budgetMin || "");
          setBudgetMax(parsed.budgetMax || "");
          setCurrency(parsed.currency || "USD");
          console.log("✅ Form data loaded successfully");
        } catch (error) {
          console.error("Error parsing saved form data:", error);
        }
      } else {
        console.log("🔍 No saved form data found");
      }
    }
  }, [status]); // Load when session status changes

  // Also load data on component mount
  useEffect(() => {
    // Only access sessionStorage on client side
    if (typeof window !== "undefined") {
      const savedData = sessionStorage.getItem("guestProjectForm");
      console.log("🔍 Loading saved form data on mount:", savedData);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log("🔍 Parsed form data on mount:", parsed);
          setProjectTitle(parsed.title || "");
          setSkills(parsed.skills || []);
          setPaymentMethod(parsed.paymentMethod || "fixed");
          setBudgetMin(parsed.budgetMin || "");
          setBudgetMax(parsed.budgetMax || "");
          setCurrency(parsed.currency || "USD");
          console.log("✅ Form data loaded successfully on mount");
        } catch (error) {
          console.error("Error parsing saved form data on mount:", error);
        }
      } else {
        console.log("🔍 No saved form data found on mount");
      }
    }
  }, []); // Load data on component mount

  // Save form data to sessionStorage for all users (not just guests)
  useEffect(() => {
    // Only access sessionStorage on client side
    if (typeof window !== "undefined") {
      // Only save if there's actual data to save
      if (
        projectTitle.trim() ||
        projectDescription.trim() ||
        skills.length > 0 ||
        budgetMin.trim() ||
        budgetMax.trim()
      ) {
        const formData = {
          title: projectTitle,
          description: projectDescription,
          skills: skills,
          paymentMethod: paymentMethod,
          budgetMin: budgetMin,
          budgetMax: budgetMax,
          currency: currency,
        };
        console.log(
          "💾 Saving form data:",
          formData,
          "Session status:",
          status
        );
        sessionStorage.setItem("guestProjectForm", JSON.stringify(formData));
      }
    }
  }, [
    projectTitle,
    projectDescription,
    skills,
    paymentMethod,
    budgetMin,
    budgetMax,
    currency,
    status,
  ]);

  // Clear saved data when user successfully submits the form
  const clearSavedData = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("guestProjectForm");
    }
  };

  // Clear validation error when user starts typing
  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Handle login for existing users
  const handleLogin = () => {
    // Form data is already saved by useEffect, just redirect to signin
    router.push("/auth/signin");
  };

  useEffect(() => {
    const fetchSkills = async () => {
      setSkillsLoading(true);
      try {
        const res = await fetch("/api/skills", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // Đảm bảo data.skills là array
          if (data && Array.isArray(data.skills)) {
            setAvailableSkills(data.skills);
          } else {
            console.error("Skills API returned invalid data:", data);
            setAvailableSkills([]);
          }
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
        setAvailableSkills([]);
      } finally {
        setSkillsLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const filteredSkills = useMemo(() => {
    const selected = new Set(skills);
    // Đảm bảo availableSkills là array
    if (!Array.isArray(availableSkills)) return [];
    return availableSkills.filter((s) => !selected.has(s.id));
  }, [availableSkills, skills]);

  const selectedSkills = useMemo(() => {
    const selected = new Set(skills);
    // Đảm bảo availableSkills là array
    if (!Array.isArray(availableSkills)) return [];
    return availableSkills.filter((s) => selected.has(s.id));
  }, [availableSkills, skills]);

  const addSkill = (id: string) => {
    setSkills((prev) => {
      if (prev.includes(id)) return prev;
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, id];
    });
    clearFieldError("skills");
  };
  const removeSkill = (id: string) =>
    setSkills((prev) => prev.filter((x) => x !== id));

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        skillDropdownRef.current &&
        !skillDropdownRef.current.contains(event.target as Node)
      ) {
        setSkillOpen(false);
      }
    };

    const handleScroll = () => {
      setSkillOpen(false);
    };

    const handleResize = () => {
      setSkillOpen(false);
    };

    if (skillOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [skillOpen]);

  // Toggle dropdown
  const handleToggleDropdown = () => {
    setSkillOpen((v) => !v);
  };

  const handleFindFreelancer = async () => {
    if (isSubmitting) return;

    // Validate required fields and set errors
    const errors: { [key: string]: boolean } = {};

    if (!projectTitle.trim()) {
      errors.projectTitle = true;
    }
    if (!projectDescription.trim()) {
      errors.projectDescription = true;
    }
    if (!Array.isArray(skills) || skills.length === 0) {
      errors.skills = true;
    }
    if (!budgetMin.trim() && !budgetMax.trim()) {
      errors.budget = true;
    }

    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // If user is not logged in, redirect to signup
    if (status === "unauthenticated") {
      // Form data is already saved by useEffect, just redirect
      router.push("/auth/signup");
      return;
    }

    // If user is logged in, proceed with project creation
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle.trim(),
          description: projectDescription.trim(),
          skillsRequired: skills,
          paymentMethod: paymentMethod,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          currency,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.id) {
          // Clear saved form data after successful submission
          clearSavedData();

          if (onSuccess) {
            onSuccess(data.id);
          } else {
            router.push(`/projects/${data.id}`);
          }
        }
      } else {
        const err = await res.json().catch(() => ({}));

        // Debug response headers
        console.log("🔍 Response headers:", {
          status: res.status,
          quotaExceeded: res.headers.get("X-Debug-Quota-Exceeded"),
          userId: res.headers.get("X-Debug-User-ID"),
          error: err,
        });

        // Check if it's a quota exceeded error
        if (
          res.status === 402 ||
          err?.code === "QUOTA_EXCEEDED" ||
          err?.code === "FREE_LIMIT_EXCEEDED"
        ) {
          toast.error("Project limit reached", {
            description:
              "You've reached your project posting limit. Upgrade your plan to post more projects.",
            action: {
              label: "View Plans",
              onClick: () => router.push("/pricing"),
            },
          });

          // Dispatch event to refresh notification count
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("notification-refresh"));
          }, 1000); // Wait 1 second for notification to be created
        } else {
          toast.error(err?.error || "Failed to post project", {
            description:
              "Please try again or contact support if the problem persists.",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGuest = status === "unauthenticated";

  return (
    <div className="flex flex-col pt-0 justify-between h-full project-form-content">
      {title && (
        <h1 className="text-5xl font-bold text-gray-900 mb-4">{title}</h1>
      )}
      {/* Project Title */}
      <div className="mb-4">
        <Input
          id="project-title"
          placeholder="Project Title"
          value={projectTitle}
          onChange={(e) => {
            setProjectTitle(e.target.value);
            clearFieldError("projectTitle");
          }}
          className={`h-12 w-full bg-[#F3F3F3] border-0 ${validationErrors.projectTitle ? "border-red-500 focus:ring-red-500" : ""}`}
          required
        />
        {validationErrors.projectTitle && (
          <p className="text-red-500 text-sm mt-1">Project title is required</p>
        )}
      </div>

      {/* Description */}
      <div className="mb-4">
        <textarea
          id="project-description"
          placeholder="Project Description"
          value={projectDescription}
          onChange={(e) => {
            setProjectDescription(e.target.value);
            clearFieldError("projectDescription");
          }}
          className={`w-full text-sm px-3 py-3 border-0 rounded-md focus:outline-none focus:ring-2 focus:border-transparent resize-none bg-[#F3F3F3] ${
            validationErrors.projectDescription
              ? "border-red-500 focus:ring-red-500"
              : "focus:ring-black"
          }`}
          rows={5}
          required
        />
        {validationErrors.projectDescription && (
          <p className="text-red-500 text-sm mt-1">
            Project description is required
          </p>
        )}
      </div>

      {/* Skills */}
      <div className="mb-4">
        {Array.isArray(selectedSkills) && selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedSkills.map((s) => (
              <Badge
                key={s.id}
                className="px-3 py-1.5 cursor-pointer bg-gray-800 text-white hover:bg-gray-700 transition-colors rounded-md text-sm font-medium"
                onClick={() => removeSkill(s.id)}
              >
                {s.name} ×
              </Badge>
            ))}
          </div>
        )}
        <div className="relative" ref={skillDropdownRef}>
          <Button
            type="button"
            variant="outline"
            className={`h-12 w-full justify-between bg-[#F3F3F3] border-0 text-gray-700 hover:bg-gray-200 transition-colors py-3 ${validationErrors.skills ? "border-red-500 text-red-600" : ""}`}
            onClick={handleToggleDropdown}
          >
            {Array.isArray(selectedSkills) && selectedSkills.length > 0
              ? `${selectedSkills.length}/5 selected`
              : "Skills (max 5)"}
            <span className="ml-2">▾</span>
          </Button>
          {skillOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-64 overflow-auto rounded-md border-0 bg-white shadow-lg">
              {skillsLoading ? (
                <div className="p-2 text-sm text-gray-500">
                  Loading skills...
                </div>
              ) : !Array.isArray(filteredSkills) ||
                filteredSkills.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No options</div>
              ) : (
                filteredSkills.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm ${Array.isArray(skills) && skills.length >= 5 && !skills.includes(s.id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Array.isArray(skills) && skills.includes(s.id)}
                      disabled={
                        Array.isArray(skills) &&
                        skills.length >= 5 &&
                        !skills.includes(s.id)
                      }
                      onChange={(e) =>
                        e.target.checked ? addSkill(s.id) : removeSkill(s.id)
                      }
                    />
                    <span>{s.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>
        {validationErrors.skills && (
          <p className="text-red-500 text-sm mt-1">
            Please select at least one skill (max 5)
          </p>
        )}
      </div>

      {/* Budget Range */}
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <Input
              type="number"
              placeholder="Min"
              value={budgetMin}
              onChange={(e) => {
                setBudgetMin(e.target.value);
                clearFieldError("budget");
              }}
              className={`h-12 w-full pl-8 bg-[#F3F3F3] border-0 ${validationErrors.budget ? "border-red-500 focus:ring-red-500" : ""}`}
              min="0"
              step="0.01"
              required
              inputMode="decimal"
              onKeyDown={(e) => {
                if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                if (el.value === "") return;
                const n = Number(el.value);
                if (Number.isNaN(n)) {
                  el.value = "";
                  return;
                }
                if (n < 0) el.value = "0";
              }}
            />
          </div>
          <span className="text-gray-600">-</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <Input
              type="number"
              placeholder="Max"
              value={budgetMax}
              onChange={(e) => {
                setBudgetMax(e.target.value);
                clearFieldError("budget");
              }}
              className={`h-12 w-full pl-8 bg-[#F3F3F3] border-0 ${validationErrors.budget ? "border-red-500 focus:ring-red-500" : ""}`}
              min="0"
              step="0.01"
              required
              inputMode="decimal"
              onKeyDown={(e) => {
                if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                if (el.value === "") return;
                const n = Number(el.value);
                if (Number.isNaN(n)) {
                  el.value = "";
                  return;
                }
                if (n < 0) el.value = "0";
              }}
            />
          </div>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="h-12 w-20 bg-[#F3F3F3] border-0 focus:ring-2 focus:ring-black focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="VND">VND</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {validationErrors.budget && (
          <p className="text-red-500 text-sm mt-1">
            Enter budget range (min or max)
          </p>
        )}
      </div>

      {/* Project Type - moved below Budget as requested */}
      <div className="mb-4">
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="fixed"
              checked={paymentMethod === "fixed"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-4 w-4 text-black focus:ring-black"
            />
            <span className="text-sm text-gray-700">Pay fixed price</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="hourly"
              checked={paymentMethod === "hourly"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-4 w-4 text-black focus:ring-black"
            />
            <span className="text-sm text-gray-700">Pay by the hours</span>
          </label>
        </div>
      </div>

      {/* Post Project Button */}
      <div className="mb-4">
        <Button
          className="h-12 w-full bg-black text-white hover:bg-black/90"
          onClick={
            isGuest ? () => router.push("/auth/signup") : handleFindFreelancer
          }
          disabled={isSubmitting}
        >
          {isGuest ? (
            "Sign Up to Post Project"
          ) : isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Finding...
            </>
          ) : (
            "Find"
          )}
        </Button>
      </div>

      {/* Auth prompts when unauthenticated */}
      {isGuest && (
        <div className="text-center">
          <span className="text-sm text-gray-600">
            Already have an account ?{" "}
          </span>
          <a href="/auth/signin" className="text-sm underline">
            Log in
          </a>
        </div>
      )}

      {/* Hide login link when authenticated */}
    </div>
  );
}
