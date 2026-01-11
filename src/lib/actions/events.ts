"use server";

import { createClient } from "@/lib/supabase/server";
import { validateAndGetUser } from "./safe-action";
import { formatZodErrors, type ActionResult } from "./utils";
import {
  createEventSchema,
  updateEventSchema,
  searchEventsSchema,
  type Event,
  type EventWithVenues,
  type Venue,
  type CreateEventInput,
  type UpdateEventInput,
  type SearchEventsInput,
} from "@/types/database";
import { z } from "zod";

export async function getEvents(
  input: SearchEventsInput
): Promise<ActionResult<EventWithVenues[]>> {
  try {
    const validation = searchEventsSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: formatZodErrors(validation.error) };
    }

    const authResult = await validateAndGetUser();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    const supabase = await createClient();

    let query = supabase
      .from("events")
      .select("*")
      .eq("user_id", authResult.userId)
      .order("date_time", { ascending: true });

    if (input.query) {
      query = query.ilike("name", `%${input.query}%`);
    }

    if (input.sport_type) {
      query = query.eq("sport_type", input.sport_type);
    }

    const { data: events, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    // Fetch venues for each event
    const eventsWithVenues: EventWithVenues[] = await Promise.all(
      (events || []).map(async (event) => {
        const { data: eventVenues } = await supabase
          .from("event_venues")
          .select("venue_id")
          .eq("event_id", event.id);

        const venueIds = eventVenues?.map((ev) => ev.venue_id) || [];

        let venues: Venue[] = [];
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

    return { success: true, data: eventsWithVenues };
  } catch (error) {
    console.error("getEvents error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

const getEventByIdSchema = z.object({
  id: z.string().uuid("Invalid event ID"),
});

export async function getEvent(
  input: { id: string }
): Promise<ActionResult<EventWithVenues | null>> {
  try {
    const validation = getEventByIdSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: formatZodErrors(validation.error) };
    }

    const authResult = await validateAndGetUser();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", input.id)
      .eq("user_id", authResult.userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: true, data: null };
      }
      return { success: false, error: error.message };
    }

    // Fetch venues for the event
    const { data: eventVenues } = await supabase
      .from("event_venues")
      .select("venue_id")
      .eq("event_id", event.id);

    const venueIds = eventVenues?.map((ev) => ev.venue_id) || [];

    let venues: Venue[] = [];
    if (venueIds.length > 0) {
      const { data: venueData } = await supabase
        .from("venues")
        .select("*")
        .in("id", venueIds);
      venues = venueData || [];
    }

    return { success: true, data: { ...event, venues } };
  } catch (error) {
    console.error("getEvent error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function createEvent(
  input: CreateEventInput
): Promise<ActionResult<Event>> {
  try {
    const validation = createEventSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: formatZodErrors(validation.error) };
    }

    const authResult = await validateAndGetUser();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        user_id: authResult.userId,
        name: input.name,
        sport_type: input.sport_type,
        date_time: input.date_time,
        description: input.description || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
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
        return { success: false, error: venueError.message };
      }
    }

    return { success: true, data: event };
  } catch (error) {
    console.error("createEvent error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateEvent(
  input: UpdateEventInput
): Promise<ActionResult<Event>> {
  try {
    const validation = updateEventSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: formatZodErrors(validation.error) };
    }

    const authResult = await validateAndGetUser();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

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
      .eq("user_id", authResult.userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
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
          return { success: false, error: venueError.message };
        }
      }
    }

    return { success: true, data: event };
  } catch (error) {
    console.error("updateEvent error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

const deleteEventSchema = z.object({
  id: z.string().uuid("Invalid event ID"),
});

export async function deleteEvent(
  input: { id: string }
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const validation = deleteEventSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: formatZodErrors(validation.error) };
    }

    const authResult = await validateAndGetUser();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", input.id)
      .eq("user_id", authResult.userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("deleteEvent error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
