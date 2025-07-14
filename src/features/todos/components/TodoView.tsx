import { Suspense } from "react";

import { getServerSessionUser } from "@/features/auth/auth-server";
import { getTodosByUserId } from "@/features/todos/services/todos.service";
import type { Todo } from "@/features/todos/types/todo.type";
import { ModeToggle } from "@/features/shared/components/mode-toggle";
import {
  SignInButton,
  SignOutButton,
} from "@/features/auth/components/auth-buttons";
import {
  TodoAddForm,
  TodoToggleButton,
  TodoDeleteButton,
} from "@/features/todos/components/todo-client-actions";

// Server Component for Loading State
function TodosLoading() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

// Server Component for Todo List
async function TodoList() {
  const user = await getServerSessionUser();

  if (!user) {
    return null;
  }

  const todos = await getTodosByUserId(user.id);

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No todos yet. Add your first todo above!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo: Todo) => (
        <div
          key={todo.id}
          className="flex items-center gap-3 p-4 border rounded-lg bg-card"
        >
          <TodoToggleButton todoId={todo.id} isDone={todo.done} />
          <div
            className={`flex-1 ${todo.done ? "line-through opacity-60" : ""}`}
          >
            {todo.content}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(todo.createdAt).toLocaleDateString()}
          </div>
          <TodoDeleteButton todoId={todo.id} />
        </div>
      ))}
    </div>
  );
}

// Main Server Component
export default async function TodoView() {
  const user = await getServerSessionUser();

  if (!user) {
    return (
      <main className="flex h-screen items-center justify-center">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-semibold">Todo App</h1>
          <p className="text-muted-foreground">
            Sign in with Google to manage your todos
          </p>
          <SignInButton />
          <ModeToggle />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Todo App</h1>
          <p className="text-muted-foreground">
            Welcome, {user.name || user.email}!
          </p>
        </div>
        <div className="flex gap-2">
          <ModeToggle />
          <SignOutButton />
        </div>
      </div>

      <div className="space-y-6">
        <TodoAddForm />
        <Suspense fallback={<TodosLoading />}>
          <TodoList />
        </Suspense>
      </div>
    </main>
  );
}
