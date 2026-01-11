import { getEvents } from "@/lib/actions/events";
import { EventList } from "@/components/events/event-list";

export default async function DashboardPage() {
  const result = await getEvents({});

  const events = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Your Events
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage and organize your sports events
        </p>
      </div>

      <EventList initialEvents={events} />
    </div>
  );
}
