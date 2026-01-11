"use server";

import { createClient } from "@/lib/supabase/server";
import { createAction } from "./safe-action";
import {
  createEventSchema,
  updateEventSchema,
  searchEventsSchema,
  type Event,
  type EventWithVenues,
  type CreateEventInput,
  type UpdateEventInput,
  type SearchEventsInput,
} from "@/types/database";
import { z } from "zod";

export const getEvents = createAction(
  searchEventsSchema,
  async (input: SearchEventsInput, userId: string): Promise<EventWithVenues[]> => {
    const supabase = await createClient();

    let query = supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .order("date_time", { ascending: true });

    if (input.query) {
      query = query.ilike("name", `%${input.query}%`);
    }

    if (input.sport_type) {
      query = query.eq("sport_type", input.sport_type);
    }

    const { data: events, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Fetch venues for each event
    const eventsWithVenues: EventWithVenues[] = await Promise.all(
      (events || []).map(async (event) => {
        const { data: eventVenues } = await supabase
          .from("event_venues")
          .select("venue_id")
          .eq("event_id", event.id);

        const venueIds = eventVenues?.map((ev) => ev.venue_id) || [];

        let venues: { id: string; name: string; address: string | null; created_at: string }[] = [];
        if (venueIds.length > 0) {
          const { data: venueData } = await supabase
            .from("venues")
            .select("*")
            .in("id", venueIds);
          venues = venueData || [];
        }

        return { ...event, venues };
      })
    );

    return eventsWithVenues;
  }
);

const getEventByIdSchema = z.object({
  id: z.string().uuid("Invalid event ID"),
});

export const getEvent = createAction(
  getEventByIdSchema,
  async (input: { id: string }, userId: string): Promise<EventWithVenues | null> => {
    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", input.id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(error.message);
    }

    // Fetch venues for the event
    const { data: eventVenues } = await supabase
      .from("event_venues")
      .select("venue_id")
      .eq("event_id", event.id);

    const venueIds = eventVenues?.map((ev) => ev.venue_id) || [];

    let venues: { id: string; name: string; address: string | null; created_at: string }[] = [];
    if (venueIds.length > 0) {
      const { data: venueData } = await supabase
        .from("venues")
        .select("*")
        .in("id", venueIds);
      venues = venueData || [];
    }

    return { ...event, venues };
  }
);

export const createEvent = createAction(
  createEventSchema,
  async (input: CreateEventInput, userId: string): Promise<Event> => {
    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        user_id: userId,
        name: input.name,
        sport_type: input.sport_type,
        date_time: input.date_time,
        description: input.description || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Link venues if provided
    if (input.venue_ids && input.venue_ids.length > 0) {
      const eventVenues = input.venue_ids.map((venue_id) => ({
        event_id: event.id,
        venue_id,
      }));

      const { error: venueError } = await supabase
        .from("event_venues")
        .insert(eventVenues);

      if (venueError) {
        throw new Error(venueError.message);
      }
    }

    return event;
  }
);

export const updateEvent = createAction(
  updateEventSchema,
  async (input: UpdateEventInput, userId: string): Promise<Event> => {
    const supabase = await createClient();

    const { id, venue_ids, ...updateData } = input;

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    );

    const { data: event, error } = await supabase
      .from("events")
      .update({ ...filteredData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Update venues if provided
    if (venue_ids !== undefined) {
      // Remove existing venue links
      await supabase.from("event_venues").delete().eq("event_id", id);

      // Add new venue links
      if (venue_ids.length > 0) {
        const eventVenues = venue_ids.map((venue_id) => ({
          event_id: id,
          venue_id,
        }));

        const { error: venueError } = await supabase
          .from("event_venues")
          .insert(eventVenues);

        if (venueError) {
          throw new Error(venueError.message);
        }
      }
    }

    return event;
  }
);

const deleteEventSchema = z.object({
  id: z.string().uuid("Invalid event ID"),
});

export const deleteEvent = createAction(
  deleteEventSchema,
  async (input: { id: string }, userId: string): Promise<{ success: boolean }> => {
    const supabase = await createClient();

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", input.id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  }
);
