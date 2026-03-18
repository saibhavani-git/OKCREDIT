"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/users/savings");
  }, [router]);
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-gray-600/50 border-t-gray-300 rounded-full animate-spin" />
    </div>
  );
}
