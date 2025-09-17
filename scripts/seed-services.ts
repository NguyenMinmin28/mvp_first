import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Prefer explicit Mongo URL; fallback to DATABASE_URL
const mongoUrl = process.env.MONGODB_URL || process.env.DATABASE_URL || "";
if (!mongoUrl || !mongoUrl.startsWith("mongodb")) {
  console.error(
    "❌ Invalid or missing DB URL. Set MONGODB_URL (preferred) or DATABASE_URL to a MongoDB connection string (mongodb:// or mongodb+srv://)."
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: mongoUrl } },
});

const sampleServices = [
  {
    title: "Product Design for Health Supplements",
    shortDesc: "Professional product design and branding for health supplement brands. Specialized in creating compelling visual identities.",
    description: "I specialize in creating stunning product designs for health supplement brands. With over 5 years of experience in the wellness industry, I help brands create compelling visual identities that resonate with their target audience. My services include product packaging design, brand identity, and marketing materials.",
    priceType: "FIXED" as const,
    priceMin: 500,
    priceMax: 2000,
    deliveryDays: 7,
    skills: ["Product Design", "Branding", "Packaging", "Adobe Creative Suite"],
    categories: ["Graphics & Design", "Product Design"],
    coverUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop"
  },
  {
    title: "Creator Tools & Awards Design",
    shortDesc: "Award-winning design for creator tools and digital platforms. Focus on user experience and modern aesthetics.",
    description: "I create award-winning designs for creator tools and digital platforms. My work focuses on exceptional user experience and modern aesthetics that help creators succeed. I've designed for major platforms and have won several design awards.",
    priceType: "HOURLY" as const,
    priceMin: 75,
    priceMax: 150,
    deliveryDays: 14,
    skills: ["UI/UX Design", "Web Design", "Figma", "Prototyping"],
    categories: ["Programming & Tech", "Web Design"],
    coverUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
  },
  {
    title: "Business Card & Brand Identity",
    shortDesc: "Elegant business card designs and complete brand identity packages for small businesses and professionals.",
    description: "I create elegant business card designs and complete brand identity packages. Perfect for small businesses, freelancers, and professionals looking to make a strong first impression. Every design is crafted with attention to detail and brand consistency.",
    priceType: "FIXED" as const,
    priceMin: 150,
    priceMax: 500,
    deliveryDays: 5,
    skills: ["Branding", "Print Design", "Logo Design", "Business Cards"],
    categories: ["Graphics & Design", "Branding"],
    coverUrl: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop"
  },
  {
    title: "Product Photography & Styling",
    shortDesc: "Professional product photography and styling services for e-commerce and marketing materials.",
    description: "Professional product photography and styling services for e-commerce and marketing materials. I specialize in creating stunning product images that increase sales and engagement. Perfect for online stores, catalogs, and marketing campaigns.",
    priceType: "HOURLY" as const,
    priceMin: 100,
    priceMax: 200,
    deliveryDays: 10,
    skills: ["Photography", "Product Styling", "Lighting", "Post-Processing"],
    categories: ["Photography", "E-commerce"],
    coverUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop"
  },
  {
    title: "Web Development & E-commerce",
    shortDesc: "Full-stack web development with focus on e-commerce solutions. React, Next.js, and modern technologies.",
    description: "Full-stack web development with focus on e-commerce solutions. I build fast, secure, and scalable web applications using React, Next.js, and modern technologies. Perfect for businesses looking to establish or improve their online presence.",
    priceType: "FIXED" as const,
    priceMin: 2000,
    priceMax: 10000,
    deliveryDays: 30,
    skills: ["React", "Next.js", "Node.js", "E-commerce"],
    categories: ["Programming & Tech", "Web Development"],
    coverUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop"
  },
  {
    title: "Mobile App Design & Development",
    shortDesc: "Native and cross-platform mobile app design and development. iOS and Android expertise.",
    description: "Native and cross-platform mobile app design and development. I create beautiful, functional mobile apps for iOS and Android. From concept to App Store, I handle the entire development process with attention to user experience and performance.",
    priceType: "FIXED" as const,
    priceMin: 5000,
    priceMax: 25000,
    deliveryDays: 60,
    skills: ["React Native", "iOS", "Android", "Mobile Design"],
    categories: ["Programming & Tech", "Mobile Development"],
    coverUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop"
  },
  {
    title: "Content Writing & Copywriting",
    shortDesc: "Professional content writing and copywriting services for websites, blogs, and marketing materials.",
    description: "Professional content writing and copywriting services for websites, blogs, and marketing materials. I create engaging, SEO-optimized content that converts visitors into customers. Specialized in tech, business, and lifestyle content.",
    priceType: "HOURLY" as const,
    priceMin: 50,
    priceMax: 100,
    deliveryDays: 7,
    skills: ["Content Writing", "Copywriting", "SEO", "Blog Writing"],
    categories: ["Writing & Translation", "Content Marketing"],
    coverUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop"
  },
  {
    title: "Video Editing & Motion Graphics",
    shortDesc: "Professional video editing and motion graphics for marketing, social media, and corporate content.",
    description: "Professional video editing and motion graphics for marketing, social media, and corporate content. I create engaging videos that tell your story and drive results. From concept to final delivery, I handle every aspect of video production.",
    priceType: "FIXED" as const,
    priceMin: 300,
    priceMax: 1500,
    deliveryDays: 14,
    skills: ["Video Editing", "Motion Graphics", "After Effects", "Premiere Pro"],
    categories: ["Video & Animation", "Motion Graphics"],
    coverUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop"
  }
];

async function seedServices() {
  try {
    console.log("🌱 Starting services seeding...");

    // Get all approved developers
    const developers = await prisma.developerProfile.findMany({
      where: {
        adminApprovalStatus: "approved",
        whatsappVerified: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (developers.length === 0) {
      console.log("❌ No approved developers found. Please seed developers first.");
      return;
    }

    console.log(`📊 Found ${developers.length} approved developers`);

    // Create services for each developer
    for (let i = 0; i < developers.length; i++) {
      const developer = developers[i];
      const serviceData = sampleServices[i % sampleServices.length];

      // Generate slug
      const slug = serviceData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + `-${developer.id.slice(-6)}`;

      // Skip if slug already exists to avoid unique constraint errors when re-seeding
      const existing = await prisma.service.findUnique({ where: { slug } });
      if (existing) {
        console.log(`↩️  Skipped existing service: ${existing.title} (${slug})`);
        continue;
      }

      // Create service
      const service = await prisma.service.create({
        data: {
          slug,
          title: serviceData.title,
          shortDesc: serviceData.shortDesc,
          description: serviceData.description,
          coverUrl: serviceData.coverUrl,
          priceType: serviceData.priceType,
          priceMin: serviceData.priceMin,
          priceMax: serviceData.priceMax,
          deliveryDays: serviceData.deliveryDays,
          status: "PUBLISHED",
          visibility: "PUBLIC",
          ratingAvg: Math.random() * 2 + 3,
          ratingCount: Math.floor(Math.random() * 50) + 10,
          views: Math.floor(Math.random() * 500) + 100,
          likesCount: Math.floor(Math.random() * 30) + 5,
          favoritesCount: Math.floor(Math.random() * 20) + 2,
          developerId: developer.id,
        },
      });

      console.log(`✅ Created service: ${service.title} for ${developer.user?.name || "Unknown"}`);
    }

    console.log("🎉 Services seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding services:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedServices();

