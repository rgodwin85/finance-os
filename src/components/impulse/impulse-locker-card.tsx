"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  ShieldCheck,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Tag,
  AlertTriangle,
} from "lucide-react";
import {
  getImpulseLockerState,
  quarantineImpulseItem,
  cancelImpulseItem,
  unlockAndPurchaseImpulseItem,
  ImpulseLockerState,
  ImpulseItemData,
} from "@/actions/impulse";
import { hapticSuccess, hapticMedium, hapticWarning } from "@/lib/haptics";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ImpulseLockerCardProps {
  onRefresh?: () => void;
}

const COMMON_TRIGGERS = [
  "Social Media / TikTok Ad",
  "Flash Sale / Limited Discount",
  "Boredom / Late Night Browsing",
  "Stress / Emotional Shopping",
  "Peer Pressure / FOMO",
  "Other Impulse",
];

export function ImpulseLockerCard({ onRefresh }: ImpulseLockerCardProps) {
  const [state, setState] = useState<ImpulseLockerState | null>(null);
  const [loading, setLoading] = useState(true);

  // Quarantine Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [selectedTrigger, setSelectedTrigger] = useState(COMMON_TRIGGERS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await getImpulseLockerState();
      setState(data);
    } catch (e) {
      console.error("Failed to load impulse locker state:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuarantine = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(itemAmount);
    if (!itemName || isNaN(amt) || amt <= 0) return;

    setIsSubmitting(true);
    hapticMedium();
    const res = await quarantineImpulseItem({
      name: itemName,
      amount: amt,
      reason: selectedTrigger,
    });
    setIsSubmitting(false);

    if (res.success) {
      setItemName("");
      setItemAmount("");
      setIsAddOpen(false);
      loadData();
      onRefresh?.();
    }
  };

  const handleCancelItem = async (item: ImpulseItemData) => {
    hapticSuccess();
    const res = await cancelImpulseItem(item.id);
    if (res.success) {
      setCelebrationMsg(`🎉 Saved $${item.amount.toLocaleString()} by rejecting an impulse buy!`);
      setTimeout(() => setCelebrationMsg(null), 5000);
      loadData();
      onRefresh?.();
    }
  };

  const handlePurchaseItem = async (item: ImpulseItemData) => {
    hapticMedium();
    const res = await unlockAndPurchaseImpulseItem(item.id);
    if (res.success) {
      loadData();
      onRefresh?.();
    }
  };

  if (loading || !state) {
    return (
      <Card className="border-border shadow-xs rounded-2xl p-6 text-center text-sm text-muted-foreground">
        Loading 72-Hour Cooling Locker...
      </Card>
    );
  }

  const activeItems = state.items.filter((i) => i.status === "cooling");
  const pastItems = state.items.filter((i) => i.status !== "cooling");

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="pb-3.5 pt-5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" /> 72-Hour Impulse Cooling Locker
            </span>
            <Badge variant="outline" className="text-xs font-mono font-semibold px-2.5 py-0.5">
              {activeItems.length} Cooling
            </Badge>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                ${state.totalSaved.toLocaleString()}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                Total Cash Saved from Quarantined Impulses
              </p>
            </div>
            <Button
              onClick={() => setIsAddOpen(true)}
              size="sm"
              className="h-9 px-3 text-xs font-bold gap-1 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Quarantine Item
            </Button>
          </div>

          <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
            The 72-Hour Rule defeats emotional dopamine spending. Non-essential wants over $50 are placed on a 72-hour timer. If you still want it afterwards, buy it consciously.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-4">
          {celebrationMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4" />
              {celebrationMsg}
            </div>
          )}

          {/* Active Cooling Items */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Active Quarantine Vault ({activeItems.length})
            </h4>

            {activeItems.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-2xl bg-muted/20 space-y-1.5">
                <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500/60" />
                <p className="text-xs font-bold text-foreground">Locker is Empty</p>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  Next time you feel tempted by a late-night deal, lock it in for 72 hours first!
                </p>
              </div>
            ) : (
              activeItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.name}</h4>
                      {item.reason && (
                        <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 mt-1">
                          <Tag className="w-2.5 h-2.5 mr-1" />
                          {item.reason}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold font-mono text-foreground">
                        ${item.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Timer & Status */}
                  <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl border border-border/60 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {item.isUnlocked ? "Cooling Complete" : "Cooling Countdown"}
                    </span>
                    <span className={`font-bold ${item.isUnlocked ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {item.isUnlocked
                        ? "Unlocked ✅"
                        : `${item.hoursRemaining}h ${item.minutesRemaining}m left`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => handleCancelItem(item)}
                      variant="outline"
                      className="flex-1 h-9 rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> I Don't Need It (Save ${item.amount})
                    </Button>
                    {item.isUnlocked && (
                      <Button
                        onClick={() => handlePurchaseItem(item)}
                        className="h-9 px-3 rounded-xl text-xs font-bold"
                      >
                        <Unlock className="w-3.5 h-3.5 mr-1" /> Buy Now
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quarantine Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Quarantine Impulse Want
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Place this item on a 72-hour cooling countdown to eliminate impulse regret.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuarantine} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Item Name</label>
              <Input
                placeholder="e.g. Wireless Headphones, Designer Shoes"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="text-sm h-10 rounded-xl"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Price ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="120.00"
                value={itemAmount}
                onChange={(e) => setItemAmount(e.target.value)}
                className="text-sm font-mono h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">What triggered this desire?</label>
              <select
                value={selectedTrigger}
                onChange={(e) => setSelectedTrigger(e.target.value)}
                className="w-full h-10 rounded-xl bg-card border border-border px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              >
                {COMMON_TRIGGERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !itemName || !itemAmount}
              className="w-full h-11 rounded-xl font-bold text-xs mt-2"
            >
              {isSubmitting ? "Locking In..." : "Quarantine for 72 Hours"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
