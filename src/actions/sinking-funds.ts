"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SinkingFundItem {
  id: string;
  name: string;
  target_amount: number;
  current_balance: number;
  monthly_contribution: number;
  category_id?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getSinkingFunds(): Promise<SinkingFundItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sinking_funds")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching sinking funds:", error);
    return [];
  }

  return (data || []).map((f) => ({
    id: f.id,
    name: f.name,
    target_amount: Number(f.target_amount),
    current_balance: Number(f.current_balance),
    monthly_contribution: Number(f.monthly_contribution),
    category_id: f.category_id,
    created_at: f.created_at,
    updated_at: f.updated_at,
  }));
}

export async function createSinkingFund(formData: {
  name: string;
  target_amount: number;
  monthly_contribution: number;
  initial_balance?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be authenticated to create a sinking fund" };
  }

  const { data, error } = await supabase
    .from("sinking_funds")
    .insert({
      user_id: user.id,
      name: formData.name,
      target_amount: formData.target_amount,
      current_balance: formData.initial_balance || 0,
      monthly_contribution: formData.monthly_contribution,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { data };
}

/**
 * Executes month-end rollover: adds monthly_contribution to current_balance
 * ensuring unused funds roll over and accumulate without resetting.
 */
export async function rolloverSinkingFunds() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required" };
  }

  const { data: funds, error: fetchError } = await supabase
    .from("sinking_funds")
    .select("*")
    .eq("user_id", user.id);

  if (fetchError || !funds) {
    return { error: fetchError?.message || "Failed to fetch funds" };
  }

  const updates = funds.map((fund) => {
    const updatedBalance = Number(fund.current_balance) + Number(fund.monthly_contribution);
    return supabase
      .from("sinking_funds")
      .update({
        current_balance: updatedBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fund.id);
  });

  await Promise.all(updates);

  revalidatePath("/");
  return { success: true, count: funds.length };
}

export async function adjustFundBalance(fundId: string, deltaAmount: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required" };
  }

  const { data: fund, error: fetchErr } = await supabase
    .from("sinking_funds")
    .select("current_balance")
    .eq("id", fundId)
    .single();

  if (fetchErr || !fund) {
    return { error: "Fund not found" };
  }

  const newBalance = Math.max(0, Number(fund.current_balance) + deltaAmount);

  const { error: updateErr } = await supabase
    .from("sinking_funds")
    .update({
      current_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fundId);

  if (updateErr) {
    return { error: updateErr.message };
  }

  revalidatePath("/");
  return { success: true, newBalance };
}
