"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Textarea } from "@/ui/components/textarea";
import { Label } from "@/ui/components/label";
import { Badge } from "@/ui/components/badge";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { AlertTriangle, CheckCircle, Clock, Users, Target } from "lucide-react";
import { toast } from "sonner";

interface Skill {
  id: string;
  name: string;
  category: string;
}

export default function NewProjectForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skillsRequired: [] as string[],
    budget: "",
    currency: "USD",
    paymentMethod: "hourly"
  });
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [quotaStatus, setQuotaStatus] = useState<{ hasActiveSubscription: boolean; remaining?: { projects?: number } } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load available skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch("/api/skills");
        if (response.ok) {
          const skills = await response.json();
          setAvailableSkills(skills);
        }
      } catch (error) {
        console.error("Failed to load skills:", error);
      } finally {
        setIsLoadingSkills(false);
      }
    };

    fetchSkills();
  }, []);

  // Prefetch quota usage to inform user before submit
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await fetch("/api/billing/quotas", { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setQuotaStatus({ hasActiveSubscription: !!data.hasActiveSubscription, remaining: data.remaining });
      } catch {}
    };
    fetchQuota();
  }, []);

  // Auto-open upgrade modal when no remaining project slots
  useEffect(() => {
    if (quotaStatus && quotaStatus.remaining?.projects === 0) {
      setShowUpgradeModal(true);
    }
  }, [quotaStatus]);

  // Debounce search to avoid frequent re-renders
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(skillSearch), 200);
    return () => clearTimeout(id);
  }, [skillSearch]);

  const filteredSkills = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const selected = new Set(formData.skillsRequired);
    return availableSkills.filter((skill) =>
      skill.name.toLowerCase().includes(q) && !selected.has(skill.id)
    );
  }, [availableSkills, debouncedSearch, formData.skillsRequired]);

  const selectedSkills = useMemo(() => {
    const selected = new Set(formData.skillsRequired);
    return availableSkills.filter((skill) => selected.has(skill.id));
  }, [availableSkills, formData.skillsRequired]);

  const addSkill = useCallback((skillId: string) => {
    setFormData((prev) => {
      if (prev.skillsRequired.includes(skillId)) return prev;
      return { ...prev, skillsRequired: [...prev.skillsRequired, skillId] };
    });
    setSkillSearch("");
  }, []);

  const removeSkill = useCallback((skillId: string) => {
    setFormData((prev) => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter((id) => id !== skillId),
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.title.trim() || !formData.description.trim() || formData.skillsRequired.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (quotaStatus && quotaStatus.remaining?.projects === 0) {
      setShowUpgradeModal(true);
      toast.error("You've reached your project limit", {
        description: "Upgrade your plan to post more projects.",
      });
      return;
    }
    setShowDisclaimer(true);
  }, [formData.description, formData.skillsRequired.length, formData.title, isSubmitting, quotaStatus]);

  const confirmSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowDisclaimer(false);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? Number(formData.budget) : undefined
        }),
      });

      if (response.ok) {
        const project = await response.json();
        toast.success("Project posted successfully!");
        const target = `/projects/${project.id}`;
        // Prefetch to avoid transition flicker, then navigate
        router.prefetch?.(target);
        router.push(target);
      } else {
        // Show upgrade modal on quota/payment limits
        if (response.status === 402) {
          setShowUpgradeModal(true);
        }
        let error: any = {};
        try { error = await response.json(); } catch {}
        if (error.code === "FREE_LIMIT_EXCEEDED" || error.code === "PROJECT_QUOTA_EXCEEDED" || response.status === 402) {
          toast.error("You've reached your project limit", {
            description: "Please upgrade your plan to post more projects.",
            action: {
              label: "View Plans",
              onClick: () => router.push("/pricing")
            }
          });
          return;
        }
        toast.error(error.message || "Failed to post project");
      }
    } catch (error) {
      console.error("Error posting project:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, router]);

  const isFormValid = useMemo(() => (
    !!formData.title.trim() && !!formData.description.trim() && formData.skillsRequired.length > 0
  ), [formData.description, formData.skillsRequired.length, formData.title]);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Setup Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Quick Setup (Under 60 seconds)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Choose skills needed</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Get Expert/Mid/Fresher mix</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>15min response window</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Title */}
        <Card>
          <CardHeader>
            <CardTitle>Project Title *</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g., Build a React Dashboard with TypeScript"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="text-lg"
            />
          </CardContent>
        </Card>

        {/* Project Description */}
        <Card>
          <CardHeader>
            <CardTitle>Project Description *</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Describe your project requirements, goals, and any specific details developers should know..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Skills Required */}
        <Card>
          <CardHeader>
            <CardTitle>Required Skills * ({selectedSkills.length} selected)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Skills */}
            {selectedSkills.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Skills:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="default"
                      className="px-3 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeSkill(skill.id)}
                    >
                      {skill.name} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Search */}
            <div className="space-y-2">
              <Label htmlFor="skill-search">Add Skills:</Label>
              <Input
                id="skill-search"
                placeholder="Search for skills (e.g., React, Node.js, Python...)"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
              />
            </div>

            {/* Available Skills */}
            {isLoadingSkills ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-2">
                {skillSearch && filteredSkills.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                    {filteredSkills.slice(0, 10).map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => addSkill(skill.id)}
                        className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                      >
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-gray-500 ml-2">({skill.category})</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {skillSearch && filteredSkills.length === 0 && (
                  <p className="text-sm text-gray-500 py-2">
                    No skills found. Try different keywords.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="hourly"
                  checked={formData.paymentMethod === "hourly"}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="h-4 w-4 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">Pay by the hours</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="fixed"
                  checked={formData.paymentMethod === "fixed"}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="h-4 w-4 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">Pay fixed price</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Budget and Currency */}
        <Card>
          <CardHeader>
            <CardTitle>Budget (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                placeholder="Enter budget amount"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                className="flex-1"
                min="0"
                step="0.01"
              />
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="VND">VND</option>
              </select>
            </div>
            <p className="text-xs text-gray-500">
              {formData.paymentMethod === "hourly" ? "Hourly rate" : "Total project budget"}
            </p>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={!isFormValid || isSubmitting}
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Posting Project...
              </>
            ) : (
              (quotaStatus && quotaStatus.remaining?.projects === 0)
                ? "Upgrade to Post"
                : "Post Project"
            )}
          </Button>
        </div>
      </form>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                You’ve reached your project limit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Upgrade your plan to post more projects and continue matching with developers.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowUpgradeModal(false)}>Close</Button>
                <Button className="flex-1" onClick={() => (window.location.href = "/pricing")}>View Plans</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p>Before posting your project:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>You'll receive a mix of Expert, Mid-level, and Fresher developers</li>
                  <li>Developers have 15 minutes to respond to your invitation</li>
                  <li>You can refresh the batch if needed (previous candidates become invalid)</li>
                  <li>Contact information is revealed only after a developer accepts</li>
                </ul>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDisclaimer(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Posting...
                    </>
                  ) : (
                    "Confirm & Post"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
