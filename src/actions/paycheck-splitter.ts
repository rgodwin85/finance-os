"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { allocateWaterfallFunds, getWaterfallData } from "@/actions/waterfall";

export interface PaycheckSplitPreview {
  paycheckAmount: number;
  fixedPct: number;
  fixedAmount: number;
  variablePct: number;
  variableAmount: number;
  sinkingPct: number;
  sinkingAmount: number;
  waterfallPct: number;
  waterfallAmount: number;
  activeStageNumber: number;
  activeStageName: string;
}

export interface DisbursementReceipt {
  success: boolean;
  error?: string;
  paycheckAmount: number;
  fixedAmount: number;
  variableAmount: number;
  sinkingAmount: number;
  waterfallAmount: number;
  fundedStageNumber?: number;
  fundedStageName?: string;
  newMilestoneBalance?: number;
}

export async function previewPaycheckSplit(
  paycheckAmount: number,
  customPcts?: {
    fixedPct?: number;
    variablePct?: number;
    sinkingPct?: number;
    waterfallPct?: number;
  }
): Promise<PaycheckSplitPreview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fixedPct = customPcts?.fixedPct ?? 50;
  let variablePct = customPcts?.variablePct ?? 30;
  let sinkingPct = customPcts?.sinkingPct ?? 10;
  let waterfallPct = customPcts?.waterfallPct ?? 10;

  if (user && !customPcts) {
    const { data: profile } = await supabase
      .from("user_income_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      if (profile.paycheck_split_fixed_pct !== undefined) fixedPct = Number(profile.paycheck_split_fixed_pct);
      if (profile.paycheck_split_variable_pct !== undefined) variablePct = Number(profile.paycheck_split_variable_pct);
      if (profile.paycheck_split_sinking_pct !== undefined) sinkingPct = Number(profile.paycheck_split_sinking_pct);
      if (profile.paycheck_split_waterfall_pct !== undefined) waterfallPct = Number(profile.paycheck_split_waterfall_pct);
    }
  }

  // Normalize percentages to 100%
  const totalPct = fixedPct + variablePct + sinkingPct + waterfallPct;
  if (totalPct > 0 && totalPct !== 100) {
    fixedPct = Math.round((fixedPct / totalPct) * 100);
    variablePct = Math.round((variablePct / totalPct) * 100);
    sinkingPct = Math.round((sinkingPct / totalPct) * 100);
    waterfallPct = 100 - (fixedPct + variablePct + sinkingPct);
  }

  const fixedAmount = Math.round((paycheckAmount * fixedPct) / 100);
  const variableAmount = Math.round((paycheckAmount * variablePct) / 100);
  const sinkingAmount = Math.round((paycheckAmount * sinkingPct) / 100);
  const waterfallAmount = Math.max(0, paycheckAmount - (fixedAmount + variableAmount + sinkingAmount));

  const wf = await getWaterfallData();
  const activeStage = wf.stages.find((s) => s.stage === wf.activeStageNumber);

  return {
    paycheckAmount,
    fixedPct,
    fixedAmount,
    variablePct,
    variableAmount,
    sinkingPct,
    sinkingAmount,
    waterfallPct,
    waterfallAmount,
    activeStageNumber: wf.activeStageNumber,
    activeStageName: activeStage?.name || `Stage ${wf.activeStageNumber}`,
  };
}

export async function executePaycheckDisbursement(data: {
  paycheckAmount: number;
  fixedAmount: number;
  variableAmount: number;
  sinkingAmount: number;
  waterfallAmount: number;
  autoFundWaterfall?: boolean;
  note?: string;
}): Promise<DisbursementReceipt> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Authentication required",
      paycheckAmount: data.paycheckAmount,
      fixedAmount: data.fixedAmount,
      variableAmount: data.variableAmount,
      sinkingAmount: data.sinkingAmount,
      waterfallAmount: data.waterfallAmount,
    };
  }

  if (data.paycheckAmount <= 0) {
    return {
      success: false,
      error: "Paycheck amount must be greater than $0",
      paycheckAmount: data.paycheckAmount,
      fixedAmount: data.fixedAmount,
      variableAmount: data.variableAmount,
      sinkingAmount: data.sinkingAmount,
      waterfallAmount: data.waterfallAmount,
    };
  }

  const wf = await getWaterfallData();
  const activeStage = wf.stages.find((s) => s.stage === wf.activeStageNumber);

  let fundedStageNumber = wf.activeStageNumber;
  let fundedStageName = activeStage?.name || `Stage ${wf.activeStageNumber}`;
  let newMilestoneBalance: number | undefined;

  // 1. Auto-allocate Waterfall share to active stage
  if (data.waterfallAmount > 0 && data.autoFundWaterfall !== false) {
    const allocRes = await allocateWaterfallFunds(wf.activeStageNumber, data.waterfallAmount);
    if (allocRes.success && allocRes.newCurrent !== undefined) {
      newMilestoneBalance = allocRes.newCurrent;
    }
  }

  // 2. Record Paycheck Deposit in ledger
  const desc = data.note
    ? `Paycheck Split: ${data.note} (Bills: $${data.fixedAmount.toLocaleString()}, Living: $${data.variableAmount.toLocaleString()}, Sinking: $${data.sinkingAmount.toLocaleString()}, Waterfall: $${data.waterfallAmount.toLocaleString()})`
    : `Paycheck Split Disbursement: Bills $${data.fixedAmount.toLocaleString()} | Living $${data.variableAmount.toLocaleString()} | Sinking $${data.sinkingAmount.toLocaleString()} | Waterfall $${data.waterfallAmount.toLocaleString()}`;

  await supabase.from("transactions").insert({
    user_id: user.id,
    amount: data.paycheckAmount,
    date: new Date().toISOString().split("T")[0],
    description: desc,
  });

  revalidatePath("/");

  return {
    success: true,
    paycheckAmount: data.paycheckAmount,
    fixedAmount: data.fixedAmount,
    variableAmount: data.variableAmount,
    sinkingAmount: data.sinkingAmount,
    waterfallAmount: data.waterfallAmount,
    fundedStageNumber,
    fundedStageName,
    newMilestoneBalance,
  };
}

export async function savePaycheckSplitPreferences(data: {
  fixedPct: number;
  variablePct: number;
  sinkingPct: number;
  waterfallPct: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { error } = await supabase
    .from("user_income_profiles")
    .update({
      paycheck_split_fixed_pct: data.fixedPct,
      paycheck_split_variable_pct: data.variablePct,
      paycheck_split_sinking_pct: data.sinkingPct,
      paycheck_split_waterfall_pct: data.waterfallPct,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}
