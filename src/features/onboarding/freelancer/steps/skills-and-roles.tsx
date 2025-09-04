"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { Badge } from "@/ui/components/badge";
import { X } from "lucide-react";

export default function SkillsAndRolesStep() {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
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
    // TODO: Persist to backend when API is ready
    console.log({ skills, roles, experience, bio });

    // Navigate to next step
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
            <div className="flex gap-2">
              <Input
                id="skills"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g., React, Node.js, Python"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                Add
              </Button>
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
            <Label htmlFor="roles">Roles</Label>
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

          {/* Experience Section */}
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g., 3"
              min="0"
            />
          </div>

          {/* Bio Section */}
          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself and your experience..."
              rows={4}
            />
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/onboarding/freelancer/basic-information") }>
              Back
            </Button>
            <Button type="submit">
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
