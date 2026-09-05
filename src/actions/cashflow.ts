"use server";

import { createClient } from "@/lib/supabase/server";

export interface CashFlowRunRate {
  daysUntilPayday: number;
  daysElapsedInPeriod: number;
  totalPeriodDays: number;
  totalVariableBudget: number;
  spentVariableSoFar: number;
  remainingVariableBudget: number;
  safeDailySpendPace: number;
  actualDailyBurnRate: number;
  pacingStatus: "frugal" | "on_track" | "pacing_hot" | "over_limit";
  projectedSurplusAtPayday: number;
}

export async function getCashFlowRunRate(): Promise<CashFlowRunRate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const currentDay = now.getDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  let payFrequency: "weekly" | "bi-weekly" | "monthly" = "bi-weekly";
  let totalPeriodDays = 14;
  let daysUntilPayday = 7;
  let daysElapsedInPeriod = 7;

  if (user) {
    const { data: profile } = await supabase
      .from("user_income_profiles")
      .select("pay_frequency")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.pay_frequency) {
      if (profile.pay_frequency === "weekly") {
        totalPeriodDays = 7;
        const dayOfWeek = now.getDay(); // 0 is Sunday, 5 is Friday
        daysUntilPayday = Math.max(1, (5 - dayOfWeek + 7) % 7 || 7);
        daysElapsedInPeriod = Math.max(1, totalPeriodDays - daysUntilPayday);
      } else if (profile.pay_frequency === "monthly") {
        totalPeriodDays = daysInMonth;
        daysUntilPayday = Math.max(1, daysInMonth - currentDay);
        daysElapsedInPeriod = Math.max(1, currentDay);
      } else {
        // Bi-weekly (every 14 days, e.g. 1st & 15th)
        totalPeriodDays = 14;
        if (currentDay <= 15) {
          daysUntilPayday = Math.max(1, 15 - currentDay);
          daysElapsedInPeriod = Math.max(1, currentDay);
        } else {
          daysUntilPayday = Math.max(1, daysInMonth - currentDay);
          daysElapsedInPeriod = Math.max(1, currentDay - 15);
        }
      }
    }
  }

  // Get variable categories
  let totalVariableBudget = 1200;
  let spentVariableSoFar = 450;

  if (user) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, target_monthly")
      .eq("user_id", user.id)
      .eq("type", "variable");

    if (categories && categories.length > 0) {
      totalVariableBudget = categories.reduce((sum, c) => sum + Number(c.target_monthly || 0), 0);
      const catIds = categories.map((c) => c.id);

      // Start of current month
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const { data: txs } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .in("category_id", catIds)
        .gte("created_at", startOfMonth);

      if (txs) {
        spentVariableSoFar = txs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      }
    }
  }

  // Prorate variable budget to the current pay period
  const periodVariableBudget = Math.round((totalVariableBudget / 30.4) * totalPeriodDays);
  const remainingVariableBudget = Math.max(0, periodVariableBudget - spentVariableSoFar);

  const safeDailySpendPace =
    daysUntilPayday > 0 ? Math.round((remainingVariableBudget / daysUntilPayday) * 100) / 100 : 0;
  const actualDailyBurnRate =
    daysElapsedInPeriod > 0 ? Math.round((spentVariableSoFar / daysElapsedInPeriod) * 100) / 100 : 0;

  const projectedBurn = actualDailyBurnRate * totalPeriodDays;
  const projectedSurplusAtPayday = Math.round(periodVariableBudget - projectedBurn);

  let pacingStatus: CashFlowRunRate["pacingStatus"] = "on_track";
  if (remainingVariableBudget <= 0) {
    pacingStatus = "over_limit";
  } else if (actualDailyBurnRate > safeDailySpendPace * 1.25) {
    pacingStatus = "pacing_hot";
  } else if (actualDailyBurnRate < safeDailySpendPace * 0.75) {
    pacingStatus = "frugal";
  } else {
    pacingStatus = "on_track";
  }

  return {
    daysUntilPayday,
    daysElapsedInPeriod,
    totalPeriodDays,
    totalVariableBudget: periodVariableBudget,
    spentVariableSoFar: Math.round(spentVariableSoFar),
    remainingVariableBudget: Math.round(remainingVariableBudget),
    safeDailySpendPace,
    actualDailyBurnRate,
    pacingStatus,
    projectedSurplusAtPayday,
  };
}
