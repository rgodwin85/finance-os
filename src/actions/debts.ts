"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  interest_rate: number;
  minimum_payment: number;
  strategy: "avalanche" | "snowball";
  due_day: number;
  notes: string | null;
  created_at: string;
}

export interface DebtSimulationResult {
  strategy: "avalanche" | "snowball";
  monthsToPayoff: number;
  payoffDate: string;
  totalInterestPaid: number;
  totalPrincipal: number;
  totalPaid: number;
  interestSavedVsBaseline: number;
  monthsSavedVsBaseline: number;
  orderedDebts: Array<{
    id: string;
    name: string;
    balance: number;
    interest_rate: number;
    minimum_payment: number;
    payoffMonth: number;
    payoffDate: string;
    totalInterest: number;
    rank: number;
  }>;
}

export interface DebtComparison {
  totalBalance: number;
  totalMinimums: number;
  extraMonthlyPayment: number;
  baseline: {
    monthsToPayoff: number;
    payoffDate: string;
    totalInterestPaid: number;
  };
  avalanche: DebtSimulationResult;
  snowball: DebtSimulationResult;
}

export async function getDebts(): Promise<DebtItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id)
    .order("balance", { ascending: false });

  if (error) {
    console.error("Error fetching debts:", error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    balance: Number(d.balance || 0),
    interest_rate: Number(d.interest_rate || 0),
    minimum_payment: Number(d.minimum_payment || 0),
    strategy: (d.strategy as any) || "avalanche",
    due_day: d.due_day ?? 1,
    notes: d.notes,
    created_at: d.created_at,
  }));
}

/**
 * Synchronizes Stage 3 of the Waterfall Ladder with total consumer debt balance.
 */
