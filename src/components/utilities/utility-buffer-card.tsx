"use client";

import React, { useState } from "react";
import { Zap, ShieldCheck, TrendingUp, Info } from "lucide-react";
import { calculateUtilityBuffer } from "@/lib/utilities";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UtilityBufferCard() {
  // Demo trailing 6 months of utility bills (Electric, Gas, Water)
  const [history, setHistory] = useState<number[]>([185, 210, 340, 395, 260, 220]);
  const [bufferBalance, setBufferBalance] = useState<number>(240);
  const [newMonthBill, setNewMonthBill] = useState<string>("");

  const stats = calculateUtilityBuffer(history, bufferBalance);

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newMonthBill);
    if (!isNaN(val) && val > 0) {
      setHistory((prev) => [...prev.slice(1), val]);
      setNewMonthBill("");
    }
  };

  const handleDepositToBuffer = () => {
    setBufferBalance((prev) => prev + stats.monthlySavingsTarget);
  };

  return (
    <div className="space-y-4">
      {/* Utility Buffer Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Variable Utility Smoothing
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              Trailing Avg: ${stats.trailingAverage}/mo
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            ${bufferBalance.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              / ${stats.recommendedBuffer.toLocaleString()} buffer
            </span>
          </CardTitle>
          <CardDescription>
            Smooths seasonal electric/heating spikes by holding a rolling shock-absorber bucket.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Buffer Shield Health</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {stats.bufferHealthPercent}% Protected
              </span>
            </div>
            <Progress value={stats.bufferHealthPercent} className="h-2.5 [&>div]:bg-amber-500" />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Seasonal Peak</span>
              <span className="font-mono font-bold text-sm text-destructive">${stats.peakExpense}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Recommended Inflow</span>
              <span className="font-mono font-bold text-sm text-emerald-600">+${stats.monthlySavingsTarget}/mo</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs gap-1"
              onClick={handleDepositToBuffer}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Deposit +${stats.monthlySavingsTarget} to Buffer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trailing History Visualization */}
      <Card className="border-border shadow-xs">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Last 6 Months History</span>
            <span className="text-[11px] font-normal text-muted-foreground">Electric + Gas + Water</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-6 gap-1.5 items-end h-24 pt-4 px-2 bg-muted/20 rounded-xl border border-dashed">
            {history.map((val, idx) => {
              const heightPercent = Math.min(100, Math.round((val / (stats.peakExpense * 1.15)) * 100));
              const isPeak = val === stats.peakExpense;
              return (
                <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[9px] font-mono text-muted-foreground">${val}</span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      isPeak ? "bg-destructive/80" : "bg-primary/60"
                    }`}
                  />
                  <span className="text-[9px] text-muted-foreground">M-{6 - idx}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Add Utility Bill */}
          <form onSubmit={handleAddBill} className="flex gap-2 pt-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Latest bill amount..."
              value={newMonthBill}
              onChange={(e) => setNewMonthBill(e.target.value)}
              className="text-xs h-9"
            />
            <Button type="submit" size="sm" className="text-xs h-9 px-3">
              Add Bill
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
