"use client";

import React, { useState, useMemo } from "react";
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Award,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  DEFAULT_FIXED_CATEGORIES,
  DEFAULT_VARIABLE_CATEGORIES,
  DEFAULT_SINKING_CATEGORIES,
} from "@/lib/constants/default-categories";
import { completeSetupWizard } from "@/actions/wizard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SetupWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SetupWizardDialog({ open, onOpenChange, onSuccess }: SetupWizardDialogProps) {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STEP 1: INCOME
  const [grossInput, setGrossInput] = useState<string>("65000");
  const [payFrequency, setPayFrequency] = useState<"weekly" | "bi-weekly" | "monthly" | "annual">("annual");
  const [taxRate, setTaxRate] = useState<number>(22);

  // Compute live net monthly take home
  const netIncome = useMemo(() => {
    const gross = parseFloat(grossInput) || 0;
    let annual = 0;
    if (payFrequency === "weekly") annual = gross * 52;
    else if (payFrequency === "bi-weekly") annual = gross * 26;
    else if (payFrequency === "monthly") annual = gross * 12;
    else annual = gross;

    const monthlyGross = Math.round(annual / 12);
    const tax = Math.round(monthlyGross * (taxRate / 100));
    return {
      monthlyGross,
      monthlyNet: Math.max(0, monthlyGross - tax),
      tax,
    };
  }, [grossInput, payFrequency, taxRate]);

  // STEP 2: FIXED SURVIVAL CATEGORIES
  const [fixedItems, setFixedItems] = useState(
    DEFAULT_FIXED_CATEGORIES.map((cat) => ({
      name: cat.name,
      amount: cat.defaultMonthly.toString(),
      optedOut: cat.defaultMonthly === 0,
      description: cat.description,
    }))
  );

  // STEP 3: VARIABLE LIFE CATEGORIES
  const [variableItems, setVariableItems] = useState(
    DEFAULT_VARIABLE_CATEGORIES.map((cat) => ({
      name: cat.name,
      amount: cat.defaultMonthly.toString(),
      optedOut: false,
      isSubscription: cat.isSubscription || false,
      description: cat.description,
    }))
  );

  // STEP 4: SINKING FUNDS
  const [sinkingItems, setSinkingItems] = useState(
    DEFAULT_SINKING_CATEGORIES.map((cat) => ({
      name: cat.name,
      amount: cat.defaultMonthly.toString(),
      optedOut: false,
      description: cat.description,
    }))
  );

  // STEP 5: CONSUMER DEBTS
  const [debts, setDebts] = useState<
    Array<{
      id: string;
      name: string;
      balance: string;
      interestRate: string;
      minimumPayment: string;
      strategy: "avalanche" | "snowball";
    }>
  >([
    {
      id: "1",
      name: "Credit Card (High APR)",
      balance: "3500",
      interestRate: "24.99",
      minimumPayment: "110",
      strategy: "avalanche",
    },
  ]);

  const addDebt = () => {
    setDebts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "Personal Loan / Card",
        balance: "1500",
        interestRate: "18.5",
        minimumPayment: "50",
        strategy: "avalanche",
      },
    ]);
  };

  const removeDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  // STEP 6 CALCULATIONS
  const totals = useMemo(() => {
    const fixedTotal = fixedItems
      .filter((i) => !i.optedOut)
      .reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);

    const debtMinTotal = debts.reduce(
      (acc, d) => acc + (parseFloat(d.minimumPayment) || 0),
      0
    );

    const barebonesMonthly = Math.round(fixedTotal + debtMinTotal);

    const variableTotal = variableItems
      .filter((i) => !i.optedOut)
      .reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);

    const sinkingTotal = sinkingItems
      .filter((i) => !i.optedOut)
      .reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);

    const comfortableMonthly = Math.round(barebonesMonthly + variableTotal + sinkingTotal);
    const netCashFlow = netIncome.monthlyNet - comfortableMonthly;

    const stage1Target = Math.max(1000, Math.round(barebonesMonthly * 3));
    const stage2Target = Math.max(stage1Target * 2, Math.round(comfortableMonthly * 6));
    const totalDebtBalance = debts.reduce((acc, d) => acc + (parseFloat(d.balance) || 0), 0);

    return {
      fixedTotal,
      debtMinTotal,
      barebonesMonthly,
      variableTotal,
      sinkingTotal,
      comfortableMonthly,
      netCashFlow,
      stage1Target,
      stage2Target,
      totalDebtBalance,
    };
  }, [fixedItems, variableItems, sinkingItems, debts, netIncome]);

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await completeSetupWizard({
      income: {
        monthly_gross_income: netIncome.monthlyGross,
        monthly_net_income: netIncome.monthlyNet,
        pay_frequency: payFrequency === "annual" ? "monthly" : payFrequency,
        tax_rate_percent: taxRate,
      },
      fixedItems: fixedItems.map((i) => ({
        name: i.name,
        monthlyAmount: parseFloat(i.amount) || 0,
        optedOut: i.optedOut,
      })),
      variableItems: variableItems.map((i) => ({
        name: i.name,
        monthlyAmount: parseFloat(i.amount) || 0,
        optedOut: i.optedOut,
        isSubscription: i.isSubscription,
      })),
      sinkingItems: sinkingItems.map((i) => ({
        name: i.name,
        monthlyAmount: parseFloat(i.amount) || 0,
        optedOut: i.optedOut,
      })),
      debts: debts.map((d) => ({
        name: d.name,
        balance: parseFloat(d.balance) || 0,
        interestRate: parseFloat(d.interestRate) || 0,
        minimumPayment: parseFloat(d.minimumPayment) || 0,
        strategy: d.strategy,
      })),
    });

    setIsSubmitting(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-w-[520px] rounded-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col bg-background">
        {/* Wizard Header */}
        <div className="p-5 border-b border-border bg-gradient-to-r from-primary/10 via-background to-secondary/10 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Honest Reckoning Setup
            </span>
            <Badge variant="outline" className="text-xs font-mono font-semibold">
              Step {step} of 6
            </Badge>
          </div>
          <h2 className="text-lg font-black tracking-tight mt-1">
            {step === 1 && "Income Reality Check"}
            {step === 2 && "Essential Fixed Bills (Barebones)"}
            {step === 3 && "Variable Quality of Life Audit"}
            {step === 4 && "Sinking Funds (Hidden Leakages)"}
            {step === 5 && "Consumer Debt Payoff List"}
            {step === 6 && "The Financial Mirror & Commitment"}
          </h2>
          <Progress value={(step / 6) * 100} className="h-1.5 mt-3 rounded-full" />
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: INCOME */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your total baseline earnings. We calculate your true take-home pay to power your cash-flow engine.
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Gross Earnings Amount ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-xl font-bold text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={grossInput}
                    onChange={(e) => setGrossInput(e.target.value)}
                    className="pl-8 h-12 text-xl font-bold font-mono rounded-xl"
                    placeholder="65000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pay Frequency
                  </Label>
                  <select
                    value={payFrequency}
                    onChange={(e) => setPayFrequency(e.target.value as any)}
                    className="w-full h-11 px-3 text-sm font-medium rounded-xl border border-border bg-background"
                  >
                    <option value="annual">Annual Salary</option>
                    <option value="monthly">Monthly</option>
                    <option value="bi-weekly">Bi-Weekly (Every 2 wks)</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tax & Deductions (%)
                  </Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="h-11 text-base font-mono rounded-xl"
                    placeholder="22"
                  />
                </div>
              </div>

              {/* Live Net Calculation Preview */}
              <div className="p-4 rounded-2xl bg-card border border-primary/20 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                  <span>Monthly Gross Income</span>
                  <span className="font-mono">${netIncome.monthlyGross.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                  <span>Estimated Taxes & FICA ({taxRate}%)</span>
                  <span className="font-mono text-destructive">-${netIncome.tax.toLocaleString()}/mo</span>
                </div>
                <div className="pt-1.5 border-t border-border flex justify-between items-center">
                  <span className="text-sm font-bold">Net Monthly Take-Home</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ${netIncome.monthlyNet.toLocaleString()}/mo
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FIXED BILLS */}
          {step === 2 && (
            <div className="space-y-3.5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                These are non-negotiable survival expenses. <strong>Enter an amount</strong>, or explicitly tap <em>"I don't have this"</em>.
              </p>

              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {fixedItems.map((item, idx) => (
                  <div
                    key={item.name}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.optedOut
                        ? "bg-muted/30 border-dashed border-border/60 opacity-60"
                        : "bg-card border-border shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <span className={`text-sm font-bold ${item.optedOut ? "line-through text-muted-foreground" : ""}`}>
                          {item.name}
                        </span>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!item.optedOut ? (
                          <div className="relative w-24">
                            <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={item.amount}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFixedItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, amount: val } : it))
                                );
                              }}
                              className="pl-6 h-9 text-sm font-bold font-mono rounded-xl"
                            />
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            setFixedItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, optedOut: !it.optedOut } : it
                              )
                            );
                          }}
                          className={`text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-colors ${
                            item.optedOut
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground border-border"
                          }`}
                        >
                          {item.optedOut ? "Add Back" : "I don't have this"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-xl flex justify-between items-center text-sm font-bold">
                <span>Subtotal Barebones Bills:</span>
                <span className="font-mono text-primary">${totals.fixedTotal.toLocaleString()}/mo</span>
              </div>
            </div>
          )}

          {/* STEP 3: VARIABLE LIFE */}
          {step === 3 && (
            <div className="space-y-3.5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Day-to-day lifestyle expenses. Enter your realistic monthly budget, or click <em>"I don't spend here"</em>.
              </p>

              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {variableItems.map((item, idx) => (
                  <div
                    key={item.name}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.optedOut
                        ? "bg-muted/30 border-dashed border-border/60 opacity-60"
                        : "bg-card border-border shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${item.optedOut ? "line-through text-muted-foreground" : ""}`}>
                            {item.name}
                          </span>
                          {item.isSubscription && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">Sub</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!item.optedOut ? (
                          <div className="relative w-24">
                            <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={item.amount}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariableItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, amount: val } : it))
                                );
                              }}
                              className="pl-6 h-9 text-sm font-bold font-mono rounded-xl"
                            />
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            setVariableItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, optedOut: !it.optedOut } : it
                              )
                            );
                          }}
                          className={`text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-colors ${
                            item.optedOut
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground border-border"
                          }`}
                        >
                          {item.optedOut ? "Add Back" : "I don't spend here"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-xl flex justify-between items-center text-sm font-bold">
                <span>Subtotal Variable Lifestyle:</span>
                <span className="font-mono text-primary">${totals.variableTotal.toLocaleString()}/mo</span>
              </div>
            </div>
          )}

          {/* STEP 4: SINKING FUNDS */}
          {step === 4 && (
            <div className="space-y-3.5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Irregular, predictable expenses that cause credit card debt. Set a monthly contribution for each reserve.
              </p>

              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {sinkingItems.map((item, idx) => (
                  <div
                    key={item.name}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.optedOut
                        ? "bg-muted/30 border-dashed border-border/60 opacity-60"
                        : "bg-card border-border shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <span className={`text-sm font-bold ${item.optedOut ? "line-through text-muted-foreground" : ""}`}>
                          {item.name}
                        </span>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!item.optedOut ? (
                          <div className="relative w-24">
                            <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={item.amount}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSinkingItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, amount: val } : it))
                                );
                              }}
                              className="pl-6 h-9 text-sm font-bold font-mono rounded-xl"
                            />
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            setSinkingItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, optedOut: !it.optedOut } : it
                              )
                            );
                          }}
                          className={`text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-colors ${
                            item.optedOut
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground border-border"
                          }`}
                        >
                          {item.optedOut ? "Add Back" : "I don't have this"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-xl flex justify-between items-center text-sm font-bold">
                <span>Total Monthly Sinking Inflows:</span>
                <span className="font-mono text-primary">${totals.sinkingTotal.toLocaleString()}/mo</span>
              </div>
            </div>
          )}

          {/* STEP 5: DEBT LIST */}
          {step === 5 && (
            <div className="space-y-3.5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                List high-interest debt (&gt;6% APR). If you are debt-free, remove all cards to skip this stage!
              </p>

              <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
                {debts.map((debt) => (
                  <div key={debt.id} className="p-3.5 rounded-2xl border border-border bg-card shadow-xs space-y-2.5">
                    <div className="flex justify-between items-center">
                      <Input
                        value={debt.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDebts((prev) =>
                            prev.map((d) => (d.id === debt.id ? { ...d, name: val } : d))
                          );
                        }}
                        className="h-8 text-sm font-bold max-w-[220px]"
                        placeholder="Card or Loan Name"
                      />
                      <button
                        type="button"
                        onClick={() => removeDebt(debt.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Balance</Label>
                        <Input
                          type="number"
                          value={debt.balance}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDebts((prev) =>
                              prev.map((d) => (d.id === debt.id ? { ...d, balance: val } : d))
                            );
                          }}
                          className="h-9 text-xs font-mono font-bold"
                          placeholder="3500"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase text-muted-foreground">APR %</Label>
                        <Input
                          type="number"
                          value={debt.interestRate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDebts((prev) =>
                              prev.map((d) => (d.id === debt.id ? { ...d, interestRate: val } : d))
                            );
                          }}
                          className="h-9 text-xs font-mono font-bold"
                          placeholder="24.99"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Min Pay</Label>
                        <Input
                          type="number"
                          value={debt.minimumPayment}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDebts((prev) =>
                              prev.map((d) => (d.id === debt.id ? { ...d, minimumPayment: val } : d))
                            );
                          }}
                          className="h-9 text-xs font-mono font-bold"
                          placeholder="110"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addDebt}
                className="w-full text-xs font-bold gap-1.5 h-10 rounded-xl"
              >
                <Plus className="w-4 h-4" /> Add Another Debt
              </Button>
            </div>
          )}

          {/* STEP 6: THE FINANCIAL MIRROR */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center justify-center gap-1">
                  <Award className="w-4 h-4" /> Your Financial Contract
                </span>
                <h3 className="text-xl font-black">The Cold Hard Truth</h3>
              </div>

              {/* Net Cash Flow Barometer */}
              <div
                className={`p-4 rounded-2xl border shadow-xs ${
                  totals.netCashFlow >= 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                    : "bg-destructive/10 border-destructive/30 text-destructive-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">Net Monthly Cash Flow</span>
                  {totals.netCashFlow >= 0 ? (
                    <Badge className="bg-emerald-500 text-white flex items-center gap-1 font-bold text-xs">
                      <TrendingUp className="w-3.5 h-3.5" /> Surplus
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1 font-bold text-xs">
                      <TrendingDown className="w-3.5 h-3.5" /> Deficit
                    </Badge>
                  )}
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-black font-mono ${
                      totals.netCashFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                    }`}
                  >
                    {totals.netCashFlow >= 0 ? "+" : "-"}${Math.abs(totals.netCashFlow).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">per month remaining</span>
                </div>

                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {totals.netCashFlow >= 0
                    ? `Congratulations! You have $${totals.netCashFlow.toLocaleString()} of monthly surplus to aggressively feed into your Waterfall priority stages.`
                    : `Warning: You are currently spending $${Math.abs(totals.netCashFlow).toLocaleString()} more than your net income. Consider trimming variable categories before locking.`}
                </p>
              </div>

              {/* Dynamic Waterfall Targets Calibration Preview */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-card border border-border shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Dynamically Calibrated Waterfall Stages
                </span>

                <div className="flex justify-between items-center text-xs py-1 border-b border-border/50">
                  <span>Stage 1 (3-Mo Barebones)</span>
                  <span className="font-mono font-bold text-sm text-foreground">
                    ${totals.stage1Target.toLocaleString()}
                    <span className="text-xs text-muted-foreground font-normal"> (3 × ${totals.barebonesMonthly.toLocaleString()})</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs py-1 border-b border-border/50">
                  <span>Stage 2 (6-Mo Fortress)</span>
                  <span className="font-mono font-bold text-sm text-foreground">
                    ${totals.stage2Target.toLocaleString()}
                    <span className="text-xs text-muted-foreground font-normal"> (6 × ${totals.comfortableMonthly.toLocaleString()})</span>
                  </span>
                </div>

                {totals.totalDebtBalance > 0 && (
                  <div className="flex justify-between items-center text-xs py-1">
                    <span>Stage 3 (High-Interest Debt)</span>
                    <span className="font-mono font-bold text-sm text-destructive">
                      ${totals.totalDebtBalance.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between shrink-0">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
              className="h-10 text-xs font-bold gap-1 rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1"
            >
              Do this later
            </button>
          )}

          {step < 6 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setStep(step + 1)}
              className="h-10 text-xs font-bold gap-1.5 px-4 rounded-xl shadow-xs"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleFinish}
              className="h-11 text-sm font-bold gap-2 px-5 rounded-xl shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                "Calibrating..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Lock & Activate Waterfall
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
