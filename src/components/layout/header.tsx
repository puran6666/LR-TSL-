"use client";

import { UserButton } from "./user-button";
import { MobileSidebar } from "./mobile-sidebar";

export function Header() {
  return (
    <div className="sticky top-0 z-40 flex items-center p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 h-16 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md transition-all duration-300">
      <MobileSidebar />
      <div className="flex w-full justify-end">
        <UserButton />
      </div>
    </div>
  );
}
