"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface IncomeProfile {
  id?: string;
  user_id: string;
  monthly_gross_income: number;
  monthly_net_income: number;
  pay_frequency: "weekly" | "bi-weekly" | "monthly" | "variable";
  tax_rate_percent: number;
  barebones_monthly: number;
  comfortable_monthly: number;
  wizard_completed: boolean;
  is_variable_income: boolean;
  holding_buffer_balance: number;
  target_monthly_salary: number;
  work_hours_per_week: number;
  work_weeks_per_year: number;
  savings_target_percent: number;
  paycheck_split_fixed_pct: number;
  paycheck_split_variable_pct: number;
  paycheck_split_sinking_pct: number;
  paycheck_split_waterfall_pct: number;
}

export async function getIncomeProfile(): Promise<IncomeProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_income_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    monthly_gross_income: Number(data.monthly_gross_income || 0),
    monthly_net_income: Number(data.monthly_net_income || 0),
    pay_frequency: data.pay_frequency as any,
    tax_rate_percent: Number(data.tax_rate_percent || 22),
    barebones_monthly: Number(data.barebones_monthly || 0),
    comfortable_monthly: Number(data.comfortable_monthly || 0),
    wizard_completed: !!data.wizard_completed,
    is_variable_income: !!data.is_variable_income,
    holding_buffer_balance: Number(data.holding_buffer_balance || 0),
    target_monthly_salary: Number(data.target_monthly_salary || 0),
    work_hours_per_week: Number(data.work_hours_per_week || 40),
    work_weeks_per_year: Number(data.work_weeks_per_year || 50),
    savings_target_percent: Number(data.savings_target_percent || 20),
    paycheck_split_fixed_pct: Number(data.paycheck_split_fixed_pct || 50),
    paycheck_split_variable_pct: Number(data.paycheck_split_variable_pct || 30),
    paycheck_split_sinking_pct: Number(data.paycheck_split_sinking_pct || 10),
    paycheck_split_waterfall_pct: Number(data.paycheck_split_waterfall_pct || 10),
  };
}

export async function calculateNetTakeHome(
  grossAmount: number,
  frequency: "weekly" | "bi-weekly" | "monthly" | "annual",
  taxRatePercent: number = 22
): Promise<{ monthlyGross: number; monthlyNet: number; effectiveTax: number }> {
  let annualGross = 0;
  if (frequency === "weekly") annualGross = grossAmount * 52;
  else if (frequency === "bi-weekly") annualGross = grossAmount * 26;
  else if (frequency === "monthly") annualGross = grossAmount * 12;
  else annualGross = grossAmount;

  const monthlyGross = Math.round(annualGross / 12);
  const effectiveTax = Math.round(monthlyGross * (taxRatePercent / 100));
  const monthlyNet = monthlyGross - effectiveTax;

  return {
    monthlyGross,
    monthlyNet,
    effectiveTax,
  };
}
