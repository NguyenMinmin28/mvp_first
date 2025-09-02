// @ts-nocheck
import { prisma } from "@/core/database/db";
import { resetDb, createUser } from "./helpers";

// Avoid importing NextAuth adapter chain: mock the auth module used by the route
jest.mock("@/features/auth/auth", () => ({ authOptions: {} }));

// Import the route after mocks
import { POST } from "@/app/api/ideas/route";

// Mock next-auth getServerSession to authenticate requests
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(async () => ({
    user: { id: globalThis.__testUserId, email: "tester@example.com" },
  })),
}));

describe("POST /api/ideas", () => {
  beforeAll(async () => {
    await resetDb();
    const user = await createUser("tester@example.com");
    // Expose for the mocked getServerSession above
    // @ts-ignore
    globalThis.__testUserId = user.id;
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("creates a PENDING idea and returns 201", async () => {
    const req = new Request("http://localhost/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My first spark",
        summary: "Short summary",
        body: "Details",
        skillIds: [],
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBeTruthy();
    expect(json.status).toBe("PENDING");

    const inDb = await prisma.idea.findUnique({ where: { id: json.id } });
    expect(inDb).not.toBeNull();
    expect(inDb?.status).toBe("PENDING");
  });
});


