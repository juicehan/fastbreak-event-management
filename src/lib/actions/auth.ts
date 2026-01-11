"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AuthResult =
  | { success: true }
  | { success: false; error: string };

export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      const errors = validation.error.issues
        .map((e) => e.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      const errors = validation.error.issues
        .map((e) => e.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Google sign in error:", error);
    redirect("/login?error=Could not authenticate with Google");
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}