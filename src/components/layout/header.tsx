"use client";

import Link from "next/link";
import { LogOut, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

export function Header() {
  async function handleSignOut() {
    await signOut();
  }

  return (
    <header className="border-b bg-white dark:bg-zinc-950">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Fastbreak
        </Link>

        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/events/new">
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}