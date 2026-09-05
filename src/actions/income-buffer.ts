"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface HoldingBufferState {
  balance: number;
  targetMonthlySalary: number;
  isVariableIncome: boolean;
  runwayMonths: number;
  comfortableMonthly: number;
  barebonesMonthly: number;
}

export async function getHoldingBufferState(): Promise<HoldingBufferState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      balance: 0,
      targetMonthlySalary: 3500,
      isVariableIncome: false,
      runwayMonths: 0,
      comfortableMonthly: 3500,
      barebonesMonthly: 2200,
    };
  }

  const { data: profile } = await supabase
    .from("user_income_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const balance = Number(profile?.holding_buffer_balance || 0);
  const comfortable = Number(profile?.comfortable_monthly || 3500);
  const barebones = Number(profile?.barebones_monthly || 2200);
  const targetMonthly =
    Number(profile?.target_monthly_salary) > 0 ? Number(profile?.target_monthly_salary) : comfortable;
  const isVariableIncome = !!profile?.is_variable_income;
  const runwayMonths = targetMonthly > 0 ? Math.round((balance / targetMonthly) * 10) / 10 : 0;

  return {
    balance,
    targetMonthlySalary: targetMonthly,
    isVariableIncome,
    runwayMonths,
    comfortableMonthly: comfortable,
    barebonesMonthly: barebones,
  };
}

export async function depositToHoldingBuffer(amount: number, description?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };
  if (amount <= 0) return { error: "Deposit amount must be greater than $0" };

  const { data: profile } = await supabase
    .from("user_income_profiles")
    .select("holding_buffer_balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentBal = Number(profile?.holding_buffer_balance || 0);
  const newBal = currentBal + amount;

  const { error: updateError } = await supabase
    .from("user_income_profiles")
    .update({
      holding_buffer_balance: newBal,
      is_variable_income: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  // Log transaction
  await supabase.from("transactions").insert({
    user_id: user.id,
    amount: amount,
    date: new Date().toISOString().split("T")[0],
    description: description ? `Holding Buffer Deposit: ${description}` : "Irregular Check to Holding Buffer",
  });

  revalidatePath("/");
  return { success: true, newBalance: newBal };
}

export async function drawSalaryFromHoldingBuffer(amount: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };
  if (amount <= 0) return { error: "Draw amount must be greater than $0" };

  const { data: profile } = await supabase
    .from("user_income_profiles")
    .select("holding_buffer_balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentBal = Number(profile?.holding_buffer_balance || 0);
  if (currentBal < amount) {
    return {
      error: `Insufficient buffer balance. Buffer has $${currentBal.toLocaleString()} available.`,
    };
  }

  const newBal = currentBal - amount;

  const { error: updateError } = await supabase
    .from("user_income_profiles")
    .update({
      holding_buffer_balance: newBal,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  // Log transaction as a salary draw
  await supabase.from("transactions").insert({
    user_id: user.id,
    amount: amount,
    date: new Date().toISOString().split("T")[0],
    description: "Salary Draw from Income Holding Buffer",
  });

  revalidatePath("/");
  return { success: true, newBalance: newBal };
}

export async function updateHoldingBufferSettings(data: {
  is_variable_income: boolean;
  target_monthly_salary: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { error } = await supabase
    .from("user_income_profiles")
    .update({
      is_variable_income: data.is_variable_income,
      target_monthly_salary: data.target_monthly_salary,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}
