"use server";

import { createClient } from "@/lib/supabase/server";

export async function validateAndGetUser(): Promise<
  { userId: string } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  return { userId: user.id };
}
