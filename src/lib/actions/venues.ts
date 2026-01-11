"use server";

import { createClient } from "@/lib/supabase/server";
import { createAction } from "./safe-action";
import {
  createVenueSchema,
  type Venue,
  type CreateVenueInput,
} from "@/types/database";
import { z } from "zod";

const emptySchema = z.object({});

export const getVenues = createAction(
  emptySchema,
  async (): Promise<Venue[]> => {
    const supabase = await createClient();

    const { data: venues, error } = await supabase
      .from("venues")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return venues || [];
  }
);

export const createVenue = createAction(
  createVenueSchema,
  async (input: CreateVenueInput): Promise<Venue> => {
    const supabase = await createClient();

    const { data: venue, error } = await supabase
      .from("venues")
      .insert({
        name: input.name,
        address: input.address || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return venue;
  }
);