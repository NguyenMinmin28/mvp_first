// @ts-nocheck
import { prisma } from "../src/core/database/db";
import { DevLevel, AdminApprovalStatus } from "@prisma/client";

const skills = [
  { name: "React", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "TypeScript", category: "Language" },
  { name: "Python", category: "Language" },
  { name: "Docker", category: "DevOps" },
  { name: "MongoDB", category: "Database" },
  { name: "PostgreSQL", category: "Database" },
  { name: "AWS", category: "Cloud" },
  { name: "Vue.js", category: "Frontend" },
  { name: "Angular", category: "Frontend" },
  { name: "Java", category: "Language" },
  { name: "C#", category: "Language" },
  { name: "PHP", category: "Language" },
  { name: "Laravel", category: "Backend" },
  { name: "Django", category: "Backend" },
  { name: "Flutter", category: "Mobile" },
  { name: "React Native", category: "Mobile" },
  { name: "Kubernetes", category: "DevOps" },
  { name: "GraphQL", category: "API" },
  { name: "Redis", category: "Database" },
];

const developers = [
  // EXPERT Developers (5)
  {
    name: "Alex Chen",
    email: "alex.chen@dev.com",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["React", "TypeScript", "Node.js", "MongoDB"],
    responseTime: 30000, // 30 seconds
    whatsappVerified: true,
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@dev.com", 
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Python", "Django", "PostgreSQL", "AWS"],
    responseTime: 45000, // 45 seconds
    whatsappVerified: true,
  },
  {
    name: "Michael Rodriguez",
    email: "michael.rodriguez@dev.com",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "checking" as const,
    skills: ["Java", "Spring Boot", "Docker", "Kubernetes"],
    responseTime: 60000, // 1 minute
    whatsappVerified: true,
  },
  {
    name: "Emily Wang",
    email: "emily.wang@dev.com",
    level: "EXPERT" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "busy" as const,
    skills: ["Vue.js", "TypeScript", "GraphQL", "Redis"],
    responseTime: 90000, // 1.5 minutes
    whatsappVerified: false,
  },
  {
    name: "David Kim",
    email: "david.kim@dev.com",
    level: "EXPERT" as DevLevel,
    approvalStatus: "pending" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["C#", ".NET", "Azure", "SQL Server"],
    responseTime: 75000, // 1.25 minutes
    whatsappVerified: true,
  },

  // MID Developers (10)
  {
    name: "Lisa Thompson",
    email: "lisa.thompson@dev.com",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["React", "JavaScript", "Node.js"],
    responseTime: 120000, // 2 minutes
    whatsappVerified: true,
  },
  {
    name: "James Wilson",
    email: "james.wilson@dev.com",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Python", "Flask", "MongoDB"],
    responseTime: 180000, // 3 minutes
    whatsappVerified: true,
  },
  {
    name: "Maria Garcia",
    email: "maria.garcia@dev.com",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "checking" as const,
    skills: ["Angular", "TypeScript", "Firebase"],
    responseTime: 150000, // 2.5 minutes
    whatsappVerified: false,
  },
  {
    name: "Robert Lee",
    email: "robert.lee@dev.com",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["PHP", "Laravel", "MySQL"],
    responseTime: 200000, // 3.33 minutes
    whatsappVerified: true,
  },
  {
    name: "Jennifer Brown",
    email: "jennifer.brown@dev.com",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "busy" as const,
    skills: ["React Native", "JavaScript", "Firebase"],
    responseTime: 240000, // 4 minutes
    whatsappVerified: true,
  },
  {
    name: "Christopher Davis",
    email: "christopher.davis@dev.com",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Flutter", "Dart", "PostgreSQL"],
    responseTime: 180000, // 3 minutes
    whatsappVerified: false,
  },
  {
    name: "Amanda Miller",
    email: "amanda.miller@dev.com",
    level: "MID" as DevLevel,
    approvalStatus: "pending" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Vue.js", "JavaScript", "MongoDB"],
    responseTime: 300000, // 5 minutes
    whatsappVerified: true,
  },
  {
    name: "Daniel Taylor",
    email: "daniel.taylor@dev.com",
    level: "MID" as DevLevel,
    approvalStatus: "rejected" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Java", "Spring", "MySQL"],
    responseTime: 360000, // 6 minutes
    whatsappVerified: false,
  },
  {
    name: "Jessica Anderson",
    email: "jessica.anderson@dev.com",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Node.js", "Express", "Redis"],
    responseTime: 150000, // 2.5 minutes
    whatsappVerified: true,
  },
  {
    name: "Kevin Martinez",
    email: "kevin.martinez@dev.com",
    level: "MID" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "checking" as const,
    skills: ["Docker", "AWS", "GraphQL"],
    responseTime: 120000, // 2 minutes
    whatsappVerified: true,
  },

  // FRESHER Developers (5)
  {
    name: "Rachel Green",
    email: "rachel.green@dev.com",
    level: "FRESHER" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["React", "JavaScript"],
    responseTime: 600000, // 10 minutes
    whatsappVerified: true,
  },
  {
    name: "Thomas White",
    email: "thomas.white@dev.com",
    level: "FRESHER" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Python", "Django"],
    responseTime: 900000, // 15 minutes
    whatsappVerified: false,
  },
  {
    name: "Nicole Clark",
    email: "nicole.clark@dev.com",
    level: "FRESHER" as DevLevel,
    approvalStatus: "approved" as AdminApprovalStatus,
    currentStatus: "checking" as const,
    skills: ["HTML", "CSS", "JavaScript"],
    responseTime: 1200000, // 20 minutes
    whatsappVerified: true,
  },
  {
    name: "Andrew Hall",
    email: "andrew.hall@dev.com",
    level: "FRESHER" as DevLevel,
    approvalStatus: "pending" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["PHP", "MySQL"],
    responseTime: 1800000, // 30 minutes
    whatsappVerified: true,
  },
  {
    name: "Stephanie Young",
    email: "stephanie.young@dev.com",
    level: "FRESHER" as DevLevel,
    approvalStatus: "rejected" as AdminApprovalStatus,
    currentStatus: "available" as const,
    skills: ["Vue.js", "JavaScript"],
    responseTime: 2400000, // 40 minutes
    whatsappVerified: false,
  },
];

