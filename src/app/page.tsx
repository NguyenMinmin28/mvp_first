import { Metadata } from "next";
import TodoView from "@/features/todos/components/TodoView";

// Enable static generation with revalidation
export const revalidate = 0; // Disable static generation for authenticated pages
export const dynamic = "force-dynamic"; // Force dynamic for auth-dependent content

export const metadata: Metadata = {
  title: "Todo App | Manage Your Tasks",
  description:
    "A modern todo application built with Next.js, featuring server-side rendering and real-time updates.",
};

export default function Home() {
  return <TodoView />;
}
