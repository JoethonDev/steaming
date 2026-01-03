"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to default locale login
    router.replace("/ar/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030406]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
        <p className="text-slate-400">Redirecting to login...</p>
      </div>
    </div>
  );
}