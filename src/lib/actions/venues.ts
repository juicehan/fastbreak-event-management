"use server";

import { createClient } from "@/lib/supabase/server";
import { validateAndGetUser } from "./safe-action";
import { formatZodErrors, type ActionResult } from "./utils";
import {
  createVenueSchema,
  updateVenueSchema,
  type Venue,
  type CreateVenueInput,
  type UpdateVenueInput,
} from "@/types/database";

export async function getVenues(): Promise<ActionResult<Venue[]>> {
  try {
    const authResult = await validateAndGetUser();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    const supabase = await createClient();

    const { data: venues, error } = await supabase
      .from("venues")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: venues || [] };
  } catch (error) {
    console.error("getVenues error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function createVenue(
  input: CreateVenueInput
): Promise<ActionResult<Venue>> {
  try {
    const validation = createVenueSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: formatZodErrors(validation.error) };
    }

    const authResult = await validateAndGetUser();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    const supabase = await createClient();

    const { data: venue, error } = await supabase
      .from("venues")
      .insert({
        name: input.name,
        address: input.address,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: venue };
  } catch (error) {
    console.error("createVenue error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateVenue(
  input: UpdateVenueInput
): Promise<ActionResult<Venue>> {
  try {
    const validation = updateVenueSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: formatZodErrors(validation.error) };
    }

    const authResult = await validateAndGetUser();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    const supabase = await createClient();

    const { data: venue, error } = await supabase
      .from("venues")
      .update({
        name: input.name,
        address: input.address,
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: venue };
  } catch (error) {
    console.error("updateVenue error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
