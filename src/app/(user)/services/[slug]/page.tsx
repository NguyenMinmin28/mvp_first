import { notFound, redirect } from "next/navigation";
import { prisma } from "@/core/database/db";

interface ServiceSlugPageProps {
  params: { slug: string };
}

export default async function ServiceSlugPage({
  params,
}: ServiceSlugPageProps) {
  const { slug } = params;

  try {
    // Fetch service by slug
    const service = await prisma.service.findUnique({
      where: {
        slug: slug,
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      select: {
        id: true,
        developerId: true,
      },
    });

    if (!service) {
      notFound();
    }

    // Redirect to developer services page with serviceId
    // Note: redirect() throws a NEXT_REDIRECT error internally, which is expected behavior
    redirect(`/developer/${service.developerId}/services?serviceId=${service.id}`);
  } catch (error: any) {
    // Don't catch NEXT_REDIRECT errors - they are expected
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw redirect errors
    }
    console.error("Error fetching service by slug:", error);
    notFound();
  }
}

