"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  calculateWaterfallState,
  WATERFALL_STAGE_DEFINITIONS,
  WaterfallStage,
} from "@/lib/waterfall";

export interface WaterfallMilestone {
  id: string;
  waterfall_stage: number;
  name: string;
  target_amount: number;
  current_amount: number;
  is_completed: boolean;
}

export async function getWaterfallData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Return default template for guests / unauthenticated state
    return calculateWaterfallState([]);
  }

  let { data: milestones, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("user_id", user.id)
    .order("waterfall_stage", { ascending: true });

  if (error) {
    console.error("Error fetching milestones:", error);
    return calculateWaterfallState([]);
  }

  // Seed default milestone stages if empty for this user
  if (!milestones || milestones.length === 0) {
    const seedRecords = WATERFALL_STAGE_DEFINITIONS.map((def) => ({
      user_id: user.id,
      waterfall_stage: def.stage,
      name: def.name,
      target_amount: def.defaultTarget,
      current_amount: 0,
      is_completed: false,
    }));

    const { data: seeded } = await supabase
      .from("milestones")
      .insert(seedRecords)
      .select();

    milestones = seeded || [];
  }

  return calculateWaterfallState(
    (milestones || []).map((m) => ({
      id: m.id,
      waterfall_stage: m.waterfall_stage,
      name: m.name,
      target_amount: Number(m.target_amount),
      current_amount: Number(m.current_amount),
      is_completed: m.is_completed,
    }))
  );
}

/**
 * Strict Waterfall Allocation:
 * Verifies that the allocated stage matches the current active stage.
 * Rejects allocations to locked downstream stages.
 */
export async function allocateWaterfallFunds(stageNumber: number, amount: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required" };
  }

  if (amount <= 0) {
    return { error: "Allocation amount must be greater than $0" };
  }

  const currentState = await getWaterfallData();

  if (stageNumber > currentState.activeStageNumber) {
    return {
      error: `Strict Waterfall Lock: You cannot allocate funds to Stage ${stageNumber} until Stage ${currentState.activeStageNumber} is 100% funded.`,
    };
  }

  const { data: milestone, error: fetchError } = await supabase
    .from("milestones")
    .select("*")
    .eq("user_id", user.id)
    .eq("waterfall_stage", stageNumber)
    .single();

  if (fetchError || !milestone) {
    return { error: "Milestone stage not found" };
  }

  const newCurrent = Number(milestone.current_amount) + amount;
  const isNowCompleted = newCurrent >= Number(milestone.target_amount);

  const { error: updateError } = await supabase
    .from("milestones")
    .update({
      current_amount: newCurrent,
      is_completed: isNowCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestone.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/");
  return {
    success: true,
    newCurrent,
    isCompleted: isNowCompleted,
    stageNumber,
  };
}

export async function updateMilestoneTarget(stageNumber: number, newTarget: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required" };
  }

  const { error } = await supabase
    .from("milestones")
    .update({
      target_amount: newTarget,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("waterfall_stage", stageNumber);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
