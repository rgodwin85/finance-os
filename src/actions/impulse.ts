"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ImpulseItemData {
  id: string;
  name: string;
  amount: number;
  reason: string | null;
  locked_at: string;
  unlocks_at: string;
  status: "cooling" | "purchased" | "cancelled_saved";
  created_at: string;
  hoursRemaining: number;
  minutesRemaining: number;
  isUnlocked: boolean;
}

export interface ImpulseLockerState {
  items: ImpulseItemData[];
  activeCoolingCount: number;
  totalSaved: number;
}

export async function getImpulseLockerState(): Promise<ImpulseLockerState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { items: [], activeCoolingCount: 0, totalSaved: 0 };
  }

  const [{ data: items, error }, { data: profile }] = await Promise.all([
    supabase
      .from("impulse_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_income_profiles")
      .select("total_impulse_saved")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (error || !items) {
    return { items: [], activeCoolingCount: 0, totalSaved: Number(profile?.total_impulse_saved || 0) };
  }

  const now = new Date().getTime();

  const formattedItems: ImpulseItemData[] = items.map((item: any) => {
    const unlockTime = new Date(item.unlocks_at).getTime();
    const diffMs = unlockTime - now;
    const isUnlocked = diffMs <= 0 || item.status !== "cooling";
    const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const hoursRemaining = Math.floor(totalMinutes / 60);
    const minutesRemaining = totalMinutes % 60;

    return {
      id: item.id,
      name: item.name,
      amount: Number(item.amount),
      reason: item.reason,
      locked_at: item.locked_at,
      unlocks_at: item.unlocks_at,
      status: item.status,
      created_at: item.created_at,
      hoursRemaining,
      minutesRemaining,
      isUnlocked,
    };
  });

  const activeCoolingCount = formattedItems.filter((i) => i.status === "cooling").length;
  const totalSaved = Number(profile?.total_impulse_saved || 0);

  return {
    items: formattedItems,
    activeCoolingCount,
    totalSaved,
  };
}

export async function quarantineImpulseItem(data: {
  name: string;
  amount: number;
  reason?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };
  if (data.amount <= 0) return { error: "Amount must be greater than $0" };

  const now = new Date();
  const unlocksAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const { data: item, error } = await supabase
    .from("impulse_items")
    .insert({
      user_id: user.id,
      name: data.name.trim(),
      amount: data.amount,
      reason: data.reason?.trim() || null,
      locked_at: now.toISOString(),
      unlocks_at: unlocksAt.toISOString(),
      status: "cooling",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true, data: item };
}

export async function cancelImpulseItem(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { data: item, error: fetchErr } = await supabase
    .from("impulse_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !item) return { error: "Impulse item not found" };

  const { error: updateErr } = await supabase
    .from("impulse_items")
    .update({
      status: "cancelled_saved",
    })
    .eq("id", id);

  if (updateErr) return { error: updateErr.message };

  // Increment total_impulse_saved in user_income_profiles
  const { data: profile } = await supabase
    .from("user_income_profiles")
    .select("total_impulse_saved")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentSaved = Number(profile?.total_impulse_saved || 0);
  const newSaved = currentSaved + Number(item.amount);

  await supabase
    .from("user_income_profiles")
    .update({
      total_impulse_saved: newSaved,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  revalidatePath("/");
  return { success: true, amountSaved: Number(item.amount), newTotalSaved: newSaved };
}

export async function unlockAndPurchaseImpulseItem(id: string, categoryId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { data: item, error: fetchErr } = await supabase
    .from("impulse_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !item) return { error: "Impulse item not found" };

  const { error: updateErr } = await supabase
    .from("impulse_items")
    .update({
      status: "purchased",
    })
    .eq("id", id);

  if (updateErr) return { error: updateErr.message };

  // Log as actual expense in transactions
  await supabase.from("transactions").insert({
    user_id: user.id,
    amount: Number(item.amount),
    category_id: categoryId || null,
    date: new Date().toISOString().split("T")[0],
    description: `Cooling Locker Released: ${item.name}`,
  });

  revalidatePath("/");
  return { success: true };
}
