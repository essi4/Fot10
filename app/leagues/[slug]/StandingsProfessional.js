"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StandingsProfessional() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [router]);

  return null;
}
