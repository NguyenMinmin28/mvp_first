"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Textarea } from "@/ui/components/textarea";
import { Label } from "@/ui/components/label";
import { Badge } from "@/ui/components/badge";
import { X, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface Idea {
  id: string;
  title: string;
  summary: string;
  body: string | null;
  coverUrl: string | null;
  cover?: {
    id: string;
    storageKey: string;
  } | null;
  skills: { 
    Skill: { 
      id: string; 
      name: string; 
      category: string; 
    } 
  }[];
}

interface EditIdeaFormProps {
  idea: Idea;
}

export function EditIdeaForm({ idea }: EditIdeaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedSkillsData, setSelectedSkillsData] = useState<Skill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize form data with idea data
  const getCoverUrl = () => {
    if (idea.coverUrl) return idea.coverUrl;
    if (idea.cover?.storageKey) return `/api/files/${idea.cover.storageKey}`;
    return "";
  };

  const [formData, setFormData] = useState({
    title: idea.title || "",
    summary: idea.summary || "",
    body: idea.body || "",
    coverUrl: getCoverUrl(),
  });

  // Initialize selected skills from idea
  useEffect(() => {
    if (idea.skills && idea.skills.length > 0) {
      const skillIds = idea.skills.map(s => s.Skill.id);
      const skillData = idea.skills.map(s => ({
        id: s.Skill.id,
        name: s.Skill.name,
        category: s.Skill.category,
      }));
      setSelectedSkills(skillIds);
      setSelectedSkillsData(skillData);
    }
  }, [idea]);

  useEffect(() => {
    fetchSkills();
  }, []);

  // Search skills with pagination
  useEffect(() => {
    const searchSkills = async () => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/skills/all?search=${encodeURIComponent(searchTerm)}&limit=20&page=${currentPage}`);
          if (response.ok) {
            const data = await response.json();
            setFilteredSkills(data.skills);
            setTotalPages(Math.ceil(data.total / 20));
          }
        } catch (error) {
          console.error('Error searching skills:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setFilteredSkills([]);
        setTotalPages(1);
      }
    };

    const timeoutId = setTimeout(searchSkills, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentPage]);

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills/all');
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.summary.trim()) {
      toast.error("Title and summary are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/user/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          summary: formData.summary,
          body: formData.body,
          coverUrl: formData.coverUrl,
          skillIds: selectedSkills,
        }),
      });

      if (response.ok) {
        toast.success('Idea updated successfully!');
        // Force hard refresh to show updated image
        router.push(`/ideas/${idea.id}`);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(error?.error || 'Failed to update idea');
      }
    } catch (error) {
      console.error('Error updating idea:', error);
      toast.error('Failed to update idea. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSelect = (skillId: string) => {
    if (!selectedSkills.includes(skillId)) {
      // Find the skill data from either filteredSkills or skills
      const skillData = filteredSkills.find(s => s.id === skillId) || skills.find(s => s.id === skillId);
      
      if (skillData) {
        setSelectedSkills([...selectedSkills, skillId]);
        setSelectedSkillsData([...selectedSkillsData, skillData]);
      }
    }
    setSearchTerm("");
  };

  const handleSkillRemove = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter(id => id !== skillId));
    setSelectedSkillsData(selectedSkillsData.filter(skill => skill.id !== skillId));
  };

  const getSelectedSkillNames = () => {
    return selectedSkillsData.map(skill => skill.name);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/ideas/${idea.id}`)}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">Edit Your Idea</h2>
        </div>
        <p className="text-gray-600">
          Update your idea details. Make it clear, compelling, and actionable.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="A clear, concise title for your idea"
            maxLength={100}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.title.length}/100 characters
          </p>
        </div>

        {/* Summary */}
        <div>
          <Label htmlFor="summary">Summary *</Label>
          <Textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="A brief description that captures the essence of your idea"
            maxLength={200}
            rows={3}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.summary.length}/200 characters
          </p>
        </div>

        {/* Cover Image Upload */}
        <ImageUpload
          value={formData.coverUrl}
          onChange={(url) => setFormData({ ...formData, coverUrl: url })}
          disabled={loading}
          label="Cover Image (Optional)"
          placeholder="Upload an image or paste a URL to represent your idea"
          maxSize={10}
          folder="ideas"
        />

        {/* Skills */}
        <div>
          <Label>Skills & Categories</Label>
          <div className="space-y-3">
            {/* Selected Skills */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getSelectedSkillNames().map((skillName, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skillName}
                    <button
                      type="button"
                      onClick={() => handleSkillRemove(selectedSkills[index])}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Skills Search */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search skills..."
                  className="pr-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              {/* Search Results */}
              {filteredSkills.length > 0 && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleSkillSelect(skill.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-sm text-gray-500">{skill.category}</div>
                    </button>
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-sm bg-white border rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-sm bg-white border rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No Results */}
              {searchTerm && filteredSkills.length === 0 && !isSearching && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No skills found for "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div>
          <Label htmlFor="body">Detailed Description (Optional)</Label>
          <Textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="Provide more details about your idea, implementation approach, or any other relevant information"
            rows={6}
          />
          <p className="text-sm text-gray-500 mt-1">
            Optional: Add more context, technical details, or implementation notes
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Idea"
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/ideas/${idea.id}`)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>

        {/* Terms */}
        <div className="text-xs text-gray-500 text-center">
          By updating this idea, you agree that it will be publicly visible and may be used by the community.
          Do not submit confidential or proprietary information.
        </div>
      </form>
    </div>
  );
}

