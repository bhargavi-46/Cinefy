"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/navbar";
import { useEffect } from "react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check if session exists and user is not the admin
    if (status === "authenticated" && session?.user?.email !== "cinefyweb@gmail.com") {
      router.push("/home");
    }
  }, [session, status, router]);

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <p className="text-gray-200">Loading...</p>
      </div>
    );
  }

  // Additional check in case the useEffect hasn't triggered yet
  if (status === "authenticated" && session?.user?.email !== "cinefyweb@gmail.com") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <p className="text-gray-200">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <Navbar />
      <div className="max-w-6xl mx-auto text-center mt-10">
        <h1 className="text-4xl font-bold mb-8 text-white">
          Admin Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Link href="/upload" passHref legacyBehavior>
            <a className="block w-full">
              <div className="bg-gray-800 rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                <div className="text-5xl mb-4 text-blue-400">📁</div>
                <h2 className="text-2xl font-semibold mb-2 text-gray-200">
                  Content Management
                </h2>
                <p className="text-gray-400">
                  Upload and manage all platform content
                </p>
              </div>
            </a>
          </Link>

          <Link href="/manage-user" passHref legacyBehavior>
            <a className="block w-full">
              <div className="bg-gray-800 rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                <div className="text-5xl mb-4 text-red-400">👥</div>
                <h2 className="text-2xl font-semibold mb-2 text-gray-200">
                  User Management
                </h2>
                <p className="text-gray-400">
                  View, edit, and manage all user accounts
                </p>
              </div>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}