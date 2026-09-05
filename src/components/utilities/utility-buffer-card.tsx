"use client";

import React, { useState } from "react";
import { Zap, ShieldCheck } from "lucide-react";
import { calculateUtilityBuffer } from "@/lib/utilities";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UtilityBufferCard() {
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
      <Card className="border-border shadow-xs rounded-2xl">
        <CardHeader className="pb-3.5 pt-5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> Variable Utility Smoothing
            </span>
            <Badge variant="outline" className="text-xs font-mono font-semibold px-2.5 py-1">
              Trailing Avg: ${stats.trailingAverage}/mo
            </Badge>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight mt-2">
            ${bufferBalance.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              / ${stats.recommendedBuffer.toLocaleString()} buffer
            </span>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Smooths seasonal electric/heating spikes by holding a rolling shock-absorber bucket.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-5 pb-5 pt-0 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Buffer Shield Health</span>
              <span className="text-amber-600 dark:text-amber-400">
                {stats.bufferHealthPercent}% Protected
              </span>
            </div>
            <Progress value={stats.bufferHealthPercent} className="h-3 rounded-full [&>div]:bg-amber-500" />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
              <span className="text-muted-foreground block text-xs uppercase font-bold tracking-wider">Seasonal Peak</span>
              <span className="font-mono font-bold text-lg text-destructive">${stats.peakExpense}</span>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
              <span className="text-muted-foreground block text-xs uppercase font-bold tracking-wider">Recommended Inflow</span>
              <span className="font-mono font-bold text-lg text-emerald-600">+${stats.monthlySavingsTarget}/mo</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs font-bold gap-1.5 h-10 rounded-xl"
              onClick={handleDepositToBuffer}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Deposit +${stats.monthlySavingsTarget} to Buffer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trailing History Visualization */}
      <Card className="border-border shadow-xs rounded-2xl">
        <CardHeader className="py-4 px-5">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Last 6 Months History</span>
            <span className="text-xs font-normal text-muted-foreground">Electric + Gas + Water</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0 space-y-3.5">
          <div className="grid grid-cols-6 gap-2 items-end h-28 pt-4 px-3 bg-muted/20 rounded-xl border border-dashed">
            {history.map((val, idx) => {
              const heightPercent = Math.min(100, Math.round((val / (stats.peakExpense * 1.15)) * 100));
              const isPeak = val === stats.peakExpense;
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-xs font-mono font-semibold text-muted-foreground">${val}</span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      isPeak ? "bg-destructive/90 shadow-sm" : "bg-primary/70"
                    }`}
                  />
                  <span className="text-xs font-medium text-muted-foreground">M-{6 - idx}</span>
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
              className="text-base h-11 rounded-xl"
            />
            <Button type="submit" size="sm" className="text-xs font-bold h-11 px-4 rounded-xl">
              Add Bill
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