async function seedSkills() {
  console.log("🌱 Seeding skills...");
  
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: {
        name: skill.name,
        slug: skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        category: skill.category,
        keywords: [skill.name.toLowerCase()]
      }
    });
  }
  
  console.log(`✅ Seeded ${skills.length} skills`);
}

async function seedDevelopers() {
  console.log("🌱 Seeding developers...");
  
  let createdCount = 0;
  
  for (const dev of developers) {
    try {
      // Create user
      const user = await prisma.user.upsert({
        where: { email: dev.email },
        update: {},
        create: {
          email: dev.email,
          name: dev.name,
          emailVerified: new Date(),
        }
      });

      // Create reviews aggregate
      const reviewsAggregate = await prisma.reviewsAggregate.create({
        data: {
          averageRating: Math.random() * 2 + 3, // 3-5 stars
          totalReviews: Math.floor(Math.random() * 10) + 1,
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
      console.log(`✅ Created developer: ${dev.name} (${dev.level})`);
      
    } catch (error) {
      console.error(`❌ Failed to create developer ${dev.name}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${createdCount} developers`);
}

async function main() {
  try {
    console.log("🚀 Starting developer seeding...");
    
    await seedSkills();
    await seedDevelopers();
    
    console.log("🎉 Developer seeding completed!");
    
    // Show summary
    const stats = await prisma.developerProfile.groupBy({
      by: ['level', 'adminApprovalStatus'],
      _count: true
    });
    
    console.log("\n📊 Developer Statistics:");
    stats.forEach(stat => {
      console.log(`  ${stat.level} - ${stat.adminApprovalStatus}: ${stat._count}`);
    });
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
