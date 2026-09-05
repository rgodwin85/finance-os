"use client";

import React, { useState, useEffect } from "react";
import { Compass, Calendar, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { getCashFlowRunRate, CashFlowRunRate } from "@/actions/cashflow";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function CashFlowRunRateCard() {
  const [data, setData] = useState<CashFlowRunRate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCashFlowRunRate().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const getStatusBadge = () => {
    switch (data.pacingStatus) {
      case "frugal":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Frugal Pace (Ahead)
          </Badge>
        );
      case "on_track":
        return (
          <Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-bold px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3 mr-1" /> On Target Pace
          </Badge>
        );
      case "pacing_hot":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-bold px-2 py-0.5">
            <AlertTriangle className="w-3 h-3 mr-1" /> Pacing Fast
          </Badge>
        );
      case "over_limit":
        return (
          <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-xs font-bold px-2 py-0.5">
            <ShieldAlert className="w-3 h-3 mr-1" /> Envelope Depleted
          </Badge>
        );
    }
  };

  const periodDaysProgress = Math.min(100, Math.round((data.daysElapsedInPeriod / data.totalPeriodDays) * 100));
  const budgetBurnProgress =
    data.totalVariableBudget > 0
      ? Math.min(100, Math.round((data.spentVariableSoFar / data.totalVariableBudget) * 100))
      : 0;

  return (
    <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-primary" /> Safe-to-Spend Daily Pacer
          </span>
          {getStatusBadge()}
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              ${data.safeDailySpendPace.toFixed(2)}
              <span className="text-xs font-semibold text-muted-foreground ml-1">/ day</span>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Available for next {data.daysUntilPayday} days until next paycheck
            </p>
          </div>
          <div className="text-right">
            <span className="text-base font-extrabold font-mono text-foreground">
              ${data.remainingVariableBudget.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground block font-mono">
              of ${data.totalVariableBudget.toLocaleString()} pool
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4.5 pb-4 pt-0 space-y-3">
        {/* Pacing bar: Days vs Budget Burn */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Pay Cycle Progress ({data.daysElapsedInPeriod}/{data.totalPeriodDays} days)</span>
            <span className="font-mono font-bold text-foreground">{budgetBurnProgress}% spent</span>
          </div>
          <Progress value={budgetBurnProgress} className="h-1.5 rounded-full" />
        </div>

        {/* 3 Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-0.5 text-center text-xs">
          <div className="bg-muted/30 p-2 rounded-xl border border-border/50">
            <span className="text-[10px] text-muted-foreground block font-medium">Days to Payday</span>
            <span className="font-bold font-mono text-foreground text-sm">{data.daysUntilPayday}d</span>
          </div>
          <div className="bg-muted/30 p-2 rounded-xl border border-border/50">
            <span className="text-[10px] text-muted-foreground block font-medium">Daily Burn Rate</span>
            <span className="font-bold font-mono text-foreground text-sm">${data.actualDailyBurnRate.toFixed(1)}</span>
          </div>
          <div className="bg-muted/30 p-2 rounded-xl border border-border/50">
            <span className="text-[10px] text-muted-foreground block font-medium">Projected Margin</span>
            <span className={`font-bold font-mono text-sm ${data.projectedSurplusAtPayday >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {data.projectedSurplusAtPayday >= 0 ? `+$${data.projectedSurplusAtPayday}` : `-$${Math.abs(data.projectedSurplusAtPayday)}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
