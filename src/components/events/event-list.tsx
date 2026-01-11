"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CalendarX } from "lucide-react";

import { EventCard } from "./event-card";
import { EventFilters } from "./event-filters";
import { DeleteEventDialog } from "./delete-event-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvents, deleteEvent } from "@/lib/actions/events";
import type { EventWithVenues } from "@/types/database";

interface EventListProps {
  initialEvents: EventWithVenues[];
}

export function EventList({ initialEvents }: EventListProps) {
  const [events, setEvents] = useState<EventWithVenues[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [sportType, setSportType] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventWithVenues | null>(null);
  const isInitialMount = useRef(true);

  function fetchEvents(query: string, sport: string) {
    startTransition(async () => {
      const result = await getEvents({
        query: query || undefined,
        sport_type: sport === "all" ? undefined : sport,
      });

      if (result.success) {
        setEvents(result.data);
      } else {
        toast.error(result.error);
      }
    });
  }

  // Auto-filter when sport type changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchEvents(appliedSearchQuery, sportType);
  }, [sportType, appliedSearchQuery]);

  function handleSearchSubmit() {
    setAppliedSearchQuery(searchQuery);
    fetchEvents(searchQuery, sportType);
  }

  function handleSportTypeChange(value: string) {
    setSportType(value);
  }

  function handleDeleteClick(id: string) {
    const event = events.find((e) => e.id === id);
    if (event) {
      setEventToDelete(event);
      setDeleteDialogOpen(true);
    }
  }

  async function handleDeleteConfirm() {
    if (!eventToDelete) return;

    const result = await deleteEvent({ id: eventToDelete.id });

    if (result.success) {
      toast.success("Event deleted successfully");
      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <EventFilters
        searchQuery={searchQuery}
        sportType={sportType}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onSportTypeChange={handleSportTypeChange}
        isPending={isPending}
      />

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <CalendarX className="h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            No events found
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {appliedSearchQuery || sportType !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating a new event"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <DeleteEventDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        eventName={eventToDelete?.name || ""}
      />
    </div>
  );
}
