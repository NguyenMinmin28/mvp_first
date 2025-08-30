// @ts-nocheck
import { prisma } from "../src/core/database/db";
import { DevLevel, AdminApprovalStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const moreDevelopers = [
  // Java/Spring Boot Experts for API Gateway project
  {
    name: "John Smith",
    email: "john.smith@dev.com",
    password: "password123", // For testing login
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Java", "Spring Boot", "Kubernetes", "GraphQL"],
    responseTime: 25000, // 25 seconds
    whatsappVerified: true,
  },
  {
    name: "Anna Johnson",
    email: "anna.johnson@dev.com", 
    password: "password123",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Java", "Spring Boot", "Docker", "Redis"],
    responseTime: 35000,
    whatsappVerified: true,
  },
  {
    name: "Mark Davis",
    email: "mark.davis@dev.com",
    password: "password123",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Java", "Spring Boot", "MySQL"],
    responseTime: 120000, // 2 minutes
    whatsappVerified: true,
  },

  // React/Node.js developers for E-commerce project
  {
    name: "Sarah Williams",
    email: "sarah.williams@dev.com",
    password: "password123",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["React", "TypeScript", "Node.js", "MongoDB"],
    responseTime: 30000,
    whatsappVerified: true,
  },
  {
    name: "Tom Brown",
    email: "tom.brown@dev.com",
    password: "password123",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["React", "JavaScript", "Node.js", "MongoDB"],
    responseTime: 180000, // 3 minutes
    whatsappVerified: true,
  },
  {
    name: "Emma Wilson",
    email: "emma.wilson@dev.com",
    password: "password123",
    level: "FRESHER" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["React", "JavaScript", "HTML"],
    responseTime: 600000, // 10 minutes
    whatsappVerified: true,
  },

  // React Native/Mobile developers
  {
    name: "Oliver Jones",
    email: "oliver.jones@dev.com",
    password: "password123",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["React Native", "JavaScript", "Firebase", "GraphQL"],
    responseTime: 40000,
    whatsappVerified: true,
  },
  {
    name: "Sophia Taylor",
    email: "sophia.taylor@dev.com",
    password: "password123",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["React Native", "JavaScript", "Firebase"],
    responseTime: 150000,
    whatsappVerified: true,
  },

  // Vue.js/Node.js developers for Dashboard project
  {
    name: "Lucas Miller",
    email: "lucas.miller@dev.com",
    password: "password123",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Vue.js", "Node.js", "Redis", "Docker"],
    responseTime: 45000,
    whatsappVerified: true,
  },
  {
    name: "Mia Anderson",
    email: "mia.anderson@dev.com",
    password: "password123",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Vue.js", "JavaScript", "Node.js"],
    responseTime: 200000,
    whatsappVerified: false,
  },

  // More developers for variety
  {
    name: "Ethan Thomas",
    email: "ethan.thomas@dev.com",
    password: "password123",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Python", "Django", "PostgreSQL", "AWS"],
    responseTime: 50000,
    whatsappVerified: true,
  },
  {
    name: "Isabella Garcia",
    email: "isabella.garcia@dev.com",
    password: "password123",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Python", "Flask", "PostgreSQL"],
    responseTime: 240000,
    whatsappVerified: true,
  },
  {
    name: "William Martinez",
    email: "william.martinez@dev.com",
    password: "password123",
    level: "FRESHER" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Python", "Django"],
    responseTime: 900000, // 15 minutes
    whatsappVerified: false,
  },

  // Full stack developers
  {
    name: "Charlotte Lopez",
    email: "charlotte.lopez@dev.com",
    password: "password123",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["React", "Node.js", "TypeScript", "GraphQL", "PostgreSQL"],
    responseTime: 35000,
    whatsappVerified: true,
  },
  {
    name: "Benjamin Rodriguez",
    email: "benjamin.rodriguez@dev.com",
    password: "password123",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Vue.js", "Node.js", "MongoDB", "Docker"],
    responseTime: 160000,
    whatsappVerified: true,
  },

  // Mobile specialists
  {
    name: "Amelia Lewis",
    email: "amelia.lewis@dev.com",
    password: "password123",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Flutter", "Dart", "Firebase"],
    responseTime: 55000,
    whatsappVerified: true,
  },
  {
    name: "Harper Walker",
    email: "harper.walker@dev.com",
    password: "password123",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["React Native", "JavaScript"],
    responseTime: 300000,
    whatsappVerified: false,
  },

  // DevOps specialists
  {
    name: "Henry Young",
    email: "henry.young@dev.com",
    password: "password123",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Docker", "Kubernetes", "AWS", "Redis"],
    responseTime: 40000,
    whatsappVerified: true,
  },
  {
    name: "Evelyn King",
    email: "evelyn.king@dev.com",
    password: "password123",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Docker", "AWS", "MongoDB"],
    responseTime: 180000,
    whatsappVerified: true,
  },

  // Junior developers
  {
    name: "Alexander Scott",
    email: "alexander.scott@dev.com",
    password: "password123",
    level: "FRESHER" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["JavaScript", "HTML", "CSS"],
    responseTime: 1200000, // 20 minutes
    whatsappVerified: true,
  },
  {
    name: "Victoria Green",
    email: "victoria.green@dev.com",
    password: "password123",
    level: "FRESHER" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["JavaScript", "React"],
    responseTime: 800000, // 13 minutes
    whatsappVerified: false,
  },
];

async function seedMoreDevelopers() {
  console.log("🌱 Seeding more developers...");
  
  let createdCount = 0;
  
  for (let index = 0; index < moreDevelopers.length; index++) {
    const dev = moreDevelopers[index];
    try {
      // Create user with role DEVELOPER
      const user = await prisma.user.upsert({
        where: { email: dev.email },
        update: {},
        create: {
          email: dev.email,
          name: dev.name,
          emailVerified: new Date(),
          role: "DEVELOPER",
          passwordHash: await bcrypt.hash(dev.password, 12),
        }
      });

      // Create reviews aggregate
      const reviewsAggregate = await prisma.reviewsAggregate.create({
        data: {
          averageRating: Math.random() * 2 + 3, // 3-5 stars
          totalReviews: Math.floor(Math.random() * 20) + 1,
        }
      });

      // Create developer profile
      const developerProfile = await prisma.developerProfile.upsert({
        where: { userId: user.id },
        update: {
          level: dev.level,
          adminApprovalStatus: dev.approvalStatus,
          currentStatus: dev.currentStatus,
          usualResponseTimeMs: dev.responseTime,
          whatsappNumber: dev.whatsappVerified ? `+1${Math.floor(Math.random() * 9000000000) + 1000000000}` : null,
          reviewsSummaryId: reviewsAggregate.id,
        },
        create: {
          userId: user.id,
          level: dev.level,
          adminApprovalStatus: dev.approvalStatus,
          currentStatus: dev.currentStatus,
          usualResponseTimeMs: dev.responseTime,
          whatsappNumber: dev.whatsappVerified ? `+1${Math.floor(Math.random() * 9000000000) + 1000000000}` : null,
          reviewsSummaryId: reviewsAggregate.id,
        }
      });

      // Add skills
      for (const skillName of dev.skills) {
        const skill = await prisma.skill.findUnique({
          where: { name: skillName }
        });
        
        if (skill) {
          await prisma.developerSkill.upsert({
            where: {
              developerProfileId_skillId: {
                developerProfileId: developerProfile.id,
                skillId: skill.id
              }
            },
            update: {},
            create: {
              developerProfileId: developerProfile.id,
              skillId: skill.id,
              years: dev.level === "FRESHER" ? 1 : dev.level === "MID" ? 3 : 5,
              rating: Math.floor(Math.random() * 5) + 1,
            }
          });
        }
      }

      createdCount++;
      console.log(`✅ Created developer: ${dev.name} (${dev.level}) - Skills: ${dev.skills.join(', ')}`);
      
    } catch (error) {
      console.error(`❌ Failed to create developer ${dev.name}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${createdCount} more developers`);
}

async function main() {
  try {
    console.log("🚀 Starting additional developer seeding...");
    
    await seedMoreDevelopers();
    
    console.log("🎉 Additional developer seeding completed!");
    
    // Show updated summary
    const stats = await prisma.developerProfile.groupBy({
      by: ['level', 'adminApprovalStatus'],
      _count: true
    });
    
    console.log("\n📊 Updated Developer Statistics:");
    stats.forEach(stat => {
      console.log(`  ${stat.level} - ${stat.adminApprovalStatus}: ${stat._count}`);
    });

    // Show some test accounts
    console.log("\n🔑 Test Developer Accounts (password: password123):");
    console.log("  📧 john.smith@dev.com (EXPERT - Java/Spring Boot)");
    console.log("  📧 sarah.williams@dev.com (EXPERT - React/Node.js)"); 
    console.log("  📧 oliver.jones@dev.com (EXPERT - React Native)");
    console.log("  📧 tom.brown@dev.com (MID - React/Node.js)");
    console.log("  📧 mark.davis@dev.com (MID - Java/Spring Boot)");
    console.log("  📧 emma.wilson@dev.com (FRESHER - React/JavaScript)");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
