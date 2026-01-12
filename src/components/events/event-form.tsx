"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { createEvent, updateEvent, getCustomSportTypes } from "@/lib/actions/events";
import { getVenues, createVenue, updateVenue } from "@/lib/actions/venues";
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
  const [venueError, setVenueError] = useState<string | null>(null);

  // Edit venue state
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [editVenueName, setEditVenueName] = useState("");
  const [editVenueAddress, setEditVenueAddress] = useState("");
  const [isEditingVenue, setIsEditingVenue] = useState(false);
  const [editVenueDialogOpen, setEditVenueDialogOpen] = useState(false);

  // Custom sport type state
  const [customSportTypes, setCustomSportTypes] = useState<string[]>([]);
  const [customSportInput, setCustomSportInput] = useState("");
  const [showCustomSportInput, setShowCustomSportInput] = useState(
    event?.sport_type && !SPORT_TYPES.includes(event.sport_type as typeof SPORT_TYPES[number])
  );

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
    async function loadData() {
      const [venuesResult, customSportsResult] = await Promise.all([
        getVenues(),
        getCustomSportTypes(),
      ]);
      if (venuesResult.success) {
        setVenues(venuesResult.data);
      }
      if (customSportsResult.success) {
        setCustomSportTypes(customSportsResult.data);
      }
    }
    loadData();

    // Initialize custom sport input if editing an event with a custom sport type
    if (event?.sport_type && !SPORT_TYPES.includes(event.sport_type as typeof SPORT_TYPES[number])) {
      setCustomSportInput(event.sport_type);
    }
  }, [event?.sport_type]);

  async function onSubmit(values: EventFormValues) {
    // Validate venues
    if (selectedVenueIds.length === 0) {
      setVenueError("At least one venue is required");
      return;
    }
    setVenueError(null);

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
          router.refresh();
          router.push("/dashboard");
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
          router.refresh();
          router.push("/dashboard");
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
    setSelectedVenueIds((prev) => {
      const newIds = prev.includes(venueId)
        ? prev.filter((id) => id !== venueId)
        : [...prev, venueId];
      if (newIds.length > 0) {
        setVenueError(null);
      }
      return newIds;
    });
  }

  async function handleAddVenue() {
    if (!newVenueName.trim()) return;

    setIsAddingVenue(true);
    try {
      const result = await createVenue({
        name: newVenueName.trim(),
        address: newVenueAddress.trim(),
      });

      if (result.success) {
        setVenues((prev) => [...prev, result.data]);
        setSelectedVenueIds((prev) => [...prev, result.data.id]);
        setVenueError(null);
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

  function openEditVenueDialog(venue: Venue) {
    setEditingVenue(venue);
    setEditVenueName(venue.name);
    setEditVenueAddress(venue.address || "");
    setEditVenueDialogOpen(true);
  }

  async function handleEditVenue() {
    if (!editingVenue || !editVenueName.trim() || !editVenueAddress.trim()) return;

    setIsEditingVenue(true);
    try {
      const result = await updateVenue({
        id: editingVenue.id,
        name: editVenueName.trim(),
        address: editVenueAddress.trim(),
      });

      if (result.success) {
        setVenues((prev) =>
          prev.map((v) => (v.id === editingVenue.id ? result.data : v))
        );
        setEditVenueDialogOpen(false);
        setEditingVenue(null);
        setEditVenueName("");
        setEditVenueAddress("");
        toast.success("Venue updated successfully");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to update venue");
    } finally {
      setIsEditingVenue(false);
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
                    onValueChange={(value) => {
                      if (value === "Other") {
                        setShowCustomSportInput(true);
                        // Set the form value to the custom input or empty
                        field.onChange(customSportInput || "");
                      } else {
                        setShowCustomSportInput(false);
                        setCustomSportInput("");
                        field.onChange(value);
                      }
                    }}
                    value={showCustomSportInput ? "Other" : field.value}
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

                  {showCustomSportInput && (
                    <div className="space-y-3 pt-2">
                      <Input
                        placeholder="Enter custom sport type"
                        value={customSportInput}
                        onChange={(e) => {
                          setCustomSportInput(e.target.value);
                          field.onChange(e.target.value);
                        }}
                      />
                      {customSportTypes.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm text-zinc-500">Previously used:</p>
                          <div className="flex flex-wrap gap-2">
                            {customSportTypes.map((sport) => (
                              <Badge
                                key={sport}
                                variant="outline"
                                className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                onClick={() => {
                                  setCustomSportInput(sport);
                                  field.onChange(sport);
                                }}
                              >
                                {sport}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                <FormLabel>Venues</FormLabel>
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
                        <Label>Venue Name</Label>
                        <Input
                          placeholder="Enter venue name"
                          value={newVenueName}
                          onChange={(e) => setNewVenueName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          placeholder="Enter address"
                          value={newVenueAddress}
                          onChange={(e) => setNewVenueAddress(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddVenue}
                        disabled={!newVenueName.trim() || !newVenueAddress.trim() || isAddingVenue}
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
                      <Badge key={id} variant="secondary" className="gap-1 pr-1">
                        {venue.name}
                        <button
                          type="button"
                          onClick={() => openEditVenueDialog(venue)}
                          className="ml-1 hover:text-blue-500"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleVenue(id)}
                          className="hover:text-red-500"
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

              {venueError && (
                <p className="text-sm font-medium text-destructive">{venueError}</p>
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

        {/* Edit Venue Dialog */}
        <Dialog open={editVenueDialogOpen} onOpenChange={setEditVenueDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Venue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Venue Name</Label>
                <Input
                  placeholder="Enter venue name"
                  value={editVenueName}
                  onChange={(e) => setEditVenueName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="Enter address"
                  value={editVenueAddress}
                  onChange={(e) => setEditVenueAddress(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={handleEditVenue}
                disabled={!editVenueName.trim() || !editVenueAddress.trim() || isEditingVenue}
                className="w-full"
              >
                {isEditingVenue && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Venue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
