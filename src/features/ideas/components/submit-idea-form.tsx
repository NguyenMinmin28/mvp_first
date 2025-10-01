"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Textarea } from "@/ui/components/textarea";
import { Label } from "@/ui/components/label";
import { Badge } from "@/ui/components/badge";
import { X, Plus, Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { ImageUpload } from "./image-upload";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface SubmitIdeaFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubmitIdeaForm({ onSuccess, onCancel }: SubmitIdeaFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedSkillsData, setSelectedSkillsData] = useState<Skill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    body: "",
    coverUrl: "",
  });

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
        console.log('Fetched skills:', data.skills.length);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra user đã đăng nhập chưa
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    
    if (!formData.title.trim() || !formData.summary.trim()) {
      alert("Title and summary are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          skillIds: selectedSkills,
        }),
      });

      if (response.ok) {
        const idea = await response.json();
        console.log('Idea submitted successfully:', idea);
        toast.success('Idea submitted! Awaiting admin approval.');
        // Stay on page. Reset form for a clear UX.
        setFormData({ title: "", summary: "", body: "", coverUrl: "" });
        setSelectedSkills([]);
        setSelectedSkillsData([]);
        if (onSuccess) onSuccess();
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(error?.error || 'Failed to submit idea');
      }
    } catch (error) {
      console.error('Error submitting idea:', error);
      toast.error('Failed to submit idea. Please try again.');
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Your Idea</h2>
        <p className="text-gray-600">
          Share your innovative idea with the community. Make it clear, compelling, and actionable.
        </p>
        
        {/* Login Status */}
        {!session?.user && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <LogIn className="w-4 h-4" />
              <span className="text-sm font-medium">
                You need to login to submit idea
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Please login or create a new account to share your idea
            </p>
          </div>
        )}
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
            disabled={loading || status === "loading"}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : !session?.user ? (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Đăng nhập để Submit
              </>
            ) : (
              "Submit Idea"
            )}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Terms */}
        <div className="text-xs text-gray-500 text-center">
          By submitting this idea, you agree that it will be publicly visible and may be used by the community.
          Do not submit confidential or proprietary information.
        </div>
      </form>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <LogIn className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Login to continue
              </h3>
              <p className="text-gray-600">
                You need to login to submit idea. Please login or create a new account.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                Đăng nhập
              </Button>
              
              <Button
                onClick={() => router.push('/auth/signup')}
                variant="outline"
                className="w-full"
              >
                Tạo tài khoản mới
              </Button>
              
              <Button
                onClick={() => setShowLoginModal(false)}
                variant="ghost"
                className="w-full"
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
