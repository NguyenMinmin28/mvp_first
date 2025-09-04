"use client";

import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent } from "@/ui/components/card";
import { Label } from "@/ui/components/label";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Upload } from "lucide-react";

type Skill = { id: string; name: string };

interface ProjectPostFormProps {
  title?: string;
  description?: string;
  showLoginLink?: boolean;
  onSuccess?: (projectId: string) => void;
}

export function ProjectPostForm({ 
  title = "Project Post", 
  description = "Post your project and find the perfect freelancer",
  showLoginLink = true,
  onSuccess
}: ProjectPostFormProps) {
  const router = useRouter();
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillOpen, setSkillOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("hourly");

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
            console.error('Skills API returned invalid data:', data);
            setAvailableSkills([]);
          }
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
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

  const addSkill = (id: string) => setSkills((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const removeSkill = (id: string) => setSkills((prev) => prev.filter((x) => x !== id));

  const handleFindFreelancer = async () => {
    if (isSubmitting) return;
    if (!Array.isArray(skills) || skills.length === 0) {
      alert("Please select at least one technology");
      return;
    }
    setIsSubmitting(true);
    try {
      const titleInput = (document.getElementById("project-title") as HTMLInputElement | null)?.value?.trim() || "Quick project";
      const description = `Quick post: ${titleInput}`;
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: titleInput, 
          description, 
          skillsRequired: skills,
          paymentMethod 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.id) {
          if (onSuccess) {
            onSuccess(data.id);
          } else {
            router.push(`/projects/${data.id}`);
          }
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || "Failed to post project");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        <p className="text-gray-600">
          {description}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Project Title */}
          <div className="space-y-2">
            <Label htmlFor="project-title">Project Title</Label>
            <Input 
              id="project-title" 
              placeholder="Enter your project title"
              className="w-full"
            />
          </div>

          {/* Technologies (multi-select dropdown, no free typing) */}
          <div className="space-y-2">
            <Label>Technologies</Label>
            {Array.isArray(selectedSkills) && selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((s) => (
                  <Badge key={s.id} className="px-3 py-1 cursor-pointer" onClick={() => removeSkill(s.id)}>
                    {s.name} ×
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setSkillOpen((v) => !v)}
              >
                {Array.isArray(selectedSkills) && selectedSkills.length > 0 ? `${selectedSkills.length} selected` : "Select technologies"}
                <span className="ml-2">▾</span>
              </Button>
              {skillOpen && (
                <div className="absolute z-10 mt-2 w-full max-h-64 overflow-auto rounded-md border bg-white shadow">
                  {skillsLoading ? (
                    <div className="p-2 text-sm text-gray-500">Loading skills...</div>
                  ) : !Array.isArray(filteredSkills) || filteredSkills.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No options</div>
                  ) : (
                    filteredSkills.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={Array.isArray(skills) && skills.includes(s.id)}
                          onChange={(e) => (e.target.checked ? addSkill(s.id) : removeSkill(s.id))}
                        />
                        <span>{s.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex items-center space-x-6">
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
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input 
                id="start-date" 
                type="date"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Expected end date</Label>
              <Input 
                id="end-date" 
                type="date"
                className="w-full"
              />
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label htmlFor="document">Upload Product document</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Browse File
              </Button>
              <span className="text-sm text-gray-500">No file chosen</span>
            </div>
          </div>

          {/* Find Freelancer Button */}
          <Button className="w-full bg-black text-white hover:bg-black/90" onClick={handleFindFreelancer} disabled={isSubmitting}>
            <Search className="h-4 w-4 mr-2" />
            {isSubmitting ? "Posting..." : "Find Freelancer"}
          </Button>

          {/* Login Link */}
          {showLoginLink && (
            <div className="text-center">
              <a href="/auth/signin" className="text-sm text-gray-500 hover:text-gray-700">
                Log in to see your recent activity
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
