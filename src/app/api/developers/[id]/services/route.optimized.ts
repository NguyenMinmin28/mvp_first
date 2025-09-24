import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";
import { getServerSessionUser } from "@/features/auth/auth-server";

/**
 * Optimized developer services API - Ultra-fast version
 * Reduces nested includes and uses aggregation for better performance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const developerId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "4"), 10);

    console.time('developer-services-optimized');

    // Use aggregation pipeline for better performance
    const pipeline = [
      // Stage 1: Match services for the developer
      {
        $match: {
          developerId: new (require('mongodb').ObjectId)(developerId),
          status: "PUBLISHED",
          visibility: "PUBLIC"
        }
      },
      
      // Stage 2: Sort by rating, views, and creation date
      {
        $sort: {
          ratingAvg: -1,
          views: -1,
          createdAt: -1
        }
      },
      
      // Stage 3: Limit results
      {
        $limit: limit
      },
      
      // Stage 4: Join with developer data
      {
        $lookup: {
          from: "DeveloperProfile",
          localField: "developerId",
          foreignField: "_id",
          as: "developer"
        }
      },
      
      // Stage 5: Unwind developer
      {
        $unwind: "$developer"
      },
      
      // Stage 6: Join with user data
      {
        $lookup: {
          from: "User",
          localField: "developer.userId",
          foreignField: "_id",
          as: "user"
        }
      },
      
      // Stage 7: Unwind user
      {
        $unwind: "$user"
      },
      
      // Stage 8: Join with skills
      {
        $lookup: {
          from: "ServiceSkillOnService",
          localField: "_id",
          foreignField: "serviceId",
          as: "serviceSkills"
        }
      },
      
      // Stage 9: Join with skill names
      {
        $lookup: {
          from: "Skill",
          localField: "serviceSkills.skillId",
          foreignField: "_id",
          as: "skills"
        }
      },
      
      // Stage 10: Join with categories
      {
        $lookup: {
          from: "ServiceCategoryOnService",
          localField: "_id",
          foreignField: "serviceId",
          as: "serviceCategories"
        }
      },
      
      // Stage 11: Join with category names
      {
        $lookup: {
          from: "Category",
          localField: "serviceCategories.categoryId",
          foreignField: "_id",
          as: "categories"
        }
      },
      
      // Stage 12: Join with media
      {
        $lookup: {
          from: "ServiceMedia",
          let: { serviceId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$serviceId", "$$serviceId"] },
                    { $eq: ["$kind", "IMAGE"] }
                  ]
                }
              }
            },
            { $sort: { sortOrder: 1 } }
          ],
          as: "media"
        }
      },
      
      // Stage 13: Join with leads count
      {
        $lookup: {
          from: "ServiceLead",
          localField: "_id",
          foreignField: "serviceId",
          as: "leads"
        }
      },
      
      // Stage 14: Project final fields
      {
        $project: {
          id: "$_id",
          slug: 1,
          title: 1,
          shortDesc: 1,
          coverUrl: 1,
          priceType: 1,
          priceMin: 1,
          priceMax: 1,
          deliveryDays: 1,
          ratingAvg: 1,
          ratingCount: 1,
          views: 1,
          likesCount: 1,
          developer: {
            id: "$developer._id",
            user: {
              id: "$user._id",
              name: "$user.name",
              image: "$user.image"
            },
            location: "$developer.location"
          },
          skills: "$skills.name",
          categories: "$categories.name",
          leadsCount: { $size: "$leads" },
          galleryImages: {
            $slice: [
              "$media.url",
              9
            ]
          },
          showcaseImages: {
            $slice: [
              "$media.url",
              2
            ]
          }
        }
      }
    ];

    const result = await prisma.$runCommandRaw({
      aggregate: "Service",
      pipeline,
      cursor: {}
    }) as any;

    const services = (result.cursor?.firstBatch || []).map((service: any) => ({
      ...service,
      userLiked: false, // Default value
      skills: service.skills || [],
      categories: service.categories || [],
      galleryImages: service.galleryImages || [],
      showcaseImages: service.showcaseImages || []
    }));

    console.timeEnd('developer-services-optimized');
    console.log(`Optimized developer services API returned ${services.length} services in ${Date.now() - Date.now()}ms`);

    return NextResponse.json({
      success: true,
      data: services,
    });

  } catch (error) {
    console.error("Error fetching developer services:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
