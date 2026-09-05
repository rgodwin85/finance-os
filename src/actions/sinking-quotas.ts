"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SinkingFundQuotaItem {
  id: string;
  name: string;
  target_amount: number;
  current_balance: number;
  monthly_contribution: number;
  target_date: string | null;
  priority: "high" | "medium" | "low";
  daysRemaining: number | null;
  monthsRemaining: number | null;
  remainingAmount: number;
  penniesPerDay: number;
  recommendedMonthlyQuota: number;
  pacingStatus: "fully_funded" | "on_track" | "behind" | "due_soon" | "no_date";
}

export async function getSinkingFundQuotas(): Promise<SinkingFundQuotaItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("sinking_funds")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return data.map((fund: any) => {
    const target = Number(fund.target_amount || 0);
    const balance = Number(fund.current_balance || 0);
    const monthly = Number(fund.monthly_contribution || 0);
    const remaining = Math.max(0, target - balance);
    const targetDateStr = fund.target_date;

    let daysRemaining: number | null = null;
    let monthsRemaining: number | null = null;
    let penniesPerDay = 0;
    let recommendedMonthlyQuota = monthly;
    let pacingStatus: SinkingFundQuotaItem["pacingStatus"] = "no_date";

    if (balance >= target && target > 0) {
      pacingStatus = "fully_funded";
    } else if (targetDateStr) {
      const targetDate = new Date(targetDateStr);
      targetDate.setHours(0, 0, 0, 0);
      const diffMs = targetDate.getTime() - today.getTime();
      daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30.4));

      penniesPerDay = Math.round((remaining / daysRemaining) * 100) / 100;
      recommendedMonthlyQuota = Math.round(remaining / monthsRemaining);

      if (daysRemaining <= 14) {
        pacingStatus = "due_soon";
      } else if (monthly >= recommendedMonthlyQuota) {
        pacingStatus = "on_track";
      } else {
        pacingStatus = "behind";
      }
    } else if (monthly > 0 && target > 0) {
      monthsRemaining = Math.ceil(remaining / monthly);
      daysRemaining = monthsRemaining * 30;
      penniesPerDay = Math.round((remaining / daysRemaining) * 100) / 100;
      pacingStatus = "on_track";
    }

    return {
      id: fund.id,
      name: fund.name,
      target_amount: target,
      current_balance: balance,
      monthly_contribution: monthly,
      target_date: targetDateStr,
      priority: (fund.priority as any) || "medium",
      daysRemaining,
      monthsRemaining,
      remainingAmount: remaining,
      penniesPerDay,
      recommendedMonthlyQuota,
      pacingStatus,
    };
  });
}

export async function updateSinkingFundTargetDate(fundId: string, targetDate: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { error } = await supabase
    .from("sinking_funds")
    .update({
      target_date: targetDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fundId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function updateSinkingFundMonthlyContribution(fundId: string, newMonthly: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { error } = await supabase
    .from("sinking_funds")
    .update({
      monthly_contribution: newMonthly,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fundId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}
