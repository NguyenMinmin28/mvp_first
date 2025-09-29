"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { Badge } from "@/ui/components/badge";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";

export default function SkillsAndRolesStep() {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [level, setLevel] = useState<"FRESHER" | "MID" | "EXPERT" | "">("");

  // Immediate load from localStorage to prevent flicker/reset
  const initialSkillsRoles = (() => {
    if (typeof window === 'undefined') return {} as any;
    try { return JSON.parse(localStorage.getItem('onboarding.skillsRoles') || '{}'); } catch { return {}; }
  })() as { skills?: string[]; roles?: string[]; bio?: string; experience?: string; level?: string };
  useEffect(() => {
    if (initialSkillsRoles.skills?.length) setSkills(initialSkillsRoles.skills);
    if (initialSkillsRoles.roles?.length) setRoles(initialSkillsRoles.roles);
    if (typeof initialSkillsRoles.bio === 'string') setBio(initialSkillsRoles.bio);
    if (typeof initialSkillsRoles.experience === 'string') setExperience(initialSkillsRoles.experience);
    if (initialSkillsRoles.level === 'FRESHER' || initialSkillsRoles.level === 'MID' || initialSkillsRoles.level === 'EXPERT') setLevel(initialSkillsRoles.level as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft when fields change (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const payload = { skills, roles, bio, experience, level };
        localStorage.setItem("onboarding.skillsRoles", JSON.stringify(payload));
      } catch {}
    }, 250);
    return () => clearTimeout(id);
  }, [skills, roles, bio, experience, level]);

  // Autocomplete state
  const [skillOptions, setSkillOptions] = useState<{ id: string; name: string }[]>([]);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);

  useEffect(() => {
    let active = true;
    const term = newSkill.trim();
    if (!term) {
      // When cleared, immediately reset states
      setLoadingSkills(false);
      setSkillsOpen(false);
      setSkillOptions([]);
      return;
    }
    setLoadingSkills(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/skills?search=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch skills");
        const data = await res.json();
        if (active) {
          setSkillOptions((data.skills || []).map((s: any) => ({ id: s.id || s._id || s.name, name: s.name })));
          setSkillsOpen(true);
        }
      } catch (_e) {
        if (active) {
          setSkillOptions([]);
          setSkillsOpen(false);
        }
      } finally {
        if (active) setLoadingSkills(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [newSkill]);

  const addSkill = () => {
    const normalized = newSkill.trim();
    const match = skillOptions.find((o) => o.name.toLowerCase() === normalized.toLowerCase());
    if (match && !skills.includes(match.name)) {
      setSkills([...skills, match.name]);
      setNewSkill("");
      setSkillsOpen(false);
      setSkillOptions([]);
    }
  };

  const selectSkill = (name: string) => {
    if (!skills.includes(name)) {
      setSkills([...skills, name]);
    }
    setNewSkill("");
    setSkillsOpen(false);
    setSkillOptions([]);
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const addRole = () => {
    if (newRole.trim() && !roles.includes(newRole.trim())) {
      setRoles([...roles, newRole.trim()]);
      setNewRole("");
    }
  };

  const removeRole = (roleToRemove: string) => {
    setRoles(roles.filter(role => role !== roleToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Persist draft immediately before navigating
    try {
      const payload = { skills, roles, bio, experience, level };
      localStorage.setItem("onboarding.skillsRoles", JSON.stringify(payload));
    } catch {}

    // Persist to server (best-effort)
    try {
      await fetch("/api/user/save-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: level || undefined,
          experienceYears: Number(experience) || 0,
          bio: bio || undefined,
          roles: roles,
          skills,
        }),
      }).catch(() => {});
    } catch {}

    router.push("/onboarding/freelancer/portfolio");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Skills & Roles</CardTitle>
        <CardDescription>
          Tell us about your technical skills and the roles you can take on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Skills Section */}
          <div className="space-y-4">
            <Label htmlFor="skills">Technical Skills</Label>
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  id="skills"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Find your skills"
                  onFocus={() => newSkill && setSkillsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" onClick={addSkill} variant="outline" disabled={!skillOptions.some(o => o.name.toLowerCase() === newSkill.trim().toLowerCase())}>
                  Add
                </Button>
              </div>
              {skillsOpen && (skillOptions.length > 0 || loadingSkills) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingSkills && (
                    <div className="px-3 py-2 text-gray-500 text-sm">Searching...</div>
                  )}
                  {!loadingSkills && skillOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      onClick={() => selectSkill(opt.name)}
                    >
                      {opt.name}
                    </button>
                  ))}
                  {!loadingSkills && skillOptions.length === 0 && (
                    <div className="px-3 py-2 text-gray-500 text-sm">No skills found</div>
                  )}
                </div>
              )}
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Roles Section */}
          <div className="space-y-4">
            <Label htmlFor="roles">Preferred Roles</Label>
            <div className="flex gap-2">
              <Input
                id="roles"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="e.g., Frontend Developer, Backend Developer"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
              />
              <Button type="button" onClick={addRole} variant="outline">
                Add
              </Button>
            </div>
            {roles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge key={role} variant="secondary" className="flex items-center gap-1">
                    {role}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeRole(role)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Experience & Bio */}
          <div className="space-y-4">
            <Label htmlFor="experience">Experience Level</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your level (Fresher / Mid / Expert)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FRESHER">Fresher (0-1 years)</SelectItem>
                <SelectItem value="MID">Mid (2-4 years)</SelectItem>
                <SelectItem value="EXPERT">Expert (5+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            <Label htmlFor="bio">Short Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" />
          </div>

          <div className="pt-2">
            <Button className="min-w-28" type="submit">Next</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
