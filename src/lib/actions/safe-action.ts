"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type ActionOptions = {
  requireAuth?: boolean;
};

export function createAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (input: TInput, userId: string) => Promise<TOutput>,
  options: ActionOptions = { requireAuth: true }
): (input: TInput) => Promise<ActionResult<TOutput>> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    try {
      // Validate input
      const validationResult = schema.safeParse(input);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((e) => e.message)
          .join(", ");
        return { success: false, error: errors };
      }

      // Check authentication if required
      let userId = "";
      if (options.requireAuth !== false) {
        const supabase = await createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return { success: false, error: "Unauthorized" };
        }
        userId = user.id;
      }

      // Execute handler
      const data = await handler(validationResult.data, userId);
      return { success: true, data };
    } catch (error) {
      console.error("Action error:", error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: "An unexpected error occurred" };
    }
  };
}