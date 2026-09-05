"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FreedomMetrics {
  // User baseline params
  hoursPerWeek: number;
  weeksPerYear: number;
  annualWorkingHours: number;
  savingsTargetPercent: number;
  taxRatePercent: number;

  // Actual current metrics
  currentHourlyRate: number;
  currentAnnualGross: number;
  currentMonthlyNet: number;

  // Tier 1: Barebones Floor
  barebonesAnnualNet: number;
  barebonesAnnualGross: number;
  barebonesHourly: number;
  barebonesMonthlyGross: number;

  // Tier 2: Comfortable Living
  comfortableAnnualNet: number;
  comfortableAnnualGross: number;
  comfortableHourly: number;
  comfortableMonthlyGross: number;

  // Tier 3: Freedom Number (Wealth Builder)
  freedomAnnualNet: number;
  freedomAnnualGross: number;
  freedomHourly: number;
  freedomMonthlyGross: number;
  monthlyWealthSurplusTarget: number;

  // Deltas & Status
  hourlyDeltaVsComfortable: number;
  hourlyDeltaVsFreedom: number;
  annualSurplusVsComfortable: number;
  freedomReadinessPercent: number;
  status: "below_barebones" | "survival" | "comfortable" | "freedom_achieved";
}

export async function calculateFreedomMetrics(params?: {
  hoursPerWeek?: number;
  weeksPerYear?: number;
  savingsTargetPercent?: number;
  taxRatePercent?: number;
}): Promise<FreedomMetrics> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let barebonesMonthly = 2500;
  let comfortableMonthly = 4000;
  let currentMonthlyGross = 5000;
  let currentMonthlyNet = 3900;
  let hoursPerWeek = params?.hoursPerWeek ?? 40;
  let weeksPerYear = params?.weeksPerYear ?? 50;
  let savingsTargetPercent = params?.savingsTargetPercent ?? 20;
  let taxRatePercent = params?.taxRatePercent ?? 22;

  if (user) {
    const { data: profile } = await supabase
      .from("user_income_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      if (Number(profile.barebones_monthly) > 0) barebonesMonthly = Number(profile.barebones_monthly);
      if (Number(profile.comfortable_monthly) > 0) comfortableMonthly = Number(profile.comfortable_monthly);
      if (Number(profile.monthly_gross_income) > 0) currentMonthlyGross = Number(profile.monthly_gross_income);
      if (Number(profile.monthly_net_income) > 0) currentMonthlyNet = Number(profile.monthly_net_income);

      if (params?.hoursPerWeek === undefined && profile.work_hours_per_week) {
        hoursPerWeek = Number(profile.work_hours_per_week);
      }
      if (params?.weeksPerYear === undefined && profile.work_weeks_per_year) {
        weeksPerYear = Number(profile.work_weeks_per_year);
      }
      if (params?.savingsTargetPercent === undefined && profile.savings_target_percent) {
        savingsTargetPercent = Number(profile.savings_target_percent);
      }
      if (params?.taxRatePercent === undefined && profile.tax_rate_percent) {
        taxRatePercent = Number(profile.tax_rate_percent);
      }
    }
  }

  // Safety clamps
  hoursPerWeek = Math.max(1, Math.min(100, hoursPerWeek));
  weeksPerYear = Math.max(1, Math.min(52, weeksPerYear));
  savingsTargetPercent = Math.max(0, Math.min(80, savingsTargetPercent));
  taxRatePercent = Math.max(0, Math.min(50, taxRatePercent));

  const annualWorkingHours = hoursPerWeek * weeksPerYear;
  const taxMultiplier = 1 - taxRatePercent / 100;
  const savingsDivisor = 1 - savingsTargetPercent / 100;

  // Tier 1: Barebones Survival Floor
  const barebonesAnnualNet = barebonesMonthly * 12;
  const barebonesAnnualGross = taxMultiplier > 0 ? barebonesAnnualNet / taxMultiplier : barebonesAnnualNet;
  const barebonesHourly = annualWorkingHours > 0 ? barebonesAnnualGross / annualWorkingHours : 0;
  const barebonesMonthlyGross = barebonesAnnualGross / 12;

  // Tier 2: Comfortable Living Baseline
  const comfortableAnnualNet = comfortableMonthly * 12;
  const comfortableAnnualGross = taxMultiplier > 0 ? comfortableAnnualNet / taxMultiplier : comfortableAnnualNet;
  const comfortableHourly = annualWorkingHours > 0 ? comfortableAnnualGross / annualWorkingHours : 0;
  const comfortableMonthlyGross = comfortableAnnualGross / 12;

  // Tier 3: Freedom Number (Wealth Builder)
  // Required Net to sustain comfortable living while saving desired percentage
  const freedomAnnualNet = savingsDivisor > 0 ? comfortableAnnualNet / savingsDivisor : comfortableAnnualNet;
  const freedomAnnualGross = taxMultiplier > 0 ? freedomAnnualNet / taxMultiplier : freedomAnnualNet;
  const freedomHourly = annualWorkingHours > 0 ? freedomAnnualGross / annualWorkingHours : 0;
  const freedomMonthlyGross = freedomAnnualGross / 12;
  const monthlyWealthSurplusTarget = (freedomAnnualNet - comfortableAnnualNet) / 12;

  // Current user metrics
  const currentAnnualGross = currentMonthlyGross * 12;
  const currentHourlyRate = annualWorkingHours > 0 ? currentAnnualGross / annualWorkingHours : 0;

  // Deltas
  const hourlyDeltaVsComfortable = currentHourlyRate - comfortableHourly;
  const hourlyDeltaVsFreedom = currentHourlyRate - freedomHourly;
  const annualSurplusVsComfortable = currentAnnualGross - comfortableAnnualGross;

  const freedomReadinessPercent =
    freedomAnnualGross > 0
      ? Math.min(150, Math.round((currentAnnualGross / freedomAnnualGross) * 100))
      : 0;

  let status: FreedomMetrics["status"] = "survival";
  if (currentHourlyRate < barebonesHourly) {
    status = "below_barebones";
  } else if (currentHourlyRate < comfortableHourly) {
    status = "survival";
  } else if (currentHourlyRate < freedomHourly) {
    status = "comfortable";
  } else {
    status = "freedom_achieved";
  }

  return {
    hoursPerWeek,
    weeksPerYear,
    annualWorkingHours,
    savingsTargetPercent,
    taxRatePercent,
    currentHourlyRate: Math.round(currentHourlyRate * 100) / 100,
    currentAnnualGross: Math.round(currentAnnualGross),
    currentMonthlyNet: Math.round(currentMonthlyNet),
    barebonesAnnualNet: Math.round(barebonesAnnualNet),
    barebonesAnnualGross: Math.round(barebonesAnnualGross),
    barebonesHourly: Math.round(barebonesHourly * 100) / 100,
    barebonesMonthlyGross: Math.round(barebonesMonthlyGross),
    comfortableAnnualNet: Math.round(comfortableAnnualNet),
    comfortableAnnualGross: Math.round(comfortableAnnualGross),
    comfortableHourly: Math.round(comfortableHourly * 100) / 100,
    comfortableMonthlyGross: Math.round(comfortableMonthlyGross),
    freedomAnnualNet: Math.round(freedomAnnualNet),
    freedomAnnualGross: Math.round(freedomAnnualGross),
    freedomHourly: Math.round(freedomHourly * 100) / 100,
    freedomMonthlyGross: Math.round(freedomMonthlyGross),
    monthlyWealthSurplusTarget: Math.round(monthlyWealthSurplusTarget),
    hourlyDeltaVsComfortable: Math.round(hourlyDeltaVsComfortable * 100) / 100,
    hourlyDeltaVsFreedom: Math.round(hourlyDeltaVsFreedom * 100) / 100,
    annualSurplusVsComfortable: Math.round(annualSurplusVsComfortable),
    freedomReadinessPercent,
    status,
  };
}

export async function saveFreedomPreferences(data: {
  work_hours_per_week: number;
  work_weeks_per_year: number;
  savings_target_percent: number;
  tax_rate_percent: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { error } = await supabase
    .from("user_income_profiles")
    .update({
      work_hours_per_week: data.work_hours_per_week,
      work_weeks_per_year: data.work_weeks_per_year,
      savings_target_percent: data.savings_target_percent,
      tax_rate_percent: data.tax_rate_percent,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}
