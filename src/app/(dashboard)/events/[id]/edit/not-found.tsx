import Link from "next/link";
import { CalendarX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function EventNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <CalendarX className="h-16 w-16 text-zinc-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Event Not Found
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            This event doesn&apos;t exist or you don&apos;t have access to it.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
