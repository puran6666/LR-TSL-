"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Daily Entries",
    icon: FileText,
    href: "/entries",
  },
  {
    label: "Brokers",
    icon: Users,
    href: "/brokers",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="space-y-4 py-6 flex flex-col h-full bg-white/90 dark:bg-zinc-950/90 border-r border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl">
      <div className="px-4 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-10 group">
          <div className="w-9 h-9 mr-3 bg-zinc-950 dark:bg-zinc-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300">
            <Truck className="w-5 h-5 text-white dark:text-zinc-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              LR TSL
            </h1>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium leading-none mt-0.5">Logistics Ledger</p>
          </div>
        </Link>
        <div className="space-y-1.5">
          {routes.map((route) => {
            const isActive = pathname === route.href || pathname.startsWith(route.href + "/");
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-semibold cursor-pointer rounded-xl transition-all duration-200 relative overflow-hidden",
                  isActive 
                    ? "text-zinc-900 dark:text-zinc-50 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/50" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-150 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                )}
              >
                <div className="flex items-center flex-1 z-10">
                  <route.icon className="h-5 w-5 mr-3 transition-transform group-hover:scale-105 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-150" />
                  {route.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-900/80 pt-4">
        {session && (
          <div className="mb-4 px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900/50">
            <p className="truncate text-zinc-800 dark:text-zinc-200 font-semibold">{session.user?.name || session.user?.email}</p>
            <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">{(session.user as any)?.role || "STAFF"}</p>
          </div>
        )}
        <Button 
          onClick={() => signOut({ callbackUrl: "/login" })} 
          variant="ghost" 
          className="w-full justify-start text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-xl"
        >
          <LogOut className="h-5 w-5 mr-3 shrink-0" />
          Logout
        </Button>
      </div>
    </div>
  );
}
