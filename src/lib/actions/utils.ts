import { z } from "zod";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((e) => e.message).join(", ");
}
