"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { 
  FileText,
  Star,
  Calendar,
  Eye,
  MessageSquare
} from "lucide-react";
import Image from "next/image";

interface Project {
  id: string;
  name: string;
  status: "recent" | "in_progress" | "completed";
  date: string;
  logo?: string;
}

export default function ProjectActivity() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        // No fallback data - show empty state
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecentProjects = () => projects.slice(0, 1); // Only the first project
  const getInProgressProjects = () => projects.slice(1).filter(p => p.status === "in_progress"); // Exclude first project
  const getCompletedProjects = () => projects.slice(1).filter(p => p.status === "completed"); // Exclude first project

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Project Activity
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No projects yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Start by creating your first project to see activity here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Project Activity
      </h2>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Most Recent Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Most recent</h3>
              {getRecentProjects().length > 0 ? (
                <>
                  {/* First project with large logo */}
                  {getRecentProjects().slice(0, 1).map((project) => (
                    <div key={project.id} className="flex flex-col items-center text-center space-y-8">
                      <div className="relative">
                        <div className="w-64 h-64 rounded-full flex items-center justify-center relative overflow-hidden">
                          <Image
                            src="/images/about/logo.png"
                            alt="Project Logo"
                            width={256}
                            height={256}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="w-full">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-xl mb-3">
                          {project.name}
                        </h4>
                        <div className="flex flex-col items-center space-y-3">
                          <span className="text-base text-gray-500">{project.date}</span>
                          <Button variant="outline" size="sm" className="text-gray-500 border-gray-300">
                            <Eye className="h-3 w-3 mr-1" />
                            See Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Other projects in list format */}
                  {getRecentProjects().slice(1).map((project) => (
                    <div key={project.id} className="flex items-start gap-3">
                      <div className="flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {project.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-500">{project.date}</span>
                          <Button variant="outline" size="sm" className="text-gray-500 border-gray-300">
                            <Eye className="h-3 w-3 mr-1" />
                            See Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No recent projects</p>
                </div>
              )}
            </div>

            {/* In Progress Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">In Progress</h3>
              {getInProgressProjects().length > 0 ? (
                getInProgressProjects().slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-start gap-3">
                    <div className="flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-500">
                          {project.date} In progress
                        </span>
                        <Button variant="outline" size="sm" className="text-gray-500 border-gray-300">
                          <Eye className="h-3 w-3 mr-1" />
                          See Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No projects in progress</p>
                </div>
              )}
            </div>

            {/* Completed Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Completed</h3>
              {getCompletedProjects().length > 0 ? (
                getCompletedProjects().slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-start gap-3">
                    <div className="flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-500">
                          {project.date} Completed
                        </span>
                        <Button variant="outline" size="sm" className="text-gray-500 border-gray-300">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Add Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No completed projects</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
