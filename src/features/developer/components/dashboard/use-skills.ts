"use client";

import { useEffect, useState } from "react";

interface Skill {
  id: string;
  name: string;
  category?: string;
}

interface UseSkillsResult {
  skills: Skill[];
  loading: boolean;
  getSkillName: (skillId: string) => string;
}

export function useSkills(): UseSkillsResult {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/skills", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setSkills(Array.isArray(data.skills) ? data.skills : []);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const getSkillName = (skillId: string): string => {
    if (!skillId || typeof skillId !== 'string') {
      return String(skillId || '');
    }
    
    // If it's already a short name (not an ID), return as is
    if (skillId.length <= 20 && !skillId.match(/^[a-f0-9]{24}$/i)) {
      return skillId;
    }
    
    // Try to find skill by ID
    const skill = skills.find(s => s.id === skillId || String(s.id) === String(skillId));
    return skill ? skill.name : skillId; // Fallback to ID if name not found
  };

  return { skills, loading, getSkillName };
}
