"use client";

import React, { useState } from "react";
import {
  Wallet,
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { CategoryWithBudget, rebalanceCategories } from "@/actions/categories";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BudgetManagerCardProps {
  categories: CategoryWithBudget[];
  onRefresh?: () => void;
}

export function BudgetManagerCard({ categories, onRefresh }: BudgetManagerCardProps) {
  const [rebalanceTarget, setRebalanceTarget] = useState<CategoryWithBudget | null>(null);
  const [donorCategoryId, setDonorCategoryId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [rebalanceMsg, setRebalanceMsg] = useState<string | null>(null);

  // Group by type
  const fixedCats = categories.filter((c) => c.type === "fixed");
  const variableCats = categories.filter((c) => c.type === "variable");
  const sinkingCats = categories.filter((c) => c.type === "sinking_fund");

  const totalMonthlyTarget = categories.reduce((acc, c) => acc + c.target_monthly, 0);
  const totalSpentThisMonth = categories.reduce((acc, c) => acc + c.spent_this_month, 0);

  // Categories that have remaining money to give
  const eligibleDonors = categories.filter(
    (c) => c.id !== rebalanceTarget?.id && c.remaining_this_month > 0
  );

  const handleRebalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rebalanceTarget || !donorCategoryId) return;

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setRebalanceMsg("Please enter an amount greater than $0.");
      return;
    }

    setIsSubmitting(true);
    setRebalanceMsg(null);

    const res = await rebalanceCategories(donorCategoryId, rebalanceTarget.id, amount);
    setIsSubmitting(false);

    if (res.error) {
      setRebalanceMsg(res.error);
    } else {
      setRebalanceTarget(null);
      setDonorCategoryId("");
      setTransferAmount("");
      if (onRefresh) onRefresh();
    }
  };

  const renderCategoryGroup = (title: string, list: CategoryWithBudget[], icon: any) => {
    const Icon = icon;
    const groupTarget = list.reduce((acc, c) => acc + c.target_monthly, 0);
    const groupSpent = list.reduce((acc, c) => acc + c.spent_this_month, 0);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-primary" /> {title} ({list.length})
          </h3>
          <span className="text-xs font-mono font-semibold">
            ${groupSpent.toLocaleString()} / ${groupTarget.toLocaleString()}
          </span>
        </div>

        <div className="space-y-2">
          {list.map((cat) => {
            return (
              <div
                key={cat.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  cat.is_overspent
                    ? "border-destructive/50 bg-destructive/5 shadow-xs"
                    : "border-border bg-card shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold">{cat.name}</span>
                      {cat.is_subscription && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Sub</Badge>
                      )}
                      {cat.is_overspent && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" /> Overspent
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {cat.rollover_rule === "rollover" ? "Rolls over month-to-month" : "Sweeps to waterfall"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sm">
                      ${cat.spent_this_month.toLocaleString()}
                      <span className="text-xs text-muted-foreground font-normal"> / ${cat.target_monthly.toLocaleString()}</span>
                    </span>
                    <span
                      className={`text-xs block font-medium ${
                        cat.remaining_this_month < 0 ? "text-destructive font-bold" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {cat.remaining_this_month < 0
                        ? `-$${Math.abs(cat.remaining_this_month).toLocaleString()} over`
                        : `$${cat.remaining_this_month.toLocaleString()} left`}
                    </span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <Progress
                    value={cat.percent_spent}
                    className={`h-2 rounded-full ${
                      cat.is_overspent ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
                    }`}
                  />
                </div>

                {cat.is_overspent && (
                  <div className="mt-2.5 pt-2 border-t border-destructive/20 flex items-center justify-between">
                    <span className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Money must move!
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRebalanceTarget(cat)}
                      className="h-7 text-xs font-bold gap-1 rounded-xl px-2.5"
                    >
                      <ArrowRightLeft className="w-3 h-3" /> Rebalance
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Budget Barometer */}
      <Card className="border-border shadow-xs rounded-2xl">
        <CardHeader className="pb-3.5 pt-5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-primary" /> Monthly Budget Governance
            </span>
            <Badge variant="outline" className="text-xs font-mono font-semibold">
              {categories.length} Envelopes Active
            </Badge>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight mt-2">
            ${totalSpentThisMonth.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              of ${totalMonthlyTarget.toLocaleString()} allocated
            </span>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Zero-based envelope governance. Unused variable cash sweeps into the Waterfall at month-end.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Overall Monthly Burn Rate</span>
              <span className="text-foreground">
                {totalMonthlyTarget > 0 ? Math.round((totalSpentThisMonth / totalMonthlyTarget) * 100) : 0}% Spent
              </span>
            </div>
            <Progress
              value={totalMonthlyTarget > 0 ? Math.min(100, Math.round((totalSpentThisMonth / totalMonthlyTarget) * 100)) : 0}
              className="h-3 rounded-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Groups */}
      {fixedCats.length > 0 && renderCategoryGroup("Fixed Survival Bills", fixedCats, Lock)}
      {variableCats.length > 0 && renderCategoryGroup("Variable Quality of Life", variableCats, Layers)}
      {sinkingCats.length > 0 && renderCategoryGroup("Rolling Sinking Reserves", sinkingCats, Sparkles)}

      {/* "Money Must Move" Rebalance Dialog (Feature #7) */}
      <Dialog open={!!rebalanceTarget} onOpenChange={(open) => !open && setRebalanceTarget(null)}>
        <DialogContent className="sm:max-w-md w-[92vw] max-w-[420px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Rebalance: Money Must Move
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              <strong>{rebalanceTarget?.name}</strong> is overspent by{" "}
              <span className="text-destructive font-bold">
                ${Math.abs(rebalanceTarget?.remaining_this_month || 0).toLocaleString()}
              </span>
              . Choose an envelope with surplus funds to cover this overage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRebalance} className="space-y-4 pt-2">
            {rebalanceMsg && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
                {rebalanceMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Take Money From (Surplus Category)
              </Label>
              <select
                value={donorCategoryId}
                onChange={(e) => setDonorCategoryId(e.target.value)}
                className="w-full h-11 px-3 text-sm rounded-xl border border-border bg-background"
                required
              >
                <option value="">Select a surplus envelope...</option>
                {eligibleDonors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (${d.remaining_this_month.toLocaleString()} available)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Transfer Amount ($)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder={Math.abs(rebalanceTarget?.remaining_this_month || 0).toString()}
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="h-11 text-base font-mono rounded-xl"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRebalanceTarget(null)}
                className="h-10 text-sm rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !donorCategoryId}
                className="h-10 text-sm font-semibold rounded-xl"
              >
                {isSubmitting ? "Transferring..." : "Confirm Rebalance"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