async function syncStage3Target(userId: string) {
  const supabase = await createClient();
  const { data: debts } = await supabase
    .from("debts")
    .select("balance")
    .eq("user_id", userId);

  const totalDebt = (debts || []).reduce((acc, d) => acc + Number(d.balance || 0), 0);

  if (totalDebt > 0) {
    await supabase
      .from("milestones")
      .update({
        target_amount: totalDebt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("waterfall_stage", 3);
  }
}

export async function createDebt(formData: {
  name: string;
  balance: number;
  interest_rate: number;
  minimum_payment: number;
  due_day?: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { data, error } = await supabase
    .from("debts")
    .insert({
      user_id: user.id,
      name: formData.name.trim(),
      balance: formData.balance,
      interest_rate: formData.interest_rate,
      minimum_payment: formData.minimum_payment,
      due_day: formData.due_day ?? 1,
      notes: formData.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await syncStage3Target(user.id);

  revalidatePath("/");
  return { success: true, data };
}

export async function updateDebt(
  id: string,
  formData: {
    name?: string;
    balance?: number;
    interest_rate?: number;
    minimum_payment?: number;
    due_day?: number;
    notes?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { error } = await supabase
    .from("debts")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  await syncStage3Target(user.id);

  revalidatePath("/");
  return { success: true };
}

export async function recordDebtPayment(id: string, paymentAmount: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };
  if (paymentAmount <= 0) return { error: "Payment amount must be greater than $0" };

  const { data: debt, error: fetchErr } = await supabase
    .from("debts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !debt) return { error: "Debt record not found" };

  const oldBalance = Number(debt.balance);
  const newBalance = Math.max(0, oldBalance - paymentAmount);

  const { error: updateErr } = await supabase
    .from("debts")
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) return { error: updateErr.message };

  // Log in transactions ledger
  await supabase.from("transactions").insert({
    user_id: user.id,
    amount: paymentAmount,
    date: new Date().toISOString().split("T")[0],
    description: `Debt Payment: ${debt.name} (Remaining: $${newBalance.toLocaleString()})`,
  });

  // Advance Stage 3 milestone progress
  const { data: milestone } = await supabase
    .from("milestones")
    .select("*")
    .eq("user_id", user.id)
    .eq("waterfall_stage", 3)
    .maybeSingle();

  if (milestone) {
    const currentPaid = Number(milestone.current_amount || 0) + paymentAmount;
    await supabase
      .from("milestones")
      .update({
        current_amount: currentPaid,
        is_completed: currentPaid >= Number(milestone.target_amount),
        updated_at: new Date().toISOString(),
      })
      .eq("id", milestone.id);
  }

  revalidatePath("/");
  return { success: true, newBalance };
}

export async function deleteDebt(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required" };

  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  await syncStage3Target(user.id);

  revalidatePath("/");
  return { success: true };
}

/**
 * Simulates debt amortization payoff schedules.
 */
function runPayoffSimulation(
  debts: DebtItem[],
  strategy: "avalanche" | "snowball",
  extraMonthly: number
): {
  monthsToPayoff: number;
  totalInterestPaid: number;
  orderedDebts: Array<{
    id: string;
    name: string;
    balance: number;
    interest_rate: number;
    minimum_payment: number;
    payoffMonth: number;
    payoffDate: string;
    totalInterest: number;
    rank: number;
  }>;
} {
  if (debts.length === 0) {
    return { monthsToPayoff: 0, totalInterestPaid: 0, orderedDebts: [] };
  }

  // Clone debt tracking states
  const active = debts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    rate: d.interest_rate,
    minPay: d.minimum_payment,
    totalInterest: 0,
    payoffMonth: 0,
  }));

  let currentExtra = extraMonthly;
  let month = 0;
  const maxMonths = 360; // 30-year safety ceiling

  while (active.some((d) => d.balance > 0.01) && month < maxMonths) {
    month++;

    // 1. Accrue monthly interest on all active debts
    for (const d of active) {
      if (d.balance > 0.01) {
        const monthlyInterest = (d.balance * (d.rate / 100)) / 12;
        d.balance += monthlyInterest;
        d.totalInterest += monthlyInterest;
      }
    }

    // 2. Pay minimums on all active debts
    let availableSnowball = currentExtra;
    for (const d of active) {
      if (d.balance > 0.01) {
        const payment = Math.min(d.balance, d.minPay);
        d.balance -= payment;
        if (d.balance <= 0.01) {
          d.balance = 0;
          if (d.payoffMonth === 0) d.payoffMonth = month;
          // Snowball effect: freed minimum payment rolls into the attack fund!
          availableSnowball += d.minPay;
        }
      }
    }

    // 3. Direct all extra snowball cash to target debt #1 according to strategy
    // Avalanche = highest rate; Snowball = lowest balance
    const targetCandidates = active
      .filter((d) => d.balance > 0.01)
      .sort((a, b) => {
        if (strategy === "avalanche") {
          return b.rate - a.rate || a.balance - b.balance;
        } else {
          return a.balance - b.balance || b.rate - a.rate;
        }
      });

    if (targetCandidates.length > 0 && availableSnowball > 0) {
      const primaryTarget = targetCandidates[0];
      const lumpSum = Math.min(primaryTarget.balance, availableSnowball);
      primaryTarget.balance -= lumpSum;
      if (primaryTarget.balance <= 0.01) {
        primaryTarget.balance = 0;
        if (primaryTarget.payoffMonth === 0) primaryTarget.payoffMonth = month;
      }
    }
  }

  // Format calendar date
  const now = new Date();
  const formatMonthDate = (m: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const totalInterestPaid = Math.round(active.reduce((acc, d) => acc + d.totalInterest, 0));

  // Order debts by payoff sequence
  const orderedDebts = [...active]
    .sort((a, b) => (a.payoffMonth || 999) - (b.payoffMonth || 999))
    .map((d, idx) => ({
      id: d.id,
      name: d.name,
      balance: debts.find((orig) => orig.id === d.id)?.balance || 0,
      interest_rate: d.rate,
      minimum_payment: d.minPay,
      payoffMonth: d.payoffMonth || month,
      payoffDate: formatMonthDate(d.payoffMonth || month),
      totalInterest: Math.round(d.totalInterest),
      rank: idx + 1,
    }));

  return {
    monthsToPayoff: month,
    totalInterestPaid,
    orderedDebts,
  };
}

export async function simulateAllDebtStrategies(extraMonthly: number = 0): Promise<DebtComparison> {
  const debts = await getDebts();

  const totalBalance = Math.round(debts.reduce((acc, d) => acc + d.balance, 0));
  const totalMinimums = Math.round(debts.reduce((acc, d) => acc + d.minimum_payment, 0));

  const now = new Date();
  const formatMonthDate = (m: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  // 1. Baseline: Minimum payments only ($0 extra)
  const baselineSim = runPayoffSimulation(debts, "avalanche", 0);

  // 2. Avalanche with extra payment
  const avalancheSim = runPayoffSimulation(debts, "avalanche", extraMonthly);

  // 3. Snowball with extra payment
  const snowballSim = runPayoffSimulation(debts, "snowball", extraMonthly);

  return {
    totalBalance,
    totalMinimums,
    extraMonthlyPayment: extraMonthly,
    baseline: {
      monthsToPayoff: baselineSim.monthsToPayoff,
      payoffDate: formatMonthDate(baselineSim.monthsToPayoff),
      totalInterestPaid: baselineSim.totalInterestPaid,
    },
    avalanche: {
      strategy: "avalanche",
      monthsToPayoff: avalancheSim.monthsToPayoff,
      payoffDate: formatMonthDate(avalancheSim.monthsToPayoff),
      totalInterestPaid: avalancheSim.totalInterestPaid,
      totalPrincipal: totalBalance,
      totalPaid: totalBalance + avalancheSim.totalInterestPaid,
      interestSavedVsBaseline: Math.max(0, baselineSim.totalInterestPaid - avalancheSim.totalInterestPaid),
      monthsSavedVsBaseline: Math.max(0, baselineSim.monthsToPayoff - avalancheSim.monthsToPayoff),
      orderedDebts: avalancheSim.orderedDebts,
    },
    snowball: {
      strategy: "snowball",
      monthsToPayoff: snowballSim.monthsToPayoff,
      payoffDate: formatMonthDate(snowballSim.monthsToPayoff),
      totalInterestPaid: snowballSim.totalInterestPaid,
      totalPrincipal: totalBalance,
      totalPaid: totalBalance + snowballSim.totalInterestPaid,
      interestSavedVsBaseline: Math.max(0, baselineSim.totalInterestPaid - snowballSim.totalInterestPaid),
      monthsSavedVsBaseline: Math.max(0, baselineSim.monthsToPayoff - snowballSim.monthsToPayoff),
      orderedDebts: snowballSim.orderedDebts,
    },
  };
}
