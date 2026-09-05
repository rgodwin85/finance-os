"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface WizardSubmitPayload {
  income: {
    monthly_gross_income: number;
    monthly_net_income: number;
    pay_frequency: "weekly" | "bi-weekly" | "monthly" | "variable";
    tax_rate_percent: number;
  };
  fixedItems: Array<{
    name: string;
    monthlyAmount: number;
    optedOut: boolean;
  }>;
  variableItems: Array<{
    name: string;
    monthlyAmount: number;
    optedOut: boolean;
    isSubscription?: boolean;
  }>;
  sinkingItems: Array<{
    name: string;
    monthlyAmount: number;
    optedOut: boolean;
  }>;
  debts: Array<{
    name: string;
    balance: number;
    interestRate: number;
    minimumPayment: number;
    strategy: "avalanche" | "snowball";
  }>;
}

export async function completeSetupWizard(payload: WizardSubmitPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required to complete setup wizard." };
  }

  // 1. Calculate Barebones & Comfortable totals
  const activeFixed = payload.fixedItems.filter((i) => !i.optedOut);
  const activeVariable = payload.variableItems.filter((i) => !i.optedOut);
  const activeSinking = payload.sinkingItems.filter((i) => !i.optedOut);

  const totalFixed = activeFixed.reduce((acc, i) => acc + i.monthlyAmount, 0);
  const totalDebtMin = payload.debts.reduce((acc, d) => acc + d.minimumPayment, 0);
  const barebonesMonthly = Math.round(totalFixed + totalDebtMin);

  const totalVariable = activeVariable.reduce((acc, i) => acc + i.monthlyAmount, 0);
  const totalSinking = activeSinking.reduce((acc, i) => acc + i.monthlyAmount, 0);
  const comfortableMonthly = Math.round(barebonesMonthly + totalVariable + totalSinking);

  // 2. Save User Income Profile
  const { error: profileError } = await supabase
    .from("user_income_profiles")
    .upsert(
      {
        user_id: user.id,
        monthly_gross_income: payload.income.monthly_gross_income,
        monthly_net_income: payload.income.monthly_net_income,
        pay_frequency: payload.income.pay_frequency,
        tax_rate_percent: payload.income.tax_rate_percent,
        barebones_monthly: barebonesMonthly,
        comfortable_monthly: comfortableMonthly,
        wizard_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    console.error("Error saving income profile:", profileError);
    return { error: profileError.message };
  }

  // 3. Populate Categories
  const categoriesToInsert = [
    ...activeFixed.map((i) => ({
      user_id: user.id,
      name: i.name,
      type: "fixed",
      target_monthly: i.monthlyAmount,
      rollover_rule: "sweep",
      is_subscription: false,
    })),
    ...activeVariable.map((i) => ({
      user_id: user.id,
      name: i.name,
      type: "variable",
      target_monthly: i.monthlyAmount,
      rollover_rule: "sweep",
      is_subscription: i.isSubscription || false,
    })),
    ...activeSinking.map((i) => ({
      user_id: user.id,
      name: i.name,
      type: "sinking_fund",
      target_monthly: i.monthlyAmount,
      rollover_rule: "rollover",
      is_subscription: false,
    })),
  ];

  if (categoriesToInsert.length > 0) {
    // Clean old default categories for this user and insert configured ones
    await supabase.from("categories").delete().eq("user_id", user.id);
    await supabase.from("categories").insert(categoriesToInsert);
  }

  // 4. Seed Sinking Funds
  if (activeSinking.length > 0) {
    const existingFunds = await supabase.from("sinking_funds").select("name").eq("user_id", user.id);
    const existingNames = new Set((existingFunds.data || []).map((f) => f.name.toLowerCase()));

    const fundsToInsert = activeSinking
      .filter((s) => !existingNames.has(s.name.toLowerCase()))
      .map((s) => ({
        user_id: user.id,
        name: s.name,
        target_amount: Math.round(s.monthlyAmount * 12), // Default annual cap
        current_balance: 0,
        monthly_contribution: s.monthlyAmount,
      }));

    if (fundsToInsert.length > 0) {
      await supabase.from("sinking_funds").insert(fundsToInsert);
    }
  }

  // 5. Seed Debts
  if (payload.debts.length > 0) {
    await supabase.from("debts").delete().eq("user_id", user.id);
    const debtsToInsert = payload.debts.map((d) => ({
      user_id: user.id,
      name: d.name,
      balance: d.balance,
      interest_rate: d.interestRate,
      minimum_payment: d.minimumPayment,
      strategy: d.strategy,
    }));
    await supabase.from("debts").insert(debtsToInsert);
  }

  // 6. DYNAMIC WATERFALL CALIBRATION
  // Stage 1 = 3 x Barebones
  // Stage 2 = 6 x Comfortable
  // Stage 3 = Total High-Interest Debt Balance
  const dynamicStage1 = Math.max(1000, Math.round(barebonesMonthly * 3));
  const dynamicStage2 = Math.max(dynamicStage1 * 2, Math.round(comfortableMonthly * 6));
  const totalDebtBalance = payload.debts.reduce((acc, d) => acc + d.balance, 0);

  // Update or insert Milestone Stages
  const stagesToUpsert = [
    {
      user_id: user.id,
      waterfall_stage: 1,
      name: "Stage 1: 3-Month Barebones Emergency Fund",
      target_amount: dynamicStage1,
    },
    {
      user_id: user.id,
      waterfall_stage: 2,
      name: "Stage 2: 6-Month Full Emergency Fund",
      target_amount: dynamicStage2,
    },
  ];

  if (totalDebtBalance > 0) {
    stagesToUpsert.push({
      user_id: user.id,
      waterfall_stage: 3,
      name: "Stage 3: High-Interest Consumer Debt Payoff",
      target_amount: totalDebtBalance,
    });
  }

  for (const s of stagesToUpsert) {
    const existing = await supabase
      .from("milestones")
      .select("id, current_amount")
      .eq("user_id", user.id)
      .eq("waterfall_stage", s.waterfall_stage)
      .maybeSingle();

    if (existing.data) {
      const current = Number(existing.data.current_amount);
      await supabase
        .from("milestones")
        .update({
          target_amount: s.target_amount,
          is_completed: current >= s.target_amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.data.id);
    } else {
      await supabase.from("milestones").insert({
        user_id: user.id,
        waterfall_stage: s.waterfall_stage,
        name: s.name,
        target_amount: s.target_amount,
        current_amount: 0,
        is_completed: false,
      });
    }
  }

  revalidatePath("/");
  return {
    success: true,
    barebonesMonthly,
    comfortableMonthly,
    dynamicStage1,
    dynamicStage2,
    netMonthlyCashFlow: payload.income.monthly_net_income - comfortableMonthly,
  };
}
