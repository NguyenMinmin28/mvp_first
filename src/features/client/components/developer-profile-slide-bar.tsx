"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { X, Star, MapPin, Clock, DollarSign, MessageCircle, Heart, ExternalLink, User, Briefcase, GraduationCap, Code, Award, Calendar, Globe } from "lucide-react";
import { GetInTouchButton } from "@/features/shared/components/get-in-touch-button";

interface DeveloperProfileSlideBarProps {
  isOpen: boolean;
  onClose: () => void;
  developerId: string;
  developerName?: string;
  useOriginalDesign?: boolean;
}

interface DeveloperProfile {
  id: string;
  name: string;
  image?: string;
  location?: string;
  bio?: string;
  hourlyRateUsd?: number;
  level: string;
  experienceYears?: number;
  currentStatus: string;
  usualResponseTimeMs?: number;
  jobsCount: number;
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  skills: string[];
  portfolioLinks?: Array<{
    id: string;
    title: string;
    description?: string;
    url: string;
    imageUrl?: string;
  }>;
  workHistory?: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
  }>;
  languages?: Array<{
    id: string;
    language: string;
    proficiency: string;
  }>;
}

export function DeveloperProfileSlideBar({ 
  isOpen, 
  onClose, 
  developerId, 
  developerName,
  useOriginalDesign = false
}: DeveloperProfileSlideBarProps) {
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDeveloperProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      const res = await fetch(`/api/developer/${developerId}`, { cache: "no-store" });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching developer profile:", error);
    } finally {
      setLoading(false);
    }
  }, [developerId]);

  useEffect(() => {
    if (isOpen && developerId) {
      fetchDeveloperProfile();
    }
  }, [isOpen, developerId, fetchDeveloperProfile]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[60] pointer-events-${isOpen ? "auto" : "none"}`}
      aria-hidden={!isOpen}
    >
      {/* Mobile backdrop: darken entire screen */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-500 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Desktop backdrop: dim left 1/3, keep middle area clickable/transparent */}
      <div
        className={`fixed inset-y-0 left-0 w-1/3 bg-black/40 transition-opacity duration-500 hidden lg:block ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 left-1/3 right-2/3 bg-transparent hidden lg:block ${isOpen ? "block" : "hidden"}`}
        onClick={onClose}
      />

      {/* Sliding panel (responsive width) */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-5/6 lg:w-2/3 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full flex flex-col">
          {/* Mobile Close Button */}
          <button
            aria-label="Close"
            onClick={onClose}
            className="sm:hidden absolute top-3 right-3 z-30 p-2 rounded-full bg-white/90 border border-gray-200 shadow-md"
          >
            <X className="w-5 h-5 text-gray-900" />
          </button>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start px-4 sm:px-6 pt-6 lg:pt-10 pb-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-lg font-semibold">Developer Profile</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hidden sm:flex">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 animate-pulse" />
                </div>
              </div>
            ) : profile ? (
              <div className="h-full">
                {/* Profile Header */}
                <div className="p-6 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-b">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage 
                        src={profile.image || '/images/avata/default.jpeg'} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/avata/default.jpeg';
                        }}
                      />
                      <AvatarFallback className="bg-gray-200 w-full h-full flex items-center justify-center">
                        <img 
                          src="/images/avata/default.jpeg" 
                          alt="Default Avatar"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute right-0 bottom-0 inline-block w-5 h-5 rounded-full border-2 border-white ${
                        profile.currentStatus === 'available' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ zIndex: 10 }}
                    />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {profile.name || 'Unknown Developer'}
                  </h3>
                  
                  {profile.location && (
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{profile.reviews?.averageRating?.toFixed(1) || '0.0'}</span>
                      <span>({profile.reviews?.totalReviews || 0})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">${profile.hourlyRateUsd || 0}/h</span>
                    </div>
                  </div>

                  <Badge 
                    className={`mb-4 text-sm px-3 py-1 text-white font-medium ${
                      useOriginalDesign 
                        ? 'bg-gray-600' // Original design for services page
                        : profile.level === 'EXPERT' 
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 border-purple-600' 
                          : profile.level === 'MID' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600'
                          : 'bg-gradient-to-r from-green-600 to-green-700 border-green-600'
                    }`}
                  >
                    {useOriginalDesign ? 'PRO' : (profile.level === 'EXPERT' ? 'EXPERT' : profile.level === 'MID' ? 'PRO' : 'STARTER')}
                  </Badge>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center">
                    <GetInTouchButton
                      developerId={profile.id}
                      developerName={profile.name || 'Unknown Developer'}
                      className="flex-1 max-w-32"
                      variant="default"
                    />
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/developer/${profile.id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Full Profile
                    </Button>
                  </div>
                </div>

                {/* Tabs Content */}
                <Tabs defaultValue="overview" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
                    <TabsTrigger value="overview" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="text-xs">
                      <Code className="h-3 w-3 mr-1" />
                      Skills
                    </TabsTrigger>
                    <TabsTrigger value="portfolio" className="text-xs">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Portfolio
                    </TabsTrigger>
                    <TabsTrigger value="experience" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      Experience
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-y-auto">
                    <TabsContent value="overview" className="p-4 space-y-4">
                      {/* Bio */}
                      {profile.bio && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <User className="h-4 w-4" />
                              About
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Stats */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Statistics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">{profile.jobsCount || 0}</div>
                              <div className="text-xs text-gray-600">Jobs Completed</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {profile.experienceYears || 0}
                              </div>
                              <div className="text-xs text-gray-600">Years Experience</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Languages */}
                      {profile.languages && profile.languages.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Languages
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {profile.languages.map((lang) => (
                                <div key={lang.id} className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{lang.language}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {lang.proficiency}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="skills" className="p-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Technical Skills
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {(profile.skills || []).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="portfolio" className="p-4">
                      {profile.portfolioLinks && profile.portfolioLinks.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {profile.portfolioLinks.map((item) => (
                            <Card key={item.id} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300">
                              <CardContent className="p-0">
                                <div className="relative overflow-hidden">
                                  {item.imageUrl ? (
                                    <div className="aspect-video relative">
                                      <img 
                                        src={item.imageUrl} 
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                    </div>
                                  ) : (
                                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                                      <Briefcase className="h-12 w-12 text-gray-400" />
                                    </div>
                                  )}
                                  
                                  {/* Overlay with action button */}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Button 
                                      variant="default" 
                                      size="sm" 
                                      className="bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                                      asChild
                                    >
                                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Project
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-4">
                                  <h4 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1">
                                    {item.title}
                                  </h4>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                      {item.description}
                                    </p>
                                  )}
                                  
                                  {/* Tech stack or tags could go here */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Globe className="h-3 w-3 mr-1" />
                                      <span>Portfolio Project</span>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      asChild
                                    >
                                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Open
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="border-2 border-dashed border-gray-200">
                          <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Briefcase className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Portfolio Yet</h3>
                            <p className="text-gray-500 text-sm">This developer hasn't added any portfolio projects yet.</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="experience" className="p-4 space-y-4">
                      {/* Work History */}
                      {profile.workHistory && profile.workHistory.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              Work Experience
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {profile.workHistory.map((work) => (
                                <div key={work.id} className="border-l-2 border-blue-200 pl-4">
                                  <h4 className="font-medium text-gray-900">{work.position}</h4>
                                  <p className="text-sm text-gray-600">{work.company}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(work.startDate).toLocaleDateString()} - {work.endDate ? new Date(work.endDate).toLocaleDateString() : 'Present'}
                                  </p>
                                  {work.description && (
                                    <p className="text-sm text-gray-600 mt-2">{work.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Education */}
                      {profile.education && profile.education.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              Education
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {profile.education.map((edu) => (
                                <div key={edu.id} className="border-l-2 border-green-200 pl-4">
                                  <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                                  <p className="text-sm text-gray-600">{edu.field}</p>
                                  <p className="text-sm text-gray-600">{edu.institution}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(edu.startDate).toLocaleDateString()} - {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Certifications */}
                      {profile.certifications && profile.certifications.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              Certifications
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {profile.certifications.map((cert) => (
                                <div key={cert.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{cert.name}</h4>
                                    <p className="text-sm text-gray-600">{cert.issuer}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {new Date(cert.date).toLocaleDateString()}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Failed to load profile</p>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
