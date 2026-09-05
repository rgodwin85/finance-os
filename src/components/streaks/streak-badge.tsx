"use client";

import React, { useState, useEffect } from "react";
import { Flame, Trophy, Calendar, Sparkles } from "lucide-react";
import { getStreakStatus, StreakStatus } from "@/actions/streaks";
import { hapticLight } from "@/lib/haptics";

export function StreakBadge() {
  const [streak, setStreak] = useState<StreakStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getStreakStatus().then(setStreak).catch(console.error);
  }, []);

  if (!streak || streak.currentStreak === 0 && !streak.isLoggedToday) {
    return null;
  }

  const handleClick = () => {
    hapticLight();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`h-9 px-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold font-mono transition-all active:scale-95 ${
          streak.isLoggedToday
            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
            : "bg-muted text-muted-foreground border-border/80"
        }`}
        title="Daily Financial Tracking Streak"
      >
        <Flame className={`w-4 h-4 ${streak.isLoggedToday ? "text-orange-500 fill-orange-500 animate-pulse" : "text-muted-foreground"}`} />
        <span>{streak.currentStreak}d</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-64 bg-card border border-border rounded-2xl shadow-xl p-3.5 z-50 text-xs animate-in fade-in zoom-in-95 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              Daily Habit Streak
            </span>
            <span className="font-mono text-muted-foreground text-[11px]">
              Record: {streak.longestStreak}d
            </span>
          </div>

          <p className="text-xs text-foreground font-medium leading-relaxed">
            {streak.motivationalMessage}
          </p>

          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Today's Check-In
            </span>
            <span className={`font-bold ${streak.isLoggedToday ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {streak.isLoggedToday ? "Logged ✅" : "Pending ⏳"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
