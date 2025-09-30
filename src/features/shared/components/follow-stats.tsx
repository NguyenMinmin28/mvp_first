"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/components/button";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface FollowStatsProps {
  developerId: string;
  developerName: string;
  isClient?: boolean;
  showFollowButton?: boolean;
  className?: string;
}

export function FollowStats({ 
  developerId, 
  developerName, 
  isClient = false, 
  showFollowButton = true,
  className = "" 
}: FollowStatsProps) {
  const { data: session } = useSession();
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (isClient || session?.user?.role === "DEVELOPER") {
      fetchFollowStatus();
    } else {
      fetchFollowersCount();
    }
  }, [developerId, isClient, session?.user?.role]);

  const fetchFollowStatus = async () => {
    try {
      const response = await fetch(`/api/user/follow?developerId=${developerId}`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Error fetching follow status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowersCount = async () => {
    try {
      const response = await fetch(`/api/user/follow?developerId=${developerId}`);
      if (response.ok) {
        const data = await response.json();
        setFollowersCount(data.followersCount || 0);
      }
    } catch (error) {
      console.error("Error fetching followers count:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      const action = isFollowing ? "unfollow" : "follow";
      const response = await fetch("/api/user/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          developerId,
          action,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        toast.success(data.message);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update follow status");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        {showFollowButton && isClient && (
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Followers Count */}
      <div className="flex items-center space-x-1 text-sm text-gray-600">
        <span className="font-medium">{followersCount}</span>
        <span>{followersCount === 1 ? "follower" : "followers"}</span>
      </div>

      {/* Follow Button (for clients and developers) */}
      {showFollowButton && (isClient || session?.user?.role === "DEVELOPER") && (
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={handleFollowToggle}
          disabled={isToggling}
          className={`h-8 px-3 text-xs ${
            isFollowing 
              ? "border-gray-300 text-gray-700 hover:bg-gray-50" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isToggling ? "..." : isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
