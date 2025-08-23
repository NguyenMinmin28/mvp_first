import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { ModeToggle } from "@/features/shared/components/mode-toggle";
import { SignOutButton } from "@/features/auth/components/auth-buttons";
import { MessageCircle, Mail, User, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard | Todo App",
  description: "Your personal dashboard and profile information.",
};

export default async function Home() {
  const user = await getServerSessionUser();

  if (!user) {
    return null; // Middleware sẽ xử lý redirect
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Welcome Back!
          </h1>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* User Profile Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome, {user.name || user.email}!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              This is your personal dashboard. Here you can manage your account
              and view your information.
            </p>
          </div>

          {/* User Info Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Profile Information
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your account details
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Email:</strong> {user.email || "Not provided"}
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Name:</strong> {user.name || "Not provided"}
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>User ID:</strong> {user.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Authentication Method Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Authentication
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    How you signed in
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {user.phoneE164 ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 dark:text-green-200">
                      <strong>WhatsApp:</strong> {user.phoneE164}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 dark:text-blue-200">
                      <strong>Google:</strong> {user.email}
                    </span>
                  </div>
                )}

                <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p>You are currently signed in and your session is active.</p>
                  <p className="mt-2">
                    Use the sign out button above to log out.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Quick Actions
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Account Settings
                </h4>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  Manage your profile and preferences
                </p>
              </div>

              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  Security
                </h4>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Update your password and security settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 Todo App. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
