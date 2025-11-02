import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Check if Language model exists in Prisma client
    if (!prisma.language) {
      console.error("Language model not found in Prisma client. Please restart Next.js dev server.");
      // Fallback to hardcoded languages if model not available
      const fallbackLanguages = [
        "English",
        "Spanish",
        "French",
        "German",
        "Chinese (Mandarin)",
        "Japanese",
        "Korean",
        "Portuguese",
        "Italian",
        "Russian",
        "Arabic",
        "Hindi",
        "Dutch",
        "Polish",
        "Turkish",
        "Vietnamese",
        "Thai",
        "Indonesian",
        "Tagalog",
        "Swedish",
        "Norwegian",
        "Danish",
        "Finnish",
        "Greek",
        "Hebrew",
        "Czech",
        "Romanian",
        "Hungarian",
        "Malay",
        "Bengali",
      ];
      
      let filtered = fallbackLanguages;
      if (search.trim()) {
        const searchLower = search.trim().toLowerCase();
        filtered = fallbackLanguages.filter((l) => l.toLowerCase().includes(searchLower));
      }
      
      return NextResponse.json({
        success: true,
        languages: filtered.slice(0, limit).map((l) => ({
          id: l.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, ""),
          name: l,
        })),
        total: filtered.length,
      });
    }

    // Build where clause for search
    const where: any = {
      isActive: true, // Only return active languages
    };
    
    if (search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    // Fetch languages from database
    const languages = await prisma.language.findMany({
      where,
      take: limit,
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      languages: languages,
      total: languages.length,
    });
  } catch (error) {
    console.error("Error fetching languages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch languages" },
      { status: 500 }
    );
  }
}

// Proficiency levels
export const PROFICIENCY_LEVELS = [
  { value: "native", label: "Native" },
  { value: "fluent", label: "Fluent" },
  { value: "conversational", label: "Conversational" },
  { value: "basic", label: "Basic" },
] as const;

