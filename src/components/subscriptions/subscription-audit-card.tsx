"use client";

import React, { useState } from "react";
import { Tv, Scissors, Check, AlertCircle, Sparkles, TrendingDown } from "lucide-react";
import { CategoryWithBudget, toggleSubscriptionCancellation } from "@/actions/categories";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SubscriptionAuditCardProps {
  categories: CategoryWithBudget[];
  onRefresh?: () => void;
}

export function SubscriptionAuditCard({ categories, onRefresh }: SubscriptionAuditCardProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const subs = categories.filter((c) => c.is_subscription);
  const totalMonthlyDrain = subs.reduce((acc, c) => acc + c.target_monthly, 0);
  const totalAnnualDrain = totalMonthlyDrain * 12;

  const flaggedSubs = subs.filter((c) => c.flagged_for_cancellation);
  const potentialAnnualSavings = flaggedSubs.reduce((acc, c) => acc + c.target_monthly * 12, 0);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    await toggleSubscriptionCancellation(id);
    setTogglingId(null);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Subscription Audit Bar */}
      <Card className="border-border shadow-xs rounded-2xl">
        <CardHeader className="pb-3.5 pt-5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-primary" /> Recurring Subscription Audit
            </span>
            <Badge variant="secondary" className="text-xs font-mono font-semibold px-2.5 py-1">
              {subs.length} Active Services
            </Badge>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight mt-2">
            ${totalMonthlyDrain.toLocaleString()}/mo
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (${totalAnnualDrain.toLocaleString()}/yr)
            </span>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Audit silent recurring leaks. Tap to flag subscriptions you can live without and reclaim cash flow.
          </CardDescription>
        </CardHeader>

        {potentialAnnualSavings > 0 && (
          <CardContent className="px-5 pb-5 pt-0">
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                    Flagged for Cancellation ({flaggedSubs.length})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Potential redirect to Waterfall
                  </span>
                </div>
              </div>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                +${potentialAnnualSavings.toLocaleString()}/yr
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Subscriptions List */}
      <div className="space-y-2.5">
        {subs.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-2xl bg-muted/20">
            <Tv className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
            <h4 className="text-base font-bold">No Subscriptions Tagged</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              Tag media streaming, software, or gym memberships as subscriptions during the Setup Wizard to audit them here.
            </p>
          </div>
        ) : (
          subs.map((sub) => {
            const isFlagged = sub.flagged_for_cancellation;
            return (
              <div
                key={sub.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isFlagged
                    ? "border-destructive/40 bg-destructive/5 shadow-xs"
                    : "border-border bg-card shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold">{sub.name}</h4>
                      {isFlagged && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Cancel Me
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 block">
                      ${sub.target_monthly}/mo • ${(sub.target_monthly * 12).toLocaleString()}/yr
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={isFlagged ? "default" : "outline"}
                    disabled={togglingId === sub.id}
                    onClick={() => handleToggle(sub.id)}
                    className={`h-8 text-xs font-bold gap-1 rounded-xl px-3 ${
                      isFlagged
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : "border-border"
                    }`}
                  >
                    {isFlagged ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Flagged
                      </>
                    ) : (
                      <>
                        <Scissors className="w-3.5 h-3.5" /> Flag to Cancel
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
