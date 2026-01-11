import { EventForm } from "@/components/events/event-form";

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Create New Event
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Fill in the details to create a new sports event
        </p>
      </div>

      <EventForm mode="create" />
    </div>
  );
}