"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createEvent, updateEvent } from "@/lib/actions/events";
import { getVenues, createVenue } from "@/lib/actions/venues";
import { SPORT_TYPES, type EventWithVenues, type Venue } from "@/types/database";

const eventFormSchema = z.object({
  name: z
    .string()
    .min(1, "Event name is required")
    .max(255, "Event name must be less than 255 characters"),
  sport_type: z.string().min(1, "Sport type is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  event?: EventWithVenues;
  mode: "create" | "edit";
}

export function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>(
    event?.venues.map((v) => v.id) || []
  );
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueAddress, setNewVenueAddress] = useState("");
  const [isAddingVenue, setIsAddingVenue] = useState(false);
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);

  // Parse existing event date/time
  const existingDate = event?.date_time
    ? format(new Date(event.date_time), "yyyy-MM-dd")
    : "";
  const existingTime = event?.date_time
    ? format(new Date(event.date_time), "HH:mm")
    : "";

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: event?.name || "",
      sport_type: event?.sport_type || "",
      date: existingDate,
      time: existingTime,
      description: event?.description || "",
    },
  });

  useEffect(() => {
    async function loadVenues() {
      const result = await getVenues();
      if (result.success) {
        setVenues(result.data);
      }
    }
    loadVenues();
  }, []);

  async function onSubmit(values: EventFormValues) {
    setIsLoading(true);
    try {
      const dateTime = new Date(`${values.date}T${values.time}`).toISOString();

      if (mode === "create") {
        const result = await createEvent({
          name: values.name,
          sport_type: values.sport_type,
          date_time: dateTime,
          description: values.description || null,
          venue_ids: selectedVenueIds,
        });

        if (result.success) {
          toast.success("Event created successfully");
          router.push("/dashboard");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await updateEvent({
          id: event!.id,
          name: values.name,
          sport_type: values.sport_type,
          date_time: dateTime,
          description: values.description || null,
          venue_ids: selectedVenueIds,
        });

        if (result.success) {
          toast.success("Event updated successfully");
          router.push("/dashboard");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleVenue(venueId: string) {
    setSelectedVenueIds((prev) =>
      prev.includes(venueId)
        ? prev.filter((id) => id !== venueId)
        : [...prev, venueId]
    );
  }

  async function handleAddVenue() {
    if (!newVenueName.trim()) return;

    setIsAddingVenue(true);
    try {
      const result = await createVenue({
        name: newVenueName.trim(),
        address: newVenueAddress.trim() || null,
      });

      if (result.success) {
        setVenues((prev) => [...prev, result.data]);
        setSelectedVenueIds((prev) => [...prev, result.data.id]);
        setNewVenueName("");
        setNewVenueAddress("");
        setVenueDialogOpen(false);
        toast.success("Venue added successfully");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to add venue");
    } finally {
      setIsAddingVenue(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sport_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPORT_TYPES.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter event description"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Venues (Optional)</FormLabel>
                <Dialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="mr-2 h-3 w-3" />
                      Add Venue
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Venue</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <FormLabel>Venue Name</FormLabel>
                        <Input
                          placeholder="Enter venue name"
                          value={newVenueName}
                          onChange={(e) => setNewVenueName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel>Address (Optional)</FormLabel>
                        <Input
                          placeholder="Enter address"
                          value={newVenueAddress}
                          onChange={(e) => setNewVenueAddress(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddVenue}
                        disabled={!newVenueName.trim() || isAddingVenue}
                        className="w-full"
                      >
                        {isAddingVenue && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Add Venue
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {selectedVenueIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedVenueIds.map((id) => {
                    const venue = venues.find((v) => v.id === id);
                    return venue ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {venue.name}
                        <button
                          type="button"
                          onClick={() => toggleVenue(id)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {venues.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {venues
                    .filter((v) => !selectedVenueIds.includes(v.id))
                    .map((venue) => (
                      <Badge
                        key={venue.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => toggleVenue(venue.id)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {venue.name}
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Event" : "Update Event"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
