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
      <Card className={className}>
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
    <Card className={className}>
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
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                notification.isRead 
                  ? "bg-white hover:bg-gray-50" 
                  : getNotificationColor(notification.type)
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  markAsRead([notification.id]);
                }
                if (notification.type === "service_posted" && notification.metadata?.serviceId) {
                  // Navigate to services page and open overlay
                  const sid = encodeURIComponent(notification.metadata.serviceId);
                  router.push(`/services?serviceId=${sid}`);
                }
              }}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={notification.developer.photoUrl || notification.developer.image} 
                />
                <AvatarFallback className="text-xs">
                  {notification.developer.name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <h4 className={`text-sm font-medium ${
                    notification.isRead ? "text-gray-700" : "text-gray-900"
                  }`}>
                    {notification.title}
                  </h4>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                
                <p className={`text-sm ${
                  notification.isRead ? "text-gray-500" : "text-gray-700"
                }`}>
                  {notification.message}
                </p>
                
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
