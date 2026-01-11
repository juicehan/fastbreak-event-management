"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, Pencil, Trash2 } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventWithVenues } from "@/types/database";

interface EventCardProps {
  event: EventWithVenues;
  onDelete: (id: string) => void;
}

export function EventCard({ event, onDelete }: EventCardProps) {
  const formattedDate = format(new Date(event.date_time), "PPP 'at' p");

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{event.name}</CardTitle>
          <Badge variant="secondary">{event.sport_type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
        {event.venues.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <MapPin className="h-4 w-4 mt-0.5" />
            <span>{event.venues.map((v) => v.name).join(", ")}</span>
          </div>
        )}
        {event.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {event.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="gap-2 pt-2">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/events/${event.id}/edit`}>
            <Pencil className="mr-2 h-3 w-3" />
            Edit
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
          onClick={() => onDelete(event.id)}
        >
          <Trash2 className="mr-2 h-3 w-3" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
