"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  };
}

export async function signInWithEmail(data: { email: string; password: string }) {
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email.trim(),
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true, user: authData.user };
}

export async function signUpWithEmail(data: { email: string; password: string }) {
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email.trim(),
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return {
    success: true,
    user: authData.user,
    requiresConfirmation: !authData.session,
  };
}

export async function signInWithOtp(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  return { success: true };
}
