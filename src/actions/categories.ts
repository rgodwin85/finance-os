"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CategoryWithBudget {
  id: string;
  name: string;
  type: "fixed" | "variable" | "sinking_fund";
  target_monthly: number;
  spent_this_month: number;
  remaining_this_month: number;
  percent_spent: number;
  is_overspent: boolean;
  rollover_rule: "sweep" | "rollover";
  is_subscription: boolean;
  flagged_for_cancellation: boolean;
}

export async function getCategoriesWithBudget(): Promise<CategoryWithBudget[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get start of current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const [catRes, txRes] = await Promise.all([
    supabase.from("categories").select("*").eq("user_id", user.id).order("name"),
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("user_id", user.id)
      .gte("date", firstDayOfMonth),
  ]);

  const categories = catRes.data || [];
  const transactions = txRes.data || [];

  // Group transactions by category_id
  const spendingMap: Record<string, number> = {};
  transactions.forEach((tx) => {
    if (tx.category_id) {
      spendingMap[tx.category_id] = (spendingMap[tx.category_id] || 0) + Number(tx.amount);
    }
  });

  return categories.map((c) => {
    const target = Number(c.target_monthly);
    const spent = spendingMap[c.id] || 0;
    const remaining = target - spent;
    const percentSpent = target > 0 ? Math.min(100, Math.round((spent / target) * 100)) : (spent > 0 ? 100 : 0);
    const isOverspent = target > 0 && spent > target;

    return {
      id: c.id,
      name: c.name,
      type: c.type as any,
      target_monthly: target,
      spent_this_month: spent,
      remaining_this_month: remaining,
      percent_spent: percentSpent,
      is_overspent: isOverspent,
      rollover_rule: (c.rollover_rule as any) || "sweep",
      is_subscription: c.is_subscription || false,
      flagged_for_cancellation: c.flagged_for_cancellation || false,
    };
  });
}

export async function updateCategory(
  id: string,
  updates: {
    name?: string;
    target_monthly?: number;
    rollover_rule?: "sweep" | "rollover";
    is_subscription?: boolean;
    flagged_for_cancellation?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function toggleSubscriptionCancellation(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { data: cat } = await supabase
    .from("categories")
    .select("flagged_for_cancellation")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!cat) return { error: "Category not found" };

  const { error } = await supabase
    .from("categories")
    .update({ flagged_for_cancellation: !cat.flagged_for_cancellation })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true, flagged: !cat.flagged_for_cancellation };
}

/**
 * "Money Must Move" Enforcer (Feature #7):
 * Rebalances funds between two categories when one envelope is overspent.
 */
export async function rebalanceCategories(
  fromCategoryId: string,
  toCategoryId: string,
  amount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };
  if (amount <= 0) return { error: "Rebalance amount must be greater than $0" };

  const [fromRes, toRes] = await Promise.all([
    supabase.from("categories").select("*").eq("id", fromCategoryId).eq("user_id", user.id).single(),
    supabase.from("categories").select("*").eq("id", toCategoryId).eq("user_id", user.id).single(),
  ]);

  if (!fromRes.data || !toRes.data) {
    return { error: "One or both categories not found" };
  }

  const fromNewTarget = Math.max(0, Number(fromRes.data.target_monthly) - amount);
  const toNewTarget = Number(toRes.data.target_monthly) + amount;

  await Promise.all([
    supabase.from("categories").update({ target_monthly: fromNewTarget }).eq("id", fromCategoryId),
    supabase.from("categories").update({ target_monthly: toNewTarget }).eq("id", toCategoryId),
  ]);

  revalidatePath("/");
  return { success: true, fromNewTarget, toNewTarget };
}
