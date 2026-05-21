"use client";

import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

const mockSession = {
  user: {
    id: "admin-bypass",
    name: "Administrator",
    email: "admin@example.com",
    role: "ADMIN"
  },
  expires: "2099-01-01T00:00:00.000Z"
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider session={mockSession}>
      {children}
      <Toaster />
    </SessionProvider>
  );
}
