"use client";

import React, { useState } from "react";
import { PiggyBank, Plus, RefreshCw, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { SinkingFundItem, createSinkingFund, rolloverSinkingFunds } from "@/actions/sinking-funds";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SinkingFundsCardProps {
  funds: SinkingFundItem[];
  onRefresh?: () => void;
}

export function SinkingFundsCard({ funds, onRefresh }: SinkingFundsCardProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRollingOver, setIsRollingOver] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyContrib, setMonthlyContrib] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const totalBalance = funds.reduce((acc, f) => acc + f.current_balance, 0);
  const totalMonthlyInflow = funds.reduce((acc, f) => acc + f.monthly_contribution, 0);

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const monthly = parseFloat(monthlyContrib);
    const initial = parseFloat(initialBalance) || 0;

    if (!name || isNaN(target) || isNaN(monthly)) {
      setMsg("Please provide a name, target amount, and monthly contribution.");
      return;
    }

    setIsSubmitting(true);
    setMsg(null);

    const res = await createSinkingFund({
      name,
      target_amount: target,
      monthly_contribution: monthly,
      initial_balance: initial,
    });

    setIsSubmitting(false);
    if (res.error) {
      setMsg(res.error);
    } else {
      setName("");
      setTargetAmount("");
      setMonthlyContrib("");
      setInitialBalance("");
      setIsCreateOpen(false);
      if (onRefresh) onRefresh();
    }
  };

  const handleRollover = async () => {
    if (!confirm("Execute Month-End Rollover? This will add your monthly contributions to your current balances so funds accumulate.")) {
      return;
    }

    setIsRollingOver(true);
    const res = await rolloverSinkingFunds();
    setIsRollingOver(false);

    if (res.error) {
      alert("Rollover error: " + res.error);
    } else {
      alert(`Rollover successful! Accumulated funds across ${res.count} buckets.`);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* Sinking Funds Summary Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-primary" /> Rolling Sinking Funds
            </span>
            <Badge variant="secondary" className="text-xs font-mono">
              +{totalMonthlyInflow.toLocaleString()}/mo
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            ${totalBalance.toLocaleString()}
            <span className="text-xs font-normal text-muted-foreground ml-2">accumulated</span>
          </CardTitle>
          <CardDescription>
            Unused balances roll over indefinitely to absorb irregular lump-sum costs (car repair, copays, travel).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateOpen(true)}
              className="flex-1 text-xs gap-1.5 h-9"
            >
              <Plus className="w-3.5 h-3.5" /> New Fund
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRollover}
              disabled={isRollingOver || funds.length === 0}
              className="flex-1 text-xs gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRollingOver ? "animate-spin" : ""}`} />
              Monthly Rollover
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Funds List */}
      <div className="space-y-3">
        {funds.length === 0 ? (
          <div className="p-6 text-center border border-dashed rounded-xl bg-muted/20">
            <PiggyBank className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
            <h4 className="text-sm font-semibold">No Sinking Funds Yet</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Create funds for irregular expenses like Auto Maintenance, Healthcare Copays, or Annual Insurance.
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="mt-3 text-xs"
            >
              Create First Fund
            </Button>
          </div>
        ) : (
          funds.map((fund) => {
            const percent = fund.target_amount > 0
              ? Math.min(100, Math.round((fund.current_balance / fund.target_amount) * 100))
              : 0;

            return (
              <div key={fund.id} className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">{fund.name}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      Contributing ${fund.monthly_contribution}/mo
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono">${fund.current_balance.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground block">
                      of ${fund.target_amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Funded</span>
                    <span className="font-semibold text-foreground">{percent}%</span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Fund Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Sinking Fund</DialogTitle>
            <DialogDescription>
              Set up a designated reserve bucket that rolls over month to month.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateFund} className="space-y-3 pt-2">
            {msg && (
              <div className="p-2.5 text-xs bg-destructive/10 text-destructive rounded-lg">
                {msg}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="fund-name">Fund Name</Label>
              <Input
                id="fund-name"
                placeholder="e.g. Car Maintenance & Tires"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="fund-target">Target Cap ($)</Label>
                <Input
                  id="fund-target"
                  type="number"
                  step="0.01"
                  placeholder="1500"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="fund-monthly">Monthly Inflow ($)</Label>
                <Input
                  id="fund-monthly"
                  type="number"
                  step="0.01"
                  placeholder="125"
                  value={monthlyContrib}
                  onChange={(e) => setMonthlyContrib(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="fund-initial">Starting Balance ($)</Label>
              <Input
                id="fund-initial"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Save Fund"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
