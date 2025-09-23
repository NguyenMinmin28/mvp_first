"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface FollowNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: any;
  isRead: boolean;
  createdAt: string;
  developer: {
    id: string;
    name: string;
    image?: string;
    photoUrl?: string;
  };
}

interface FollowNotificationsProps {
  className?: string;
}

export function FollowNotifications({ className = "" }: FollowNotificationsProps) {
  const [notifications, setNotifications] = useState<FollowNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/user/follow-notifications?limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching follow notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    setIsMarkingRead(true);
    try {
      const response = await fetch("/api/user/follow-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "read",
          ids: notificationIds,
        }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(notif => !notif.isRead)
      .map(notif => notif.id);
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "portfolio_update":
        return "🎨";
      case "review_received":
        return "⭐";
      case "availability_change":
        return "🔄";
      case "idea_posted":
        return "💡";
      case "service_posted":
        return "🧩";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "portfolio_update":
        return "bg-blue-50 border-blue-200";
      case "review_received":
        return "bg-yellow-50 border-yellow-200";
      case "availability_change":
        return "bg-green-50 border-green-200";
      case "idea_posted":
        return "bg-purple-50 border-purple-200";
      case "service_posted":
        return "bg-rose-50 border-rose-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Follow Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className={`w-full max-w-2xl ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg">Follow Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>No updates yet</p>
            <p className="text-sm">Follow developers to get notified about their updates</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg">Follow Updates</CardTitle>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={isMarkingRead}
              className="text-xs h-6 px-2"
            >
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative flex items-start space-x-4 p-5 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                notification.isRead 
                  ? "bg-gray-50 hover:bg-gray-100" 
                  : "bg-white shadow-sm border border-gray-200 hover:shadow-md"
              }`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead([notification.id]);
                  }
                  if (notification.type === "service_posted" && notification.metadata?.developerProfileId) {
                    // Navigate to services page and trigger fake click to open the service
                    router.push(`/services`);
                    // Dispatch event to open service overlay for this developer
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("open-developer-service", {
                        detail: { developerId: notification.metadata.developerProfileId, serviceId: notification.metadata.serviceId }
                      }));
                    }, 100);
                  }
                }}
            >
              {/* Avatar */}
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage 
                  src={notification.developer.photoUrl || notification.developer.image} 
                />
                <AvatarFallback className="text-sm font-medium bg-blue-100 text-blue-700">
                  {notification.developer.name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title and timestamp row */}
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-semibold ${
                    notification.isRead ? "text-gray-600" : "text-gray-900"
                  }`}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                {/* Message */}
                <p className={`text-sm leading-relaxed ${
                  notification.isRead ? "text-gray-500" : "text-gray-700"
                }`}>
                  {notification.message}
                </p>
              </div>

              {/* Dismiss button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead([notification.id]);
                }}
                className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Unread indicator */}
              {!notification.isRead && (
                <div className="absolute top-3 left-3 w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
