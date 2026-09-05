"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Snowflake,
  TrendingDown,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Percent,
  Calendar,
  Sparkles,
  CheckCircle2,
  CreditCard,
  Zap,
} from "lucide-react";
import {
  simulateAllDebtStrategies,
  createDebt,
  updateDebt,
  deleteDebt,
  recordDebtPayment,
  DebtComparison,
  DebtItem,
  getDebts,
} from "@/actions/debts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface DebtSimulatorCardProps {
  onRefresh?: () => void;
}

export function DebtSimulatorCard({ onRefresh }: DebtSimulatorCardProps) {
  const [comparison, setComparison] = useState<DebtComparison | null>(null);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [extraPayment, setExtraPayment] = useState(150);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [debtName, setDebtName] = useState("");
  const [debtBalance, setDebtBalance] = useState("");
  const [debtApr, setDebtApr] = useState("");
  const [debtMinPay, setDebtMinPay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Record Payment Dialog
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [targetDebt, setTargetDebt] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const loadData = async (extra: number = extraPayment) => {
    try {
      const [rawDebts, comp] = await Promise.all([
        getDebts(),
        simulateAllDebtStrategies(extra),
      ]);
      setDebts(rawDebts);
      setComparison(comp);
    } catch (e) {
      console.error("Failed to load debt simulator data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(extraPayment);
  }, []);

  const handleExtraPaymentChange = (val: number) => {
    setExtraPayment(val);
    loadData(val);
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(debtBalance);
    const apr = parseFloat(debtApr);
    const min = parseFloat(debtMinPay);

    if (!debtName || isNaN(bal) || isNaN(apr) || isNaN(min)) return;

    setIsSubmitting(true);
    await createDebt({
      name: debtName,
      balance: bal,
      interest_rate: apr,
      minimum_payment: min,
    });
    setIsSubmitting(false);

    setDebtName("");
    setDebtBalance("");
    setDebtApr("");
    setDebtMinPay("");
    setIsAddOpen(false);
    loadData(extraPayment);
    onRefresh?.();
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm("Are you sure you want to delete this debt?")) return;
    await deleteDebt(id);
    loadData(extraPayment);
    onRefresh?.();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDebt) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsPaying(true);
    await recordDebtPayment(targetDebt.id, amt);
    setIsPaying(false);

    setIsPayOpen(false);
    setPayAmount("");
    setTargetDebt(null);
    loadData(extraPayment);
    onRefresh?.();
  };

  if (loading || !comparison) {
    return (
      <Card className="border-border shadow-xs rounded-2xl p-6 text-center text-sm text-muted-foreground">
        Simulating debt payoff acceleration...
      </Card>
    );
  }

  const activeResult = selectedStrategy === "avalanche" ? comparison.avalanche : comparison.snowball;

  return (
    <div className="space-y-4">
      {/* Payoff Command Card */}
      <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="pb-3.5 pt-5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-primary" /> Stage 3: Debt Freedom Engine
            </span>
            <Badge variant="outline" className="text-xs font-mono font-semibold px-2.5 py-0.5">
              {debts.length} {debts.length === 1 ? "Debt" : "Debts"}
            </Badge>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <CardTitle className="text-3xl font-extrabold tracking-tight">
                ${comparison.totalBalance.toLocaleString()}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Total Minimums: ${comparison.totalMinimums.toLocaleString()}/mo
              </p>
            </div>
            <Button
              onClick={() => setIsAddOpen(true)}
              size="sm"
              className="h-9 px-3 text-xs font-bold gap-1 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Add Debt
            </Button>
          </div>

          {/* Strategy Switcher */}
          <div className="grid grid-cols-2 bg-muted/60 p-1 rounded-2xl border border-border/80 text-xs font-bold mt-3">
            <button
              onClick={() => setSelectedStrategy("avalanche")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                selectedStrategy === "avalanche"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Avalanche (Max Interest Saved)
            </button>
            <button
              onClick={() => setSelectedStrategy("snowball")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                selectedStrategy === "snowball"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-cyan-500" />
              Snowball (Quick Wins)
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-4">
          {/* Extra Monthly Snowball Slider */}
          <div className="bg-muted/30 p-3.5 rounded-2xl border border-border/60 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Extra Monthly Acceleration:
              </span>
              <span className="font-mono font-bold text-foreground">
                +${extraPayment}/mo
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="25"
              value={extraPayment}
              onChange={(e) => handleExtraPaymentChange(parseInt(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted-foreground/20 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>$0 (Minimums only)</span>
              <span>+$500/mo</span>
              <span>+$1,000/mo</span>
            </div>
          </div>

          {/* Payoff Comparison Barometer */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="bg-card p-3 rounded-xl border border-border/80 text-center space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Debt-Free Date
              </span>
              <div className="text-base font-extrabold text-foreground font-mono">
                {activeResult.payoffDate}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                {activeResult.monthsSavedVsBaseline > 0
                  ? `-${activeResult.monthsSavedVsBaseline} mos faster`
                  : "Standard pace"}
              </span>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border/80 text-center space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Interest Saved
              </span>
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                ${activeResult.interestSavedVsBaseline.toLocaleString()}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                vs minimums
              </span>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border/80 text-center space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Total Interest
              </span>
              <div className="text-base font-extrabold text-foreground font-mono">
                ${activeResult.totalInterestPaid.toLocaleString()}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                to creditors
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ordered Repayment Assault Queue */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center justify-between">
          <span>Priority Assault Sequence ({selectedStrategy})</span>
          <span className="text-[11px] font-normal normal-case">Target #1 receives all extra snowball cash</span>
        </h3>

        {debts.length === 0 ? (
          <Card className="border-dashed border-border rounded-2xl p-8 text-center bg-muted/10 space-y-2">
            <CreditCard className="w-9 h-9 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-bold text-foreground">Zero Debts Tracked</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Add your credit cards or consumer loans to simulate your exact debt-free day.
            </p>
            <Button
              onClick={() => setIsAddOpen(true)}
              size="sm"
              className="mt-2 text-xs font-bold rounded-xl"
            >
              Add First Debt
            </Button>
          </Card>
        ) : (
          activeResult.orderedDebts.map((item) => {
            const isTargetOne = item.rank === 1;
            const fullDebt = debts.find((d) => d.id === item.id);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isTargetOne
                    ? "border-primary/40 bg-primary/5 shadow-xs"
                    : "border-border/80 bg-card"
                } space-y-2.5`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold font-mono ${
                        isTargetOne
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      #{item.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-foreground">{item.name}</h4>
                        {isTargetOne && (
                          <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[10px] font-bold px-1.5 py-0">
                            Active Target
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {item.interest_rate}% APR • Min: ${item.minimum_payment}/mo
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold font-mono text-foreground">
                      ${item.balance.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground block font-mono">
                      Payoff: {item.payoffDate}
                    </span>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    Projected Interest: <span className="font-mono font-semibold">${item.totalInterest.toLocaleString()}</span>
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (fullDebt) {
                          setTargetDebt(fullDebt);
                          setPayAmount(fullDebt.minimum_payment.toString());
                          setIsPayOpen(true);
                        }
                      }}
                      className="h-7 text-xs font-bold px-2.5 rounded-lg"
                    >
                      Record Payment
                    </Button>
                    <button
                      onClick={() => handleDeleteDebt(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg"
                      title="Delete Debt"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Debt Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Add Consumer Debt
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add credit card, personal loan, or auto balance to Stage 3.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDebt} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Debt Name</label>
              <Input
                placeholder="e.g. Chase Sapphire, Auto Loan"
                value={debtName}
                onChange={(e) => setDebtName(e.target.value)}
                className="text-sm h-10 rounded-xl"
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Current Balance ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="3500.00"
                  value={debtBalance}
                  onChange={(e) => setDebtBalance(e.target.value)}
                  className="text-sm font-mono h-10 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Interest Rate (APR %)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="24.99"
                  value={debtApr}
                  onChange={(e) => setDebtApr(e.target.value)}
                  className="text-sm font-mono h-10 rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Minimum Monthly Payment ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="100.00"
                value={debtMinPay}
                onChange={(e) => setDebtMinPay(e.target.value)}
                className="text-sm font-mono h-10 rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-bold text-xs mt-2"
            >
              {isSubmitting ? "Adding..." : "Add Debt to Stage 3"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Record Debt Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Paying down {targetDebt?.name}. Current balance: ${targetDebt?.balance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Payment Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="text-base font-bold font-mono h-11 rounded-xl"
                autoFocus
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isPaying || !payAmount}
              className="w-full h-11 rounded-xl font-bold text-xs mt-2"
            >
              {isPaying ? "Recording..." : "Confirm Payment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
