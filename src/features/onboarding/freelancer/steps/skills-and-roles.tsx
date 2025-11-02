"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Badge } from "@/ui/components/badge";
import { X, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";
import { fireAndForget } from "@/core/utils/fireAndForget";

export default function SkillsAndRolesStep() {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [experience, setExperience] = useState("");
  const [level, setLevel] = useState<"FRESHER" | "MID" | "EXPERT" | "">("");
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [levelError, setLevelError] = useState<string | null>(null);
  
  // Language proficiency state
  const [languages, setLanguages] = useState<Array<{ language: string; proficiency: string }>>([]);
  const [newLanguage, setNewLanguage] = useState("");
  const [newProficiency, setNewProficiency] = useState("conversational");

  // Immediate load from localStorage to prevent flicker/reset
  const initialSkillsRoles = (() => {
    if (typeof window === 'undefined') return {} as any;
    try { return JSON.parse(localStorage.getItem('onboarding.skillsRoles') || '{}'); } catch { return {}; }
  })() as { skills?: string[]; roles?: string[]; experience?: string; level?: string; languages?: Array<{ language: string; proficiency: string }> };
  useEffect(() => {
    if (initialSkillsRoles.skills?.length) setSkills(initialSkillsRoles.skills);
    if (initialSkillsRoles.roles?.length) setRoles(initialSkillsRoles.roles);
    if (typeof initialSkillsRoles.experience === 'string') setExperience(initialSkillsRoles.experience);
    if (initialSkillsRoles.level === 'FRESHER' || initialSkillsRoles.level === 'MID' || initialSkillsRoles.level === 'EXPERT') setLevel(initialSkillsRoles.level as any);
    if (initialSkillsRoles.languages?.length) setLanguages(initialSkillsRoles.languages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft when fields change (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const payload = { skills, roles, experience, level, languages };
        localStorage.setItem("onboarding.skillsRoles", JSON.stringify(payload));
      } catch {}
    }, 250);
    return () => clearTimeout(id);
  }, [skills, roles, experience, level, languages]);

  // Autocomplete state for skills
  const [skillOptions, setSkillOptions] = useState<{ id: string; name: string }[]>([]);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Autocomplete state for roles
  const [roleOptions, setRoleOptions] = useState<{ id: string; name: string }[]>([]);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Autocomplete state for languages
  const [languageOptions, setLanguageOptions] = useState<{ id: string; name: string }[]>([]);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [loadingLanguages, setLoadingLanguages] = useState(false);

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
      setSkillsError(null); // Clear error when skill is added
    }
  };

  const selectSkill = (name: string) => {
    if (!skills.includes(name)) {
      setSkills([...skills, name]);
      setSkillsError(null); // Clear error when skill is added
    }
    setNewSkill("");
    setSkillsOpen(false);
    setSkillOptions([]);
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };


  const removeRole = (roleToRemove: string) => {
    setRoles(roles.filter(role => role !== roleToRemove));
  };

  // Role autocomplete effect
  useEffect(() => {
    let active = true;
    const term = newRole.trim();
    if (!term) {
      setLoadingRoles(false);
      setRolesOpen(false);
      setRoleOptions([]);
      return;
    }
    setLoadingRoles(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/roles?search=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch roles");
        const data = await res.json();
        if (active) {
          setRoleOptions((data.roles || []).map((r: any) => ({ id: r.id || r.name, name: r.name })));
          setRolesOpen(true);
        }
      } catch (_e) {
        if (active) {
          setRoleOptions([]);
          setRolesOpen(false);
        }
      } finally {
        if (active) setLoadingRoles(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [newRole]);

  const addRole = () => {
    const normalized = newRole.trim();
    const match = roleOptions.find((o) => o.name.toLowerCase() === normalized.toLowerCase());
    if (match && !roles.includes(match.name)) {
      setRoles([...roles, match.name]);
      setNewRole("");
      setRolesOpen(false);
      setRoleOptions([]);
    }
  };

  const selectRole = (name: string) => {
    if (!roles.includes(name)) {
      setRoles([...roles, name]);
    }
    setNewRole("");
    setRolesOpen(false);
    setRoleOptions([]);
  };

  // Language autocomplete effect
  useEffect(() => {
    let active = true;
    const term = newLanguage.trim();
    if (!term) {
      setLoadingLanguages(false);
      setLanguagesOpen(false);
      setLanguageOptions([]);
      return;
    }
    setLoadingLanguages(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/languages?search=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch languages");
        const data = await res.json();
        if (active) {
          setLanguageOptions((data.languages || []).map((l: any) => ({ id: l.id || l.name, name: l.name })));
          setLanguagesOpen(true);
        }
      } catch (_e) {
        if (active) {
          setLanguageOptions([]);
          setLanguagesOpen(false);
        }
      } finally {
        if (active) setLoadingLanguages(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [newLanguage]);

  const addLanguage = () => {
    const normalized = newLanguage.trim();
    const match = languageOptions.find((o) => o.name.toLowerCase() === normalized.toLowerCase());
    if (match && !languages.some(l => l.language.toLowerCase() === match.name.toLowerCase())) {
      setLanguages([...languages, { language: match.name, proficiency: newProficiency }]);
      setNewLanguage("");
      setLanguagesOpen(false);
      setLanguageOptions([]);
    }
  };

  const selectLanguage = (name: string) => {
    if (!languages.some(l => l.language.toLowerCase() === name.toLowerCase())) {
      setLanguages([...languages, { language: name, proficiency: newProficiency }]);
    }
    setNewLanguage("");
    setLanguagesOpen(false);
    setLanguageOptions([]);
  };

  const removeLanguage = (languageToRemove: string) => {
    setLanguages(languages.filter(lang => lang.language !== languageToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasErrors = false;

    // Validate technical skills (minimum 3)
    if (skills.length < 3) {
      setSkillsError(`Please add at least 3 technical skills. Currently you have ${skills.length}.`);
      hasErrors = true;
    } else {
      setSkillsError(null);
    }

    // Validate experience level
    if (!level) {
      setLevelError("Please select your experience level");
      hasErrors = true;
    } else {
      setLevelError(null);
    }

    // If there are validation errors, stop here
    if (hasErrors) {
      return;
    }

    // Persist draft immediately before navigating
    try {
      const payload = { skills, roles, experience, level, languages };
      localStorage.setItem("onboarding.skillsRoles", JSON.stringify(payload));
    } catch {}

    // Fire-and-forget server save (don't wait for response)
    fireAndForget("/api/user/save-onboarding", {
      level: level || undefined,
      experienceYears: Number(experience) || 0,
      roles: roles,
      skills,
      languages: languages,
    });

    // Navigate immediately
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
            <Label htmlFor="skills">Technical Skills <span className="text-red-500">*</span> <span className="text-gray-500 text-sm font-normal">(Minimum 3 required)</span></Label>
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
            {skillsError && (
              <p className="text-sm text-red-600 mt-1">{skillsError}</p>
            )}
            {!skillsError && skills.length > 0 && skills.length < 3 && (
              <p className="text-sm text-amber-600 mt-1">
                You need {3 - skills.length} more skill{3 - skills.length !== 1 ? "s" : ""} (minimum 3 required).
              </p>
            )}
          </div>

          {/* Roles Section */}
          <div className="space-y-4">
            <Label htmlFor="roles">Preferred Roles</Label>
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  id="roles"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Find your roles"
                  onFocus={() => newRole && setRolesOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRole();
                    }
                  }}
                />
                <Button type="button" onClick={addRole} variant="outline" disabled={!roleOptions.some(o => o.name.toLowerCase() === newRole.trim().toLowerCase())}>
                  Add
                </Button>
              </div>
              {rolesOpen && (roleOptions.length > 0 || loadingRoles) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingRoles && (
                    <div className="px-3 py-2 text-gray-500 text-sm">Searching...</div>
                  )}
                  {!loadingRoles && roleOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      onClick={() => selectRole(opt.name)}
                    >
                      {opt.name}
                    </button>
                  ))}
                  {!loadingRoles && roleOptions.length === 0 && (
                    <div className="px-3 py-2 text-gray-500 text-sm">No roles found</div>
                  )}
                </div>
              )}
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

          {/* Experience Level */}
          <div className="space-y-4">
            <Label htmlFor="experience">Experience Level <span className="text-red-500">*</span></Label>
            <Select value={level} onValueChange={(v) => {
              setLevel(v as any);
              setLevelError(null); // Clear error when level is selected
            }}>
              <SelectTrigger className={levelError ? "border-red-500" : ""}>
                <SelectValue placeholder="Select your level (Fresher / Mid / Expert)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FRESHER">Fresher (0-1 years)</SelectItem>
                <SelectItem value="MID">Mid (2-4 years)</SelectItem>
                <SelectItem value="EXPERT">Expert (5+ years)</SelectItem>
              </SelectContent>
            </Select>
            {levelError && (
              <p className="text-sm text-red-600 mt-1">{levelError}</p>
            )}
          </div>

          {/* Language Proficiency Section */}
          <div className="space-y-4">
            <Label htmlFor="languages">Language Proficiency</Label>
            <div className="space-y-2">
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    id="languages"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Find your language"
                    onFocus={() => newLanguage && setLanguagesOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLanguage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Select value={newProficiency} onValueChange={setNewProficiency}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="native">Native</SelectItem>
                      <SelectItem value="fluent">Fluent</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addLanguage} variant="outline" disabled={!languageOptions.some(o => o.name.toLowerCase() === newLanguage.trim().toLowerCase())}>
                    Add
                  </Button>
                </div>
                {languagesOpen && (languageOptions.length > 0 || loadingLanguages) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {loadingLanguages && (
                      <div className="px-3 py-2 text-gray-500 text-sm">Searching...</div>
                    )}
                    {!loadingLanguages && languageOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100"
                        onClick={() => selectLanguage(opt.name)}
                      >
                        {opt.name}
                      </button>
                    ))}
                    {!loadingLanguages && languageOptions.length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">No languages found</div>
                    )}
                  </div>
                )}
              </div>
              {languages.length > 0 && (
                <div className="flex flex-col gap-2">
                  {languages.map((lang) => (
                    <Badge key={lang.language} variant="secondary" className="flex items-center gap-2 w-fit">
                      <span>{lang.language}</span>
                      <span className="text-xs opacity-75">({lang.proficiency})</span>
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeLanguage(lang.language)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3">
            <Button 
              variant="outline"
              className="flex-1 sm:flex-initial min-w-28" 
              type="button"
              onClick={() => router.push("/onboarding/freelancer/basic-information")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button className="flex-1 sm:flex-initial min-w-28" type="submit">Next</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
