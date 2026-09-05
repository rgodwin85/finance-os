"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Briefcase,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  DollarSign,
  Clock,
  Calendar,
  Percent,
} from "lucide-react";
import {
  calculateFreedomMetrics,
  saveFreedomPreferences,
  FreedomMetrics,
} from "@/actions/freedom-rate";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function FreedomRateCalculator() {
  const [metrics, setMetrics] = useState<FreedomMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Editable parameters
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  const [weeksPerYear, setWeeksPerYear] = useState(50);
  const [savingsTargetPercent, setSavingsTargetPercent] = useState(20);
  const [taxRatePercent, setTaxRatePercent] = useState(22);

  const loadMetrics = async (params?: {
    hoursPerWeek?: number;
    weeksPerYear?: number;
    savingsTargetPercent?: number;
    taxRatePercent?: number;
  }) => {
    try {
      const data = await calculateFreedomMetrics(params);
      setMetrics(data);
      if (!params) {
        setHoursPerWeek(data.hoursPerWeek);
        setWeeksPerYear(data.weeksPerYear);
        setSavingsTargetPercent(data.savingsTargetPercent);
        setTaxRatePercent(data.taxRatePercent);
      }
    } catch (e) {
      console.error("Failed to load freedom metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleParamChange = (newParams: {
    hours?: number;
    weeks?: number;
    savings?: number;
    tax?: number;
  }) => {
    const h = newParams.hours ?? hoursPerWeek;
    const w = newParams.weeks ?? weeksPerYear;
    const s = newParams.savings ?? savingsTargetPercent;
    const t = newParams.tax ?? taxRatePercent;

    setHoursPerWeek(h);
    setWeeksPerYear(w);
    setSavingsTargetPercent(s);
    setTaxRatePercent(t);

    loadMetrics({
      hoursPerWeek: h,
      weeksPerYear: w,
      savingsTargetPercent: s,
      taxRatePercent: t,
    });
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    await saveFreedomPreferences({
      work_hours_per_week: hoursPerWeek,
      work_weeks_per_year: weeksPerYear,
      savings_target_percent: savingsTargetPercent,
      tax_rate_percent: taxRatePercent,
    });
    setSaving(false);
    setShowSettings(false);
  };

  if (loading || !metrics) {
    return (
      <Card className="border-border shadow-xs rounded-2xl p-6 text-center text-sm text-muted-foreground">
        Calculating financial freedom velocity...
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (metrics.status) {
      case "freedom_achieved":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs px-2.5 py-0.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Freedom Velocity Achieved
          </Badge>
        );
      case "comfortable":
        return (
          <Badge className="bg-primary/15 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Comfortable Baseline
          </Badge>
        );
      case "survival":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs px-2.5 py-0.5 font-bold">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Survival Floor Met
          </Badge>
        );
      default:
        return (
          <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-xs px-2.5 py-0.5 font-bold">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Below Survival Floor
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="pb-3.5 pt-5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-primary" /> Freedom Number Engine
            </span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Tune Working Parameters"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <CardTitle className="text-3xl font-extrabold tracking-tight">
                ${metrics.freedomHourly.toFixed(2)}
                <span className="text-sm font-semibold text-muted-foreground ml-1.5">/ hr</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                ${metrics.freedomAnnualGross.toLocaleString()} / year gross
              </p>
            </div>
            {getStatusBadge()}
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
            The target wage required to comfortably fund your lifestyle while saving{" "}
            <span className="font-semibold text-foreground">{savingsTargetPercent}%</span> toward your
            Waterfall milestones and financial independence.
          </CardDescription>
        </CardHeader>

        {/* Tune Parameters Drawer */}
        {showSettings && (
          <div className="bg-muted/40 border-y border-border/80 px-5 py-4 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" /> Working Parameters
              </span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {metrics.annualWorkingHours.toLocaleString()} hrs/year
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Hours per week */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Hours/Week
                  </span>
                  <span className="font-mono font-bold text-foreground">{hoursPerWeek}h</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="70"
                  step="1"
                  value={hoursPerWeek}
                  onChange={(e) => handleParamChange({ hours: parseInt(e.target.value) })}
                  className="w-full accent-primary h-1.5 bg-muted-foreground/20 rounded-lg cursor-pointer"
                />
              </div>

              {/* Weeks per year */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Weeks/Year
                  </span>
                  <span className="font-mono font-bold text-foreground">{weeksPerYear}w</span>
                </div>
                <input
                  type="range"
                  min="36"
                  max="52"
                  step="1"
                  value={weeksPerYear}
                  onChange={(e) => handleParamChange({ weeks: parseInt(e.target.value) })}
                  className="w-full accent-primary h-1.5 bg-muted-foreground/20 rounded-lg cursor-pointer"
                />
              </div>

              {/* Savings target */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Savings Target
                  </span>
                  <span className="font-mono font-bold text-foreground">{savingsTargetPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={savingsTargetPercent}
                  onChange={(e) => handleParamChange({ savings: parseInt(e.target.value) })}
                  className="w-full accent-primary h-1.5 bg-muted-foreground/20 rounded-lg cursor-pointer"
                />
              </div>

              {/* Tax rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3" /> Tax Rate
                  </span>
                  <span className="font-mono font-bold text-foreground">{taxRatePercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="1"
                  value={taxRatePercent}
                  onChange={(e) => handleParamChange({ tax: parseInt(e.target.value) })}
                  className="w-full accent-primary h-1.5 bg-muted-foreground/20 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <Button
              onClick={handleSavePreferences}
              disabled={saving}
              size="sm"
              className="w-full h-8 text-xs font-bold rounded-xl"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        )}

        <CardContent className="p-5 pt-0 space-y-4">
          {/* Freedom Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Current vs. Freedom Target</span>
              <span className="font-mono font-bold text-foreground">
                ${metrics.currentHourlyRate.toFixed(2)}/hr ({metrics.freedomReadinessPercent}%)
              </span>
            </div>
            <Progress value={Math.min(100, metrics.freedomReadinessPercent)} className="h-2" />
          </div>

          {/* 3-Tier Rate Benchmark Cards */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Tier 1: Barebones Floor */}
            <div className="bg-muted/40 p-3 rounded-xl border border-border/60 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Survival Floor
              </span>
              <div className="text-base font-extrabold text-foreground">
                ${metrics.barebonesHourly.toFixed(2)}
                <span className="text-[10px] font-normal text-muted-foreground">/hr</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate">
                ${metrics.barebonesAnnualGross.toLocaleString()}/yr
              </div>
            </div>

            {/* Tier 2: Comfortable Living */}
            <div className="bg-muted/40 p-3 rounded-xl border border-border/60 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                Comfortable
              </span>
              <div className="text-base font-extrabold text-foreground">
                ${metrics.comfortableHourly.toFixed(2)}
                <span className="text-[10px] font-normal text-muted-foreground">/hr</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate">
                ${metrics.comfortableAnnualGross.toLocaleString()}/yr
              </div>
            </div>

            {/* Tier 3: Freedom Velocity */}
            <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                Freedom Rate
              </span>
              <div className="text-base font-extrabold text-foreground">
                ${metrics.freedomHourly.toFixed(2)}
                <span className="text-[10px] font-normal text-muted-foreground">/hr</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold truncate">
                ${metrics.freedomAnnualGross.toLocaleString()}/yr
              </div>
            </div>
          </div>

          {/* Real-time Barometer Banner */}
          <div className="p-3 rounded-xl bg-card border border-border/80 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Monthly Waterfall Acceleration
              </span>
              <span className="font-semibold text-foreground">
                {metrics.hourlyDeltaVsComfortable >= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +${Math.round((metrics.hourlyDeltaVsComfortable * metrics.annualWorkingHours) / 12).toLocaleString()}/mo
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    -${Math.round((Math.abs(metrics.hourlyDeltaVsComfortable) * metrics.annualWorkingHours) / 12).toLocaleString()}/mo
                  </span>
                )}{" "}
                surplus over comfortable baseline
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-muted-foreground block">Hourly Gap</span>
              <span
                className={`text-xs font-mono font-bold ${
                  metrics.hourlyDeltaVsFreedom >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                {metrics.hourlyDeltaVsFreedom >= 0
                  ? `+$${metrics.hourlyDeltaVsFreedom.toFixed(2)}/hr`
                  : `-$${Math.abs(metrics.hourlyDeltaVsFreedom).toFixed(2)}/hr`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
