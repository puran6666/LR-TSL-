"use client";

import { UserButton } from "./user-button";
import { MobileSidebar } from "./mobile-sidebar";

export function Header() {
  return (
    <div className="flex items-center p-4 border-b h-16 bg-white dark:bg-zinc-950">
      <MobileSidebar />
      <div className="flex w-full justify-end">
        <UserButton />
      </div>
    </div>
  );
}
