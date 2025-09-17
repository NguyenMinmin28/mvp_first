"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import SearchAndFilter from "@/features/client/components/SearchAndFilter";

export default function ServicesPageContent() {
  const { data: session } = useSession();
  const isDeveloper = session?.user?.role === "DEVELOPER";

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Browse Talent, Contact Direct
              </h1>
            </div>
            
            {isDeveloper && (
              <Link href="/services/create">
                <Button 
                  variant="outline" 
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Project
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <SearchAndFilter />
      </div>
    </div>
  );
}
