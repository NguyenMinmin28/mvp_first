"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { UserLayout } from "@/features/shared/components/user-layout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Heart,
  MessageCircle,
  User,
  Star,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  Phone
} from "lucide-react";
import Link from "next/link";
interface FavoriteDeveloper {
  id: string;
  name: string;
  email: string;
  image?: string;
  photoUrl?: string;
  location?: string;
  experienceYears: number;
  hourlyRateUsd?: number;
  level: "FRESHER" | "MID" | "EXPERT";
  currentStatus: "available" | "busy" | "away" | "offline";
  adminApprovalStatus: "draft" | "pending" | "approved" | "rejected";
  whatsappNumber?: string;
  skills: Array<{
    skillId: string;
    skillName: string;
  }>;
  averageRating: number;
  totalReviews: number;
  favoritedAt: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteDeveloper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/favorites');
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch favorites");
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setError("An error occurred while fetching favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (developerId: string) => {
    try {
      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ developerId }),
      });

      if (response.ok) {
        // Remove from local state
        setFavorites(prev => prev.filter(fav => fav.id !== developerId));
      } else {
        console.error('Failed to remove favorite');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleDeveloperClick = (developer: FavoriteDeveloper) => {
    router.push(`/developer/${developer.id}`);
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "busy": return "bg-red-100 text-red-800";
      case "away": return "bg-yellow-100 text-yellow-800";
      case "offline": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "EXPERT": return "bg-purple-100 text-purple-800";
      case "MID": return "bg-blue-100 text-blue-800";
      case "FRESHER": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchFavorites}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <UserLayout user={session?.user}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Favorite Developers</h1>
          <p className="text-gray-600">
            {favorites.length} developer{favorites.length !== 1 ? 's' : ''} in your favorites
          </p>
        </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-4">
              Start building your team by adding developers to your favorites from project assignments.
            </p>
            <Link href="/client-dashboard">
              <Button>Go to Projects</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((developer) => (
            <Card 
              key={developer.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleDeveloperClick(developer)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={developer.photoUrl || developer.image} />
                      <AvatarFallback>
                        {developer.name?.slice(0, 2).toUpperCase() || "DEV"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{developer.name}</h3>
                      <p className="text-sm text-gray-600">{developer.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(developer.id);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-150 active:scale-95"
                  >
                    <Heart className="h-4 w-4 fill-current transition-all duration-200 hover:scale-110" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Status and Level */}
                <div className="flex gap-2">
                  <Badge className={getStatusColor(developer.currentStatus)}>
                    {developer.currentStatus}
                  </Badge>
                  <Badge className={getLevelColor(developer.level)}>
                    {developer.level}
                  </Badge>
                </div>

                {/* Location and Experience */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {developer.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{developer.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{developer.experienceYears} years</span>
                  </div>
                </div>

                {/* Hourly Rate */}
                {developer.hourlyRateUsd && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>${developer.hourlyRateUsd}/hour</span>
                  </div>
                )}

                {/* Phone Number */}
                {developer.whatsappNumber && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{developer.whatsappNumber}</span>
                  </div>
                )}

                {/* Rating */}
                {developer.totalReviews > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{developer.averageRating.toFixed(1)}</span>
                    <span className="text-gray-600">({developer.totalReviews} reviews)</span>
                  </div>
                )}

                {/* Skills */}
                {developer.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {developer.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill.skillId} variant="secondary" className="text-xs">
                          {skill.skillName}
                        </Badge>
                      ))}
                      {developer.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{developer.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/developer/${developer.id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-sm">
                      <User className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="text-sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </UserLayout>
  );
}

