"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  DollarSign,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import {
  getHoldingBufferState,
  depositToHoldingBuffer,
  drawSalaryFromHoldingBuffer,
  updateHoldingBufferSettings,
  HoldingBufferState,
} from "@/actions/income-buffer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface IncomeHoldingBufferCardProps {
  onSalaryDrawn?: (amount: number) => void;
  onRefresh?: () => void;
}

export function IncomeHoldingBufferCard({
  onSalaryDrawn,
  onRefresh,
}: IncomeHoldingBufferCardProps) {
  const [state, setState] = useState<HoldingBufferState | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDescription, setDepositDescription] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  const [isDrawOpen, setIsDrawOpen] = useState(false);
  const [drawAmount, setDrawAmount] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [targetSalary, setTargetSalary] = useState("");
  const [isVariableIncome, setIsVariableIncome] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadBuffer = async () => {
    try {
      const data = await getHoldingBufferState();
      setState(data);
      setTargetSalary(data.targetMonthlySalary.toString());
      setIsVariableIncome(data.isVariableIncome);
    } catch (e) {
      console.error("Failed to load holding buffer state:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuffer();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) return;

    setIsDepositing(true);
    const res = await depositToHoldingBuffer(val, depositDescription || undefined);
    setIsDepositing(false);

    if (res.success) {
      setIsDepositOpen(false);
      setDepositAmount("");
      setDepositDescription("");
      setActionSuccess(`Deposited $${val.toLocaleString()} into Holding Buffer!`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadBuffer();
      onRefresh?.();
    }
  };

  const handleDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(drawAmount);
    if (isNaN(val) || val <= 0) return;

    setIsDrawing(true);
    const res = await drawSalaryFromHoldingBuffer(val);
    setIsDrawing(false);

    if (res.success) {
      setIsDrawOpen(false);
      setDrawAmount("");
      setActionSuccess(`Drew $${val.toLocaleString()} salary from Holding Buffer!`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadBuffer();
      onSalaryDrawn?.(val);
      onRefresh?.();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetSalary);
    if (isNaN(val) || val < 0) return;

    setIsSavingSettings(true);
    await updateHoldingBufferSettings({
      is_variable_income: isVariableIncome,
      target_monthly_salary: val,
    });
    setIsSavingSettings(false);
    setIsSettingsOpen(false);
    loadBuffer();
    onRefresh?.();
  };

  if (loading || !state) {
    return (
      <Card className="border-border shadow-xs rounded-2xl p-6 text-center text-sm text-muted-foreground">
        Loading Income Smoothing Buffer...
      </Card>
    );
  }

  // 3-6 months is target runway
  const runwayTargetMonths = 3;
  const targetBuffer = state.targetMonthlySalary * runwayTargetMonths;
  const runwayProgress =
    targetBuffer > 0 ? Math.min(100, Math.round((state.balance / targetBuffer) * 100)) : 0;

  return (
    <div className="space-y-4">
      <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="pb-3.5 pt-5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-500" /> Variable Income Smoothing
            </span>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-xs font-mono font-semibold px-2.5 py-0.5 ${
                  state.runwayMonths >= 3
                    ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    : state.runwayMonths >= 1
                    ? "border-primary/30 text-primary bg-primary/10"
                    : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                }`}
              >
                {state.runwayMonths} Mo Runway
              </Badge>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Buffer Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight">
              ${state.balance.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                / ${targetBuffer.toLocaleString()} target (3 mo)
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Target Monthly Salary Draw:{" "}
              <span className="font-semibold text-foreground font-mono">
                ${state.targetMonthlySalary.toLocaleString()} / mo
              </span>
            </p>
          </div>

          <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Eliminates gig, freelance, and commission feast-or-famine stress. Irregular checks park here,
            paying you a steady, predictable salary on schedule.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-4">
          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              {actionSuccess}
            </div>
          )}

          {/* Runway Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Income Fortress Runway</span>
              <span className="font-mono font-bold text-foreground">
                {state.runwayMonths} months ({runwayProgress}%)
              </span>
            </div>
            <Progress value={runwayProgress} className="h-2" />
          </div>

          {/* Two Main Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              onClick={() => setIsDepositOpen(true)}
              variant="outline"
              className="h-11 rounded-xl text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <ArrowDownLeft className="w-4 h-4" /> Deposit Irregular Check
            </Button>
            <Button
              onClick={() => {
                setDrawAmount(state.targetMonthlySalary.toString());
                setIsDrawOpen(true);
              }}
              disabled={state.balance <= 0}
              className="h-11 rounded-xl text-xs font-bold gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" /> Draw Monthly Salary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> Deposit Irregular Check
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add freelance earnings, client payments, bonus, or tax refund to your holding buffer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeposit} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="2500.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="text-base font-bold font-mono h-11 rounded-xl"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Description / Client</label>
              <Input
                placeholder="e.g. Q3 Design Contract, Client Acme"
                value={depositDescription}
                onChange={(e) => setDepositDescription(e.target.value)}
                className="text-sm h-10 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={isDepositing || !depositAmount}
              className="w-full h-11 rounded-xl font-bold text-xs mt-2"
            >
              {isDepositing ? "Depositing..." : "Confirm Deposit"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Draw Salary Dialog */}
      <Dialog open={isDrawOpen} onOpenChange={setIsDrawOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-primary" /> Draw Monthly Salary
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Withdraw your steady salary payment into your active operating account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDraw} className="space-y-3.5 pt-2">
            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs flex justify-between items-center">
              <span className="text-muted-foreground">Buffer Available:</span>
              <span className="font-mono font-bold text-foreground">
                ${state.balance.toLocaleString()}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Draw Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                value={drawAmount}
                onChange={(e) => setDrawAmount(e.target.value)}
                className="text-base font-bold font-mono h-11 rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isDrawing || !drawAmount || parseFloat(drawAmount) > state.balance}
              className="w-full h-11 rounded-xl font-bold text-xs mt-2"
            >
              {isDrawing ? "Withdrawing..." : "Draw & Disburse Salary"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" /> Holding Buffer Configuration
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tune your monthly salary draw rate for variable income smoothing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Target Monthly Salary Draw ($/mo)
              </label>
              <Input
                type="number"
                step="50"
                value={targetSalary}
                onChange={(e) => setTargetSalary(e.target.value)}
                className="text-base font-bold font-mono h-11 rounded-xl"
                required
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Baseline recommended: ${state.comfortableMonthly.toLocaleString()} (from your budget).
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSavingSettings}
              className="w-full h-11 rounded-xl font-bold text-xs mt-2"
            >
              {isSavingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
