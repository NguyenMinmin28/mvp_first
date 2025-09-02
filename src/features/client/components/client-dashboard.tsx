"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";
import { Badge } from "@/ui/components/badge";
import { useEffect, useMemo, useState } from "react";
import { RoleMismatchNotice } from "@/ui/components/role-mismatch-notice";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { 
  Calendar,
  Upload,
  Search,
  Heart,
  Sprout,
  Palmtree,
  TreePine
} from "lucide-react";
import ProjectActivity from "./project-activity";

type Skill = { id: string; name: string };

export default function ClientDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const userRole = session?.user?.role as string | undefined;
  const targetPortal = searchParams.get("targetPortal") as string | undefined;

  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillOpen, setSkillOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(true);

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
      const description = `Client dashboard quick post: ${titleInput}`;
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleInput, description, skillsRequired: skills }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.id) {
          router.push(`/projects/${data.id}`);
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
    <div className="space-y-8">
      {/* Role Mismatch Notice */}
      <RoleMismatchNotice userRole={userRole} targetPortal={targetPortal} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Section - Project Post / Find Freelancer */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Project Post
            </h1>
            <p className="text-gray-600">
              Post your project and find the perfect freelancer
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
              <div className="text-center">
                <a href="/auth/signin" className="text-sm text-gray-500 hover:text-gray-700">
                  Log in to see your recent activity
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section - Team */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900  mb-2">
              Team
            </h2>
            <p className="text-gray-600">
              Choose your team level
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Favourite Card */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">Favourite</h3>
              </CardContent>
            </Card>

            {/* Starter Card */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Sprout className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">Starter</h3>
              </CardContent>
            </Card>

            {/* Mid Card */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Palmtree className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">Mid</h3>
              </CardContent>
            </Card>

            {/* Expert Card */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TreePine className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">Expert</h3>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Project Activity Section */}
      <ProjectActivity />

      {/* Plan for later section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-gray-900  mb-8">
          Plan for later
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Pricing Plans */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: "basic",
                  name: "Basic Plan - Starter",
                  price: "$0",
                  period: "/monthly",
                  features: [
                    "Lorem Ipsum is simply dummy text",
                    "Lorem Ipsum is simply dummy text", 
                    "Lorem Ipsum is simply dummy text"
                  ],
                  cta: "CHOOSE YOUR PLAN",
                },
                {
                  id: "pro",
                  name: "Pro Plan - Starter",
                  price: "$19.95",
                  period: "/monthly",
                  features: [
                    "Lorem Ipsum is simply dummy text",
                    "Lorem Ipsum is simply dummy text",
                    "Lorem Ipsum is simply dummy text"
                  ],
                  cta: "CHOOSE YOUR PLAN",
                },
                {
                  id: "premium",
                  name: "Premium Plan - Starter",
                  price: "$99",
                  period: "/monthly",
                  features: [
                    "Lorem Ipsum is simply dummy text",
                    "Lorem Ipsum is simply dummy text",
                    "Lorem Ipsum is simply dummy text"
                  ],
                  cta: "CHOOSE YOUR PLAN",
                }
              ].map((plan) => (
                <Card key={plan.id} className="border-2">
                  <CardHeader>
                    <CardTitle className={`text-lg font-semibold ${plan.id === "pro" ? "text-blue-600 underline" : ""}`}>
                      {plan.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="py-4 border-t">
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-extrabold">{plan.price}</span>
                        <span className="text-sm text-gray-500">{plan.period}</span>
                      </div>
                    </div>

                    <Button className="w-full h-12 text-sm font-semibold mt-2 bg-gray-600 hover:bg-gray-700">
                      {plan.cta}
                    </Button>

                    <div className="mt-6 rounded-md border bg-gray-50">
                      <div className="px-4 py-3 font-semibold">Service Include:</div>
                      <ul className="px-4 pb-4 space-y-3 text-sm text-gray-700">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-gray-600" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Post projects anytime and connect instantly</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Flexible contracts with direct agreements</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Keep 100% earnings, zero commission</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t">
                  <a href="#" className="text-sm text-gray-600 underline hover:text-gray-800">
                    See terms
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
