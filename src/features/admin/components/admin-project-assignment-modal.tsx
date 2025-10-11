"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { 
  Users, 
  Search, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Mail,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface Developer {
  id: string;
  name: string | null;
  email: string | null;
  level: "EXPERT" | "MID" | "FRESHER";
  currentStatus: string;
  usualResponseTimeMs: number;
  matchingSkills: Array<{
    name: string;
    years: number;
    category: string;
  }>;
  totalSkills: number;
  assignmentCount: number;
  skillMatchPercentage: number;
}

interface Project {
  id: string;
  title: string;
  skillsRequired: string[];
  status: string;
}

interface AdminProjectAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onAssignmentComplete: () => void;
}

export function AdminProjectAssignmentModal({
  isOpen,
  onClose,
  project,
  onAssignmentComplete,
}: AdminProjectAssignmentModalProps) {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [assignmentReason, setAssignmentReason] = useState("");

  useEffect(() => {
    if (isOpen && project) {
      fetchAvailableDevelopers();
    }
  }, [isOpen, project]);

  const fetchAvailableDevelopers = async () => {
    if (!project) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/available-developers`);
      if (response.ok) {
        const data = await response.json();
        setDevelopers(data.data.developers || []);
      } else {
        toast.error("Failed to load available developers");
      }
    } catch (error) {
      console.error("Error fetching developers:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignDeveloper = async () => {
    if (!selectedDeveloper || !project) return;

    setIsAssigning(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/assign-developer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          developerId: selectedDeveloper.id,
          reason: assignmentReason || "Manual assignment by admin",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully assigned ${selectedDeveloper.name} to project`);
        onAssignmentComplete();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to assign developer");
      }
    } catch (error) {
      console.error("Error assigning developer:", error);
      toast.error("Something went wrong");
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredDevelopers = developers.filter(dev =>
    dev.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dev.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dev.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case "EXPERT": return "bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium";
      case "MID": return "bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium";
      case "FRESHER": return "bg-gradient-to-r from-green-600 to-green-700 text-white font-medium";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "EXPERT": return <Star className="h-4 w-4" />;
      case "MID": return <Zap className="h-4 w-4" />;
      case "FRESHER": return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Developer to Project
          </DialogTitle>
          <DialogDescription>
            Select a developer to manually assign to "{project.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Project Details</h3>
            <p className="text-sm text-muted-foreground mb-2">{project.title}</p>
            <div className="flex flex-wrap gap-1">
              {project.skillsRequired.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search developers by name, email, or level..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Developers List */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredDevelopers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No developers found matching your search" : "No available developers found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {filteredDevelopers.length} developer(s) available
              </p>
              
              {filteredDevelopers.map((developer) => (
                <div
                  key={developer.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedDeveloper?.id === developer.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-border hover:border-blue-300"
                  }`}
                  onClick={() => setSelectedDeveloper(developer)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{developer.name}</h4>
                        <Badge className={getLevelColor(developer.level)}>
                          <div className="flex items-center gap-1">
                            {getLevelIcon(developer.level)}
                            {developer.level === 'EXPERT' ? 'EXPERT' : developer.level === 'MID' ? 'PRO' : 'STARTER'}
                          </div>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {developer.skillMatchPercentage}% match
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {developer.email}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          ~{Math.floor(developer.usualResponseTimeMs / 60000)}m response
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {developer.assignmentCount} assignments
                        </div>
                      </div>

                                             <div className="space-y-2">
                         <p className="text-sm font-medium">Skills:</p>
                         <div className="flex flex-wrap gap-1">
                           {developer.matchingSkills.length > 0 ? (
                             developer.matchingSkills.map((skill) => (
                               <Badge key={skill.name} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                 {skill.name} ({skill.years}y) ✓
                               </Badge>
                             ))
                           ) : (
                             <span className="text-xs text-yellow-600">No matching skills - admin assignment</span>
                           )}
                         </div>
                         {developer.matchingSkills.length > 0 && (
                           <p className="text-xs text-muted-foreground">
                             {developer.skillMatchPercentage}% match with project requirements
                           </p>
                         )}
                       </div>
                    </div>

                    {selectedDeveloper?.id === developer.id && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assignment Reason */}
          {selectedDeveloper && (
            <div className="space-y-2">
              <Label htmlFor="reason">Assignment Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you're assigning this developer (e.g., client request, long wait time, specific expertise needed)..."
                value={assignmentReason}
                onChange={(e) => setAssignmentReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignDeveloper}
              disabled={!selectedDeveloper || isAssigning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAssigning ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign Developer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
