"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface TransactionItem {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  category_id: string | null;
  category_name?: string;
  category_type?: string;
  created_at: string;
}

export async function getTransactions(limit: number = 20): Promise<TransactionItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
      amount,
      date,
      description,
      category_id,
      created_at,
      categories (
        name,
        type
      )
    `)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return (data || []).map((t: any) => ({
    id: t.id,
    amount: Number(t.amount),
    date: t.date,
    description: t.description,
    category_id: t.category_id,
    category_name: t.categories?.name || "General",
    category_type: t.categories?.type || "variable",
    created_at: t.created_at,
  }));
}

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    target_monthly: Number(c.target_monthly),
  }));
}

export async function addTransaction(formData: {
  amount: number;
  category_id?: string;
  category_name?: string;
  category_type?: "fixed" | "variable" | "sinking_fund";
  date?: string;
  description?: string;
  sinking_fund_id?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required" };
  }

  let resolvedCategoryId = formData.category_id;

  // If a category name was provided without an existing ID, create or find it
  if (!resolvedCategoryId && formData.category_name) {
    const { data: existingCat } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", user.id)
      .ilike("name", formData.category_name.trim())
      .maybeSingle();

    if (existingCat) {
      resolvedCategoryId = existingCat.id;
    } else {
      const { data: newCat, error: catError } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: formData.category_name.trim(),
          type: formData.category_type || "variable",
          target_monthly: 0,
        })
        .select("id")
        .single();

      if (!catError && newCat) {
        resolvedCategoryId = newCat.id;
      }
    }
  }

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      amount: formData.amount,
      category_id: resolvedCategoryId || null,
      date: formData.date || new Date().toISOString().split("T")[0],
      description: formData.description?.trim() || null,
    })
    .select()
    .single();

  if (txError) {
    return { error: txError.message };
  }

  // If this expense is tied to a sinking fund, deduct from its balance
  if (formData.sinking_fund_id) {
    const { data: fund } = await supabase
      .from("sinking_funds")
      .select("current_balance")
      .eq("id", formData.sinking_fund_id)
      .single();

    if (fund) {
      const updatedBalance = Math.max(0, Number(fund.current_balance) - formData.amount);
      await supabase
        .from("sinking_funds")
        .update({
          current_balance: updatedBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", formData.sinking_fund_id);
    }
  }

  revalidatePath("/");
  return { success: true, data: transaction };
}
