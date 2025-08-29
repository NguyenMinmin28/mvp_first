"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronDown, Calendar, Upload as UploadIcon } from "lucide-react";

type Skill = { id: string; name: string; category: string };


export function HeroProject() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoadingSkills(true);
      try {
        const res = await fetch("/api/skills", { cache: "no-store" });
        if (res.ok) setAvailableSkills(await res.json());
      } finally {
        setIsLoadingSkills(false);
      }
    };
    fetchSkills();
  }, []);

  const filteredSkills = useMemo(() => {
    const q = skillQuery.toLowerCase();
    const selected = new Set(skills);
    return availableSkills
      .filter((s) => s.name.toLowerCase().includes(q) && !selected.has(s.id))
      .slice(0, 10);
  }, [availableSkills, skillQuery, skills]);

  const unfilteredTopSkills = useMemo(() => {
    const selected = new Set(skills);
    return availableSkills.filter((s) => !selected.has(s.id)).slice(0, 10);
  }, [availableSkills, skills]);

  const selectedSkills = useMemo(() => {
    const selected = new Set(skills);
    return availableSkills.filter((s) => selected.has(s.id));
  }, [availableSkills, skills]);

  const addSkill = useCallback((id: string) => {
    setSkills((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSkillQuery("");
  }, []);

  const removeSkill = useCallback((id: string) => {
    setSkills((prev) => prev.filter((x) => x !== id));
  }, []);

  const isValid = Boolean(title.trim()) && skills.length > 0;

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid) return;
      // If not authenticated, route to signin preserving intent
      try {
        const resSession = await fetch("/api/auth/me");
        const me = resSession.ok ? await resSession.json() : null;
        if (!me?.user?.id) {
          window.location.href = "/auth/signin?callbackUrl=/";
          return;
        }
      } catch {}
      setIsSubmitting(true);
      const descriptionPayload = (description && description.trim())
        ? description.trim()
        : `Quick post: ${title}`;
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: descriptionPayload,
          skillsRequired: skills,
          budget,
          currency,
          hasFile: Boolean(file),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.id) {
          const target = `/projects/${data.id}`;
          router.prefetch?.(target);
          router.push(target);
        } else {
          router.push("/projects");
        }
      }
      setIsSubmitting(false);
    },
    [budget, description, endDate, isValid, skills, startDate, title, file, router]
  );

  return (
    <section className="w-full py-10 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 md:gap-8 items-start">
          {/* Left: Form column */}
          <div className="md:h-[520px]">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Find Freelancer</h1>

            <form onSubmit={onSubmit} className="space-y-3 md:h-[480px] md:overflow-auto md:overscroll-contain md:pr-4 overflow-x-visible">
              {/* Project Title */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project Title"
                className="h-12 rounded-lg bg-gray-100 border-0 focus-visible:ring-2 focus-visible:ring-black"
                aria-label="Project Title"
              />

              {/* Skills (search field with chevron) */}
              <div>
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSkills.map((s) => (
                      <Badge
                        key={s.id}
                        className="px-3 py-1 cursor-pointer"
                        onClick={() => removeSkill(s.id)}
                        title="Remove"
                      >
                        {s.name} ×
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Input
                    placeholder="Skills"
                    value={skillQuery}
                    onChange={(e) => setSkillQuery(e.target.value)}
                    onFocus={() => setSkillOpen(true)}
                    onBlur={() => setTimeout(() => setSkillOpen(false), 150)}
                    className="h-12 rounded-lg bg-gray-100 border-0 pr-9 focus-visible:ring-2 focus-visible:ring-black"
                    aria-label="Skills"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>

                {isLoadingSkills ? (
                  <div className="py-1.5">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  (skillOpen || skillQuery) && (
                    <div className="max-h-32 overflow-auto border rounded-lg divide-y mt-2 bg-white">
                      {(skillQuery ? filteredSkills : unfilteredTopSkills).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => addSkill(s.id)}
                          className="w-full text-left px-3 py-1.5 hover:bg-muted text-sm"
                        >
                          {s.name} <span className="text-muted-foreground">({s.category})</span>
                        </button>
                      ))}
                      {(skillQuery ? filteredSkills : unfilteredTopSkills).length === 0 && (
                        <div className="px-3 py-1.5 text-sm text-muted-foreground">No skills found</div>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Budget + Currency inline */}
              <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="h-12 rounded-lg bg-gray-100 border-0 focus-visible:ring-2 focus-visible:ring-black"
                  aria-label="Budget"
                />
                <div className="relative w-28">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-12 w-full rounded-lg bg-gray-100 border-0 pr-7 pl-3 text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black text-sm appearance-none [background-image:none] [&::-ms-expand]:hidden"
                    aria-label="Currency"
                  >
                    <option value="USD">USD</option>
                    <option value="VND">VND</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Dates with icons + headings like mockup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Start Date</p>
                  <div className="relative">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                      className="h-12 rounded-lg bg-gray-100 border-0 pl-10 focus-visible:ring-2 focus-visible:ring-black appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:appearance-none text-sm"
                      aria-label="Start Date"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-black flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-white" />
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expected end date</p>
                  <div className="relative">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                      className="h-12 rounded-lg bg-gray-100 border-0 pl-10 focus-visible:ring-2 focus-visible:ring-black appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:appearance-none text-sm"
                      aria-label="Expected end date"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-black flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-white" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Project Details + Browse File button */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
                <div className="h-12 rounded-lg bg-gray-100 border-0 flex items-center px-3">
                  <UploadIcon className="w-4 h-4 mr-2" />
                  <span className="text-sm text-gray-600">Upload  Project Details</span>
                </div>
                <label className="inline-flex items-center">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <span className="inline-flex items-center h-12 px-4 rounded-lg bg-black text-white cursor-pointer text-sm">
                    Browse File
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-1">
                <Button type="submit" disabled={!isValid || isSubmitting} className="h-11 px-6 rounded-lg bg-black text-white hover:bg-black/90 disabled:opacity-70 text-sm">
                  {isSubmitting ? "Creating..." : "Find"}
                </Button>
                <LoginHint />
              </div>
            </form>
          </div>

          {/* Right: Image column */}
          <div className="w-full h-full md:h-[520px]">
            <Card className="overflow-hidden h-full md:h-full">
              <CardContent className="p-0">
                <img
                  alt="Hire freelancer directly"
                  src="/images/home/hireafreelance.png"
                  className="w-full h-full object-cover"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroProject;

function LoginHint() {
  const { status } = useSession();
  if (status === "authenticated") return null;
  return (
    <Link href="/auth/signin" className="text-gray-600 underline">
      Log in to access your recent projects
    </Link>
  );
}
