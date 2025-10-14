"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Textarea } from "@/ui/components/textarea";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  description: string;
  budgetMin?: number | null;
  currency?: string | null;
  skillsRequired?: string[];
  postedAt: Date;
  candidateCount: number;
}

interface MessageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (data: { message: string; title?: string; budget?: string; description?: string; selectedProjectId?: string }) => void;
  onBack?: () => void; // New prop for going back to contact options
  developerName?: string;
  projectId?: string;
}

export function MessageForm({ isOpen, onClose, onNext, onBack, developerName, projectId }: MessageFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ connectsPerMonth: number; connectsUsed: number; remaining: number } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Generate default message with project name and URL
  const generateDefaultMessage = (projectName?: string) => {
    const baseMessage = "Would you like to work on this project?";
    if (projectName) {
      return `${baseMessage} ${projectName}. Please check below project URL.`;
    }
    return `${baseMessage} Please check below project URL.`;
  };

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/billing/quotas', { cache: 'no-store' } as RequestInit);
      const json = await res.json();
      if (res.ok && json?.hasActiveSubscription) {
        const connectsPerMonth = json.quotas?.connectsPerMonth ?? 0;
        const connectsUsed = json.usage?.connectsUsed ?? 0;
        const remaining = json.remaining?.connects ?? Math.max(0, connectsPerMonth - connectsUsed);
        setQuotaInfo({ connectsPerMonth, connectsUsed, remaining });
      }
    } catch {}
  };

  const fetchProjects = async () => {
    if (projectId) return; // Don't fetch if we already have a projectId
    
    setLoadingProjects(true);
    try {
      console.log("🔍 Fetching projects for dropdown...");
      const res = await fetch('/api/client/projects', { cache: 'no-store' } as RequestInit);
      console.log("🔍 Response status:", res.status);
      const json = await res.json();
      console.log("🔍 Projects API response:", json);
      
      if (res.ok) {
        if (json?.projects) {
          setProjects(json.projects);
          console.log("✅ Projects set:", json.projects);
          console.log("✅ First project example:", json.projects[0]);
        } else {
          console.log("⚠️ No projects in response");
          setProjects([]);
        }
      } else {
        console.error("❌ Failed to fetch projects:", json);
        setProjects([]);
      }
    } catch (error) {
      console.error("❌ Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { console.log("[MessageForm] submit fired", { projectId }); } catch {}
    
    if (isSubmitting) return;
    
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (message.length > 300) {
      toast.error("Message must be 300 characters or less");
      return;
    }

    // For direct messages (no project), check quota first (only for Free users)
    if (!projectId) {
      await fetchQuota();
      if (quotaInfo && quotaInfo.connectsPerMonth < 999 && quotaInfo.remaining <= 0) {
        toast.error("You have no connects left. Upgrade your plan to continue contacting developers.");
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Call the onNext callback with simplified data
      onNext({
        message: message.trim(),
        selectedProjectId: selectedProjectId && selectedProjectId !== "none" ? selectedProjectId : undefined,
      });
    } catch (error) {
      console.error("Error submitting message:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open?: boolean) => {
    if (open === false && !isSubmitting) {
      setMessage("");
      setSelectedProjectId("none");
      onClose();
    }
  };

  // Set default message when modal opens
  useEffect(() => {
    if (isOpen) {
      if (projectId) {
        // For project-specific messages, use project name
        setMessage(generateDefaultMessage("this project"));
      } else {
        // For direct messages, set default message
        setMessage(generateDefaultMessage());
        // Fetch quota for direct messages
        fetchQuota();
      }
      
      // Fetch projects for direct messages
      if (!projectId) {
        fetchProjects();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md z-[70] [&>div]:z-[70]">
        <DialogHeader>
          <DialogTitle>Send Message to Developer</DialogTitle>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Developer Info - Always visible */}
          <div>
            <Label htmlFor="developer-name" className="text-sm font-medium text-gray-700">
              Developer
            </Label>
            <div className="mt-1 text-sm text-gray-900 font-medium">
              {developerName || "Developer"}
            </div>
          </div>

          {/* Project Selection - Only show for direct messages (no projectId) */}
          {!projectId && (
            <div>
              <Label htmlFor="project-select" className="text-sm font-medium text-gray-700">
                Select Project (Optional)
              </Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Choose a project to reference"} />
                </SelectTrigger>
                <SelectContent className="z-[100]" position="popper">
                  <SelectItem value="none">No project reference</SelectItem>
                  <SelectItem value="test1">Test Project 1</SelectItem>
                  <SelectItem value="test2">Test Project 2</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 mt-1">
                Selecting a project will help the developer understand the context of your message.
              </div>
            </div>
          )}

          {/* Message Input */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Message *
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the developer about your project requirements..."
              className="mt-1"
              rows={4}
              maxLength={300}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}/300 characters
            </div>
          </div>

          {/* Quota Info for direct messages - only show for Free users */}
          {!projectId && quotaInfo && quotaInfo.connectsPerMonth < 999 && (
            <div className="p-3 rounded-md border bg-amber-50 border-amber-200">
              <div className="text-sm font-semibold text-amber-800">
                This will cost 1 connect quota.
              </div>
              <div className="text-xs text-amber-700 mt-1">
                Free: 3 projects/month, 0 connects. Plus: 10 projects, 5 connects. Pro: Unlimited projects, 10 connects.
              </div>
              <div className="text-xs text-amber-800 mt-2">
                Remaining connects this month: <span className="font-semibold">{quotaInfo.remaining}</span> of {quotaInfo.connectsPerMonth}
              </div>
              {quotaInfo.remaining <= 0 && (
                <div className="text-xs text-red-600 mt-2">
                  You have no connects left. Upgrade your plan to continue contacting developers.
                </div>
              )}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/billing/quotas/add-connect', { method: 'POST' });
                        await fetchQuota();
                      } catch {}
                    }}
                    className="inline-flex items-center px-2 py-1 text-[11px] rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    title="Dev only: add 1 connect"
                  >
                    +1 Connect (dev)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between space-x-3 pt-4">
            <div>
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={
                  isSubmitting || !message.trim() || (!projectId && !!quotaInfo && quotaInfo.connectsPerMonth < 999 && quotaInfo.remaining <= 0)
                }
                className="bg-black text-white hover:bg-black/90"
              >
                {projectId
                  ? (isSubmitting ? "Sending..." : "Send Message")
                  : (!!quotaInfo && quotaInfo.connectsPerMonth < 999 && quotaInfo.remaining <= 0 
                      ? "No connects left" 
                      : (isSubmitting ? "Sending..." : "Send Message"))}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
