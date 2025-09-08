"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import AvatarUpload from "../avatar-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";

interface DeveloperProfileTabProps {
  profileData: any;
  isEditing: boolean;
  onInputChange: (field: string, value: string | number | boolean) => void;
}

export default function DeveloperProfileTab({
  profileData,
  isEditing,
  onInputChange,
}: DeveloperProfileTabProps) {
  // Load skills list
  const [allSkills, setAllSkills] = useState<Array<{ id: string; name: string; category?: string }>>([]);
  const [skillsLoading, setSkillsLoading] = useState<boolean>(false);
  const [skillsSearch, setSkillsSearch] = useState<string>("");

  const selectedSkillIds: string[] = useMemo(() => {
    if (Array.isArray(profileData?.skillIds)) return profileData.skillIds as string[];
    if (Array.isArray(profileData?.skills)) return (profileData.skills as any[]).map((s: any) => s.skillId);
    return [];
  }, [profileData]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setSkillsLoading(true);
        const qs = skillsSearch ? `?search=${encodeURIComponent(skillsSearch)}` : "";
        const res = await fetch(`/api/skills${qs}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setAllSkills(Array.isArray(data.skills) ? data.skills : []);
      } finally {
        setSkillsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [skillsSearch]);

  const filteredSkills = useMemo(() => {
    if (!skillsSearch) return allSkills;
    const q = skillsSearch.toLowerCase();
    return allSkills.filter((s) => s.name.toLowerCase().includes(q));
  }, [allSkills, skillsSearch]);

  const toggleSkill = (id: string) => {
    if (!isEditing) return;
    const next = selectedSkillIds.includes(id)
      ? selectedSkillIds.filter((x) => x !== id)
      : [...selectedSkillIds, id];
    onInputChange("skillIds", next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar Upload Section */}
        <AvatarUpload
          value={profileData.photoUrl || ""}
          onChange={(value) => onInputChange("photoUrl", value)}
          disabled={!isEditing}
          name={profileData.name}
          size="md"
        />

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profileData.bio || ""}
            onChange={(e) => onInputChange("bio", e.target.value)}
            disabled={!isEditing}
            placeholder="Tell us about yourself and your expertise..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="experienceYears">Years of Experience</Label>
            <Input
              id="experienceYears"
              type="number"
              value={profileData.experienceYears || 0}
              onChange={(e) =>
                onInputChange("experienceYears", parseInt(e.target.value))
              }
              disabled={!isEditing}
              min="0"
              max="50"
            />
          </div>
          <div>
            <Label htmlFor="level">Experience Level</Label>
            <Select
              value={profileData.level || "FRESHER"}
              onValueChange={(value) => onInputChange("level", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FRESHER">Fresher (0-2 years)</SelectItem>
                <SelectItem value="MID">Mid-level (3-5 years)</SelectItem>
                <SelectItem value="EXPERT">Expert (5+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <Input
            id="linkedinUrl"
            value={profileData.linkedinUrl || ""}
            onChange={(e) => onInputChange("linkedinUrl", e.target.value)}
            disabled={!isEditing}
            placeholder="https://linkedin.com/in/username"
          />
        </div>

        <div>
          <Label htmlFor="currentStatus">Current Status</Label>
          <Select
            value={profileData.currentStatus || "available"}
            onValueChange={(value) => onInputChange("currentStatus", value)}
            disabled={!isEditing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="checking">Checking</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="away">Away</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Skills Selection */}
        <div className="space-y-2">
          <Label>Skills</Label>
          {selectedSkillIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSkillIds
                .map((id) => allSkills.find((s) => s.id === id)?.name)
                .filter(Boolean)
                .map((name) => (
                  <span key={String(name)} className="px-3 py-1 text-xs rounded-full bg-black text-white">
                    {name}
                  </span>
                ))}
            </div>
          )}
          {isEditing && (
            <>
              <Input
                value={skillsSearch}
                onChange={(e) => setSkillsSearch(e.target.value)}
                placeholder="Search skills..."
              />
              <div className="mt-2 max-h-48 overflow-auto rounded border p-2 space-y-1">
                {skillsLoading ? (
                  <div className="text-xs text-gray-500">Loading...</div>
                ) : filteredSkills.length === 0 ? (
                  <div className="text-xs text-gray-500">No skills found</div>
                ) : (
                  filteredSkills.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedSkillIds.includes(s.id)}
                        onChange={() => toggleSkill(s.id)}
                      />
                      <span className="flex-1 truncate">{s.name}</span>
                      {s.category ? (
                        <span className="text-xs text-gray-500">{s.category}</span>
                      ) : null}
                    </label>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
