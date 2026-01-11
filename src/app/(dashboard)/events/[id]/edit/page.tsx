import { notFound } from "next/navigation";
import { getEvent } from "@/lib/actions/events";
import { EventForm } from "@/components/events/event-form";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const result = await getEvent({ id });

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Edit Event
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Update the details of your event
        </p>
      </div>

      <EventForm mode="edit" event={result.data} />
    </div>
  );
}