"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Badge } from "@/ui/components/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/components/dropdown-menu";
import { Button } from "@/ui/components/button";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { ChevronDown, Star, MessageSquare } from "lucide-react";
import { Checkbox } from "@/ui/components/checkbox";
import DeveloperReviewModal from "@/features/client/components/developer-review-modal";

interface ProfileSummaryProps {
  profile: any;
  hideControls?: boolean;
  developerId?: string;
  onReviewSubmitted?: () => void;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export default function ProfileSummary({ profile, hideControls = false, developerId, onReviewSubmitted }: ProfileSummaryProps) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [name, setName] = useState<string>(profile?.name || "");
  const [location, setLocation] = useState<string>(profile?.location || "");
  const [experienceYears, setExperienceYears] = useState<number | string>(profile?.experienceYears ?? "");
  const [photoUrl, setPhotoUrl] = useState<string>(profile?.photoUrl || profile?.image || "");
  const [status, setStatus] = useState<string>(profile?.currentStatus || "available");
  const [isSaving, setIsSaving] = useState(false);
  const [age, setAge] = useState<string>((profile as any)?.age || "");
  const [hourlyRate, setHourlyRate] = useState<string>((profile as any)?.hourlyRate?.toString?.() || "");
  const [attachment, setAttachment] = useState<string>(Array.isArray((profile as any)?.portfolioLinks) ? (profile as any).portfolioLinks[0] || "" : "");
  const [allSkills, setAllSkills] = useState<Array<{ id: string; name: string; category?: string }>>([]);
  const [skillsLoading, setSkillsLoading] = useState<boolean>(false);
  const [skillsSearch, setSkillsSearch] = useState<string>("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    Array.isArray(profile?.skills) ? profile.skills.map((s: any) => s.skillId) : []
  );
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 });
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-3 h-3 fill-yellow-400 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-3 h-3 text-gray-300" />);
    }
    
    return stars;
  };

  // Fetch review statistics
  const fetchReviewStats = async () => {
    try {
      // If developerId is provided, fetch stats for that specific developer
      // Otherwise, fetch stats for current user
      const endpoint = developerId 
        ? `/api/developer/${developerId}/review-stats`
        : "/api/user/review-stats";
      
      const response = await fetch(endpoint, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setReviewStats(data);
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };

  // Handle review submission and refresh stats
  const handleReviewSubmitted = () => {
    // Refresh review statistics
    fetchReviewStats();
    // Notify parent component if callback provided
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  const submitStatus = async (newStatus: "available" | "busy") => {
    try {
      setStatus(newStatus);
      await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStatus: newStatus }),
      });
      try {
        const logsRaw = localStorage.getItem("presenceLogs");
        const logs = logsRaw ? JSON.parse(logsRaw) : [];
        const next = Array.isArray(logs) ? logs : [];
        next.unshift({ status: newStatus, at: new Date().toISOString() });
        localStorage.setItem("presenceLogs", JSON.stringify(next.slice(0, 50)));
        window.dispatchEvent(new Event("presence-log-updated"));
      } catch {}
    } catch {}
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          photoUrl,
          experienceYears: Number(experienceYears) || 0,
          location,
          // These may be ignored by backend if not supported; harmless to send
          age,
          hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
          portfolioLinks: attachment ? [attachment] : undefined,
          skillIds: selectedSkillIds,
        }),
      });
      if (res.ok) {
        // Reload minimal user data used in this card
        const me = await fetch("/api/user/me", { cache: "no-store" });
        if (me.ok) {
          const data = await me.json();
          // update fields locally so UI reflects immediately
          setName(data.user?.name || name);
          setPhotoUrl(data.user?.photoUrl || photoUrl);
          setLocation(data.user?.location || location);
          setAge((data.user as any)?.age || age);
          setExperienceYears(((data.user as any)?.experienceYears ?? experienceYears) as any);
          setHourlyRate(((data.user as any)?.hourlyRate ?? hourlyRate) as any);
          setAttachment((data.user as any)?.portfolioLinks?.[0] || attachment);
          if (Array.isArray((data.user as any)?.skills)) {
            setSelectedSkillIds((data.user as any).skills.map((s: any) => s.skillId));
          }
        }
        setOpenEdit(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch review stats on component mount and when developerId changes
  useEffect(() => {
    fetchReviewStats();
  }, [developerId]);

  useEffect(() => {
    if (!openEdit) return;
    let active = true;
    const fetchSkills = async () => {
      try {
        setSkillsLoading(true);
        const qs = skillsSearch ? `?search=${encodeURIComponent(skillsSearch)}` : "";
        const resp = await fetch(`/api/skills${qs}`, { cache: "no-store" });
        if (!resp.ok) return;
        const data = await resp.json();
        if (active) setAllSkills(Array.isArray(data.skills) ? data.skills : []);
      } finally {
        setSkillsLoading(false);
      }
    };
    fetchSkills();
    return () => {
      active = false;
    };
  }, [openEdit, skillsSearch]);

  const filteredSkills = useMemo(() => {
    if (!skillsSearch) return allSkills;
    const q = skillsSearch.toLowerCase();
    return allSkills.filter((s) => s.name.toLowerCase().includes(q));
  }, [allSkills, skillsSearch]);

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const displaySkillNames = useMemo(() => {
    if (Array.isArray(profile?.skills) && profile.skills.length > 0) {
      return profile.skills.map((s: any) => s.skillName);
    }
    if (selectedSkillIds.length > 0 && allSkills.length > 0) {
      return selectedSkillIds
        .map((id) => allSkills.find((s) => s.id === id)?.name)
        .filter(Boolean) as string[];
    }
    return [] as string[];
  }, [profile?.skills, selectedSkillIds, allSkills]);
  return (
    <>
    <Card>
      <CardHeader className="px-4 pt-2 pb-1 md:pl-[320px]">
        <div className="flex items-center justify-between relative z-10">
          {/* Left: name on first line, email on second line */}
          <div className="h-10 md:h-12 flex flex-col justify-center min-w-0">
            <span className="truncate font-semibold text-sm md:text-base leading-tight">{name || profile?.name}</span>
            <span className="truncate text-xs md:text-[13px] text-gray-600 leading-tight">{profile?.email}</span>
          </div>
          {!hideControls && !developerId ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-black text-white h-10 md:h-12 px-4 rounded-md flex items-center gap-2">
                    {status || "available"}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => submitStatus("available")}>Available</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => submitStatus("busy")}>busy</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-black text-white h-10 md:h-12 px-4 rounded-md flex items-center gap-2">
                    Action
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push("/profile")}>Edit profile</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge className="text-xs capitalize bg-gray-100 text-gray-800">
                {status || profile?.currentStatus || "available"}
              </Badge>
              {profile?.adminApprovalStatus && (
                <Badge className="text-xs capitalize">
                  {String(profile.adminApprovalStatus).toLowerCase()}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left: Large square avatar filling card height visually */}
          <div className="lg:w-[280px] w-full lg:max-w-[300px] mt-2 sm:-mt-6 lg:-mt-10">
            <Avatar className="w-full h-48 sm:h-64 lg:h-72 xl:h-80 rounded-md">
              <AvatarImage src={(photoUrl || profile?.photoUrl || profile?.image) || undefined} />
              <AvatarFallback>{(name || profile?.name || "").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>

          {/* Right: Personal info */}
          <div className="flex-1">
            <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-sm">
              <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-center gap-1.5">
                <div className="text-gray-500 text-xs sm:text-sm">Address: </div>
                <div className="flex flex-col sm:flex-row sm:items-center min-w-0 gap-1 sm:gap-0">
                  <span className="font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">{profile?.location || ""}</span>
                  <span className="flex-1" />
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-gray-500 text-xs sm:text-sm">My review:</span>
                    <div className="flex items-center gap-1">
                      {renderStars(reviewStats.averageRating)}
                    </div>
                    <span className="text-gray-600 text-xs sm:text-sm">
                      ({reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''})
                    </span>
                    {!hideControls && developerId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 h-6 px-2 text-xs"
                        onClick={() => setShowReviewModal(true)}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                    )}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-center gap-1.5">
                <div className="text-gray-500 text-xs sm:text-sm">Age: </div>
                <div className="flex flex-col sm:flex-row sm:items-center min-w-0 gap-1 sm:gap-0">
                  <span className="font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">{(profile as any)?.age || ""}</span>
                  <span className="flex-1" />
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-gray-500 text-xs sm:text-sm">Hourly rate:</span>
                    <span className="font-bold text-xs sm:text-sm">{(profile as any)?.hourlyRate ? `$${(profile as any).hourlyRate}` : ""}</span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-center gap-1.5">
                <div className="text-gray-500 text-xs sm:text-sm">Email: </div>
                <div className="font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">{profile?.email || ""}</div>
              </div>
              <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-center gap-1.5">
                <div className="text-gray-500 text-xs sm:text-sm">Approve: </div>
                <div className="font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">{(profile as any)?.adminApprovalStatus || ""}</div>
              </div>
              <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-start gap-1.5">
                <div className="text-gray-500 text-xs sm:text-sm">Skills: </div>
                <div className="font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                  {displaySkillNames.length > 0 ? displaySkillNames.join(", ") : ""}
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-center gap-1.5">
                <div className="text-gray-500 text-xs sm:text-sm">Attachment: </div>
                <div className="font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                  {Array.isArray((profile as any)?.portfolioLinks) && (profile as any).portfolioLinks.length > 0 ? (
                    <a href={(profile as any).portfolioLinks[0]} target="_blank" rel="noreferrer" className="underline text-blue-600 break-all">
                      {(profile as any).portfolioLinks[0]}
                    </a>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    <Dialog open={openEdit} onOpenChange={setOpenEdit}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="text-sm mb-1">Full name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <div className="text-sm mb-1">Avatar URL</div>
            <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
            <div className="mt-2 flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={photoUrl || undefined} />
                <AvatarFallback>AV</AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-500">Preview</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm mb-1">Address</div>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <div className="text-sm mb-1">Age</div>
              <Input value={(age as any) || ""} onChange={(e) => setAge(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm mb-1">Experience (years)</div>
              <Input type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
            </div>
            <div>
              <div className="text-sm mb-1">Hourly rate ($)</div>
              <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="text-sm mb-1">Skills</div>
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
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedSkillIds.includes(s.id)}
                      onCheckedChange={() => toggleSkill(s.id)}
                    />
                    <span className="flex-1 truncate">{s.name}</span>
                    {s.category ? (
                      <span className="text-xs text-gray-500">{s.category}</span>
                    ) : null}
                  </label>
                ))
              )}
            </div>
            {selectedSkillIds.length > 0 ? (
              <div className="mt-2 text-sm font-medium">
                {selectedSkillIds
                  .map((id) => allSkills.find((s) => s.id === id)?.name)
                  .filter(Boolean)
                  .join(", ")}
              </div>
            ) : null}
          </div>
          <div>
            <div className="text-sm mb-1">Attachment URL</div>
            <Input value={attachment} onChange={(e) => setAttachment(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-black text-white">{isSaving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Developer Review Modal */}
    {showReviewModal && developerId && !hideControls && (
      <DeveloperReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        developerId={developerId}
        developerName={profile?.name || "Developer"}
        onReviewSubmitted={handleReviewSubmitted}
      />
    )}
    </>
  );
}


