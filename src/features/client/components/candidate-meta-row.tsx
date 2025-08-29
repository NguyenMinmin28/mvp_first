"use client";

import React from "react";

interface SkillItem {
  skill: { name: string };
  years: number;
}

interface Developer {
  skills: SkillItem[];
  [key: string]: any;
}

interface FreelancerLike {
  developer: Developer;
  usualResponseTimeMsSnapshot: number;
}

interface CandidateMetaRowProps {
  freelancer: FreelancerLike;
  projectData?: any;
  projectSkillNames?: string[]; // normalized names from parent if available
}

function normalize(str: string) {
  return str.toLowerCase().trim();
}

function deriveSkillMatch(
  freelancer: FreelancerLike,
  projectData?: any,
  projectSkillNames?: string[]
): string {
  try {
    const projectSkillsRaw: string[] = (projectSkillNames && projectSkillNames.length
      ? projectSkillNames
      : (projectData?.skills || projectData?.skillsRequired || [])
          .map((s: any) => (typeof s === "string" ? s : s?.skill?.name || s?.name))
    ) as string[];

    const projectSkills = Array.from(new Set(projectSkillsRaw.filter(Boolean).map(normalize)));
    const devSkills = Array.from(
      new Set(freelancer.developer.skills.map((s) => normalize(s.skill.name)))
    );
    if (!projectSkills.length || !devSkills.length) return "N/A";
    const matched = projectSkills.filter((s) => devSkills.includes(s));
    return `${matched.length}/${projectSkills.length}`;
  } catch {
    return "N/A";
  }
}

export default function CandidateMetaRow({ freelancer, projectData, projectSkillNames }: CandidateMetaRowProps) {
  const location = (freelancer.developer as any).location || "N/A";
  const exp = typeof (freelancer.developer as any).experienceYears === "number"
    ? `${(freelancer.developer as any).experienceYears} Years+`
    : "N/A";
  const match = deriveSkillMatch(freelancer, projectData, projectSkillNames);
  const responseMins = Math.round((freelancer.usualResponseTimeMsSnapshot || 0) / 1000 / 60) || 0;
  const price = typeof (freelancer.developer as any).hourlyRateUsd === "number"
    ? `$${(freelancer.developer as any).hourlyRateUsd}/hr`
    : "N/A";

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {/* Location aligned under avatar column by leaving first cell as Location */}
        <div className="space-y-0.5">
          <div className="text-gray-500 text-base lg:text-lg">Location</div>
          <div className="font-semibold text-lg lg:text-2xl">{location}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-gray-500 text-base lg:text-lg">Experience</div>
          <div className="font-semibold text-lg lg:text-2xl">{exp}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-gray-500 text-base lg:text-lg">Skill Match</div>
          <div className="font-semibold text-lg lg:text-2xl">{match}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-gray-500 text-base lg:text-lg">Response time</div>
          <div className="font-semibold text-lg lg:text-2xl">{responseMins} min</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-gray-500 text-base lg:text-lg">Price</div>
          <div className="font-semibold text-lg lg:text-2xl">{price}</div>
        </div>
      </div>
    </div>
  );
}


