"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  isLoggedToday: boolean;
  lastLoggedDate: string | null;
  motivationalMessage: string;
}

export async function getStreakStatus(): Promise<StreakStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isLoggedToday: false,
      lastLoggedDate: null,
      motivationalMessage: "Sign in to track your financial habit streak!",
    };
  }

  const { data: profile } = await supabase
    .from("user_income_profiles")
    .select("current_streak, longest_streak, last_streak_date")
    .eq("user_id", user.id)
    .maybeSingle();

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let currentStreak = profile?.current_streak ?? 0;
  const longestStreak = profile?.longest_streak ?? 0;
  const lastStreakDate = profile?.last_streak_date ?? null;
  const isLoggedToday = lastStreakDate === todayStr;

  // If last logged date was before yesterday, the streak lapsed
  if (lastStreakDate && lastStreakDate !== todayStr && lastStreakDate !== yesterdayStr) {
    currentStreak = 0;
  }

  let motivationalMessage = "Log an expense today to keep your streak alive!";
  if (isLoggedToday) {
    if (currentStreak >= 30) {
      motivationalMessage = "🏆 Legendary 30+ Day Fortress Discipline!";
    } else if (currentStreak >= 14) {
      motivationalMessage = "⚡ 2-Week Mastery! Your financial awareness is razor sharp.";
    } else if (currentStreak >= 7) {
      motivationalMessage = "🔥 7-Day Habit Locked! You're in complete control.";
    } else if (currentStreak >= 3) {
      motivationalMessage = "🚀 3-Day Momentum! Financial habits are compounding.";
    } else {
      motivationalMessage = "✅ You're logged for today! Keep the momentum tomorrow.";
    }
  }

  return {
    currentStreak,
    longestStreak,
    isLoggedToday,
    lastLoggedDate: lastStreakDate,
    motivationalMessage,
  };
}

export async function recordStreakActivity(): Promise<{ currentStreak: number; longestStreak: number; newMilestone: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { currentStreak: 0, longestStreak: 0, newMilestone: false };

  const { data: profile } = await supabase
    .from("user_income_profiles")
    .select("current_streak, longest_streak, last_streak_date")
    .eq("user_id", user.id)
    .maybeSingle();

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let current = profile?.current_streak ?? 0;
  let longest = profile?.longest_streak ?? 0;
  const lastDate = profile?.last_streak_date ?? null;

  if (lastDate === todayStr) {
    return { currentStreak: current, longestStreak: longest, newMilestone: false };
  }

  if (lastDate === yesterdayStr) {
    current += 1;
  } else {
    current = 1;
  }

  const newMilestone = current === 3 || current === 7 || current === 14 || current === 30 || current === 100;
  longest = Math.max(longest, current);

  await supabase
    .from("user_income_profiles")
    .update({
      current_streak: current,
      longest_streak: longest,
      last_streak_date: todayStr,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  revalidatePath("/");
  return { currentStreak: current, longestStreak: longest, newMilestone };
}
