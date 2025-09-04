"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function DebugSessionPage() {
  const { data: session, status, update } = useSession();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/user/me");
        const data = await res.json();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleRefreshSession = async () => {
    await update();
    // Refetch user data
    try {
      const res = await fetch("/api/user/me");
      const data = await res.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Debug Session</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Session Status</h2>
          <p>Status: {status}</p>
          <pre className="mt-2 text-sm bg-white p-2 rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">User Data from API</h2>
          <pre className="text-sm bg-white p-2 rounded overflow-auto">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Actions</h2>
          <button
            onClick={handleRefreshSession}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh Session
          </button>
        </div>
      </div>
    </div>
  );
}
