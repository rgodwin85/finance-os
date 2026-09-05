"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  callLLMProvider,
  analyzeWithBuiltInEngine,
  AIProviderConfig,
  AICopilotAnalysisResult,
  ConsumableItemEstimate,
  VehicleEstimate,
} from "@/lib/ai-engine";

export interface AIApplyPayload {
  consumables: ConsumableItemEstimate[];
  vehicle?: VehicleEstimate;
}

export async function analyzeVoiceBudgetInput(
  text: string,
  providerConfig?: AIProviderConfig
): Promise<AICopilotAnalysisResult> {
  if (!text || text.trim().length === 0) {
    return {
      consumables: [],
      summary: "No voice or text input provided.",
      rawInput: "",
      providerUsed: "None",
    };
  }

  if (providerConfig && providerConfig.provider !== "builtin") {
    return await callLLMProvider(text, providerConfig);
  }

  return analyzeWithBuiltInEngine(text);
}

export async function applyAIEstimatesToBudget(payload: AIApplyPayload): Promise<{
  success: boolean;
  message: string;
  appliedCategories: string[];
  appliedSinkingFunds: string[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please sign in to apply AI estimates to your budget.",
      appliedCategories: [],
      appliedSinkingFunds: [],
    };
  }

  const appliedCategories: string[] = [];
  const appliedSinkingFunds: string[] = [];

  // 1. Group consumables by suggested category
  const categoryDeltas: Record<string, number> = {};
  for (const item of payload.consumables) {
    if (item.monthlyCost > 0 && item.suggestedCategory) {
      categoryDeltas[item.suggestedCategory] =
        (categoryDeltas[item.suggestedCategory] || 0) + item.monthlyCost;
    }
  }

  // 2. Add vehicle fuel cost to category deltas
  if (payload.vehicle && payload.vehicle.monthlyFuelCost > 0) {
    const fuelCat = payload.vehicle.suggestedFuelCategory || "Gasoline & Transit";
    categoryDeltas[fuelCat] = (categoryDeltas[fuelCat] || 0) + payload.vehicle.monthlyFuelCost;
  }

  // 3. Update Categories in Supabase
  for (const [catName, delta] of Object.entries(categoryDeltas)) {
    // Find existing category
    const { data: existing } = await supabase
      .from("categories")
      .select("id, name, target_monthly")
      .eq("user_id", user.id)
      .ilike("name", `%${catName.split(" ")[0]}%`)
      .maybeSingle();

    if (existing) {
      const currentTarget = Number(existing.target_monthly || 0);
      const newTarget = Math.round(currentTarget + delta);
      await supabase
        .from("categories")
        .update({ target_monthly: newTarget })
        .eq("id", existing.id);
      appliedCategories.push(`${existing.name} (+$${Math.round(delta)}/mo → $${newTarget})`);
    } else {
      // Insert new category
      const { data: inserted } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: catName,
          type: "variable",
          target_monthly: Math.round(delta),
          rollover_rule: "sweep",
        })
        .select("name, target_monthly")
        .single();

      if (inserted) {
        appliedCategories.push(`${inserted.name} ($${inserted.target_monthly}/mo)`);
      }
    }
  }

  // 4. Update or Create Auto Maintenance Sinking Fund
  if (payload.vehicle && payload.vehicle.monthlyMaintenanceQuota > 0) {
    const fundName = payload.vehicle.suggestedMaintenanceFund || "Auto Maintenance & Tires";
    const monthlyQuota = payload.vehicle.monthlyMaintenanceQuota;
    const targetAmount = payload.vehicle.annualMaintenanceTarget || monthlyQuota * 12;

    const { data: existingFund } = await supabase
      .from("sinking_funds")
      .select("id, name, monthly_contribution, target_amount")
      .eq("user_id", user.id)
      .ilike("name", "%auto%")
      .maybeSingle();

    if (existingFund) {
      await supabase
        .from("sinking_funds")
        .update({
          monthly_contribution: monthlyQuota,
          target_amount: Math.max(Number(existingFund.target_amount || 0), targetAmount),
        })
        .eq("id", existingFund.id);
      appliedSinkingFunds.push(`${existingFund.name} ($${monthlyQuota}/mo quota)`);
    } else {
      // 1 year from now for target date
      const targetDate = new Date();
      targetDate.setFullYear(targetDate.getFullYear() + 1);

      await supabase.from("sinking_funds").insert({
        user_id: user.id,
        name: fundName,
        target_amount: targetAmount,
        monthly_contribution: monthlyQuota,
        current_balance: 0,
        target_date: targetDate.toISOString().split("T")[0],
      });
      appliedSinkingFunds.push(`${fundName} ($${monthlyQuota}/mo quota, $${targetAmount} target)`);
    }
  }

  revalidatePath("/");

  let msg = "Budget updated successfully!";
  if (appliedCategories.length > 0 || appliedSinkingFunds.length > 0) {
    msg = `Allocated ${appliedCategories.length} envelope categories and ${appliedSinkingFunds.length} sinking fund quotas.`;
  }

  return {
    success: true,
    message: msg,
    appliedCategories,
    appliedSinkingFunds,
  };
}
