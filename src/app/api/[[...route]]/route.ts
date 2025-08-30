import { Hono } from "hono";
import { handle } from "hono/vercel";

// import todos from "../routes/todos"

// Revert to "edge" if planning on running on the edge
export const runtime = "nodejs";

const app = new Hono().basePath("/api");

// Add debug middleware
app.use("*", async (c: any, next: any) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

// const routes = app.route("/todos", todos)

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

// export type AppType = typeof routes
