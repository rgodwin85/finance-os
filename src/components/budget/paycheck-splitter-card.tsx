"use client";

import React, { useState, useEffect } from "react";
import {
  Split,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  DollarSign,
  Receipt,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  previewPaycheckSplit,
  executePaycheckDisbursement,
  savePaycheckSplitPreferences,
  PaycheckSplitPreview,
  DisbursementReceipt,
} from "@/actions/paycheck-splitter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PaycheckSplitterCardProps {
  initialAmount?: number;
  onDisbursementComplete?: () => void;
}

export function PaycheckSplitterCard({
  initialAmount,
  onDisbursementComplete,
}: PaycheckSplitterCardProps) {
  const [amount, setAmount] = useState<string>(initialAmount ? initialAmount.toString() : "2400");
  const [fixedPct, setFixedPct] = useState(50);
  const [variablePct, setVariablePct] = useState(30);
  const [sinkingPct, setSinkingPct] = useState(10);
  const [waterfallPct, setWaterfallPct] = useState(10);

  const [preview, setPreview] = useState<PaycheckSplitPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [receipt, setReceipt] = useState<DisbursementReceipt | null>(null);

  const loadPreview = async (
    amtVal: number,
    customPcts?: { fixed: number; variable: number; sinking: number; waterfall: number }
  ) => {
    try {
      const data = await previewPaycheckSplit(amtVal, customPcts ? {
        fixedPct: customPcts.fixed,
        variablePct: customPcts.variable,
        sinkingPct: customPcts.sinking,
        waterfallPct: customPcts.waterfall,
      } : undefined);
      setPreview(data);
      if (!customPcts) {
        setFixedPct(data.fixedPct);
        setVariablePct(data.variablePct);
        setSinkingPct(data.sinkingPct);
        setWaterfallPct(data.waterfallPct);
      }
    } catch (e) {
      console.error("Failed to load paycheck split preview:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const val = parseFloat(amount) || 0;
    loadPreview(val);
  }, []);

  const handleAmountChange = (newAmtStr: string) => {
    setAmount(newAmtStr);
    const val = parseFloat(newAmtStr) || 0;
    loadPreview(val, {
      fixed: fixedPct,
      variable: variablePct,
      sinking: sinkingPct,
      waterfall: waterfallPct,
    });
  };

  const handlePctChange = (type: "fixed" | "variable" | "sinking" | "waterfall", val: number) => {
    let f = fixedPct;
    let v = variablePct;
    let s = sinkingPct;
    let w = waterfallPct;

    if (type === "fixed") f = val;
    if (type === "variable") v = val;
    if (type === "sinking") s = val;
    if (type === "waterfall") w = val;

    // Normalize so sum is 100
    const remainder = 100 - (f + v + s);
    w = Math.max(0, remainder);

    setFixedPct(f);
    setVariablePct(v);
    setSinkingPct(s);
    setWaterfallPct(w);

    const amtVal = parseFloat(amount) || 0;
    loadPreview(amtVal, { fixed: f, variable: v, sinking: s, waterfall: w });
  };

  const handleSavePreferences = async () => {
    await savePaycheckSplitPreferences({
      fixedPct,
      variablePct,
      sinkingPct,
      waterfallPct,
    });
    setShowConfig(false);
  };

  const handleExecute = async () => {
    if (!preview || preview.paycheckAmount <= 0) return;

    setIsExecuting(true);
    const res = await executePaycheckDisbursement({
      paycheckAmount: preview.paycheckAmount,
      fixedAmount: preview.fixedAmount,
      variableAmount: preview.variableAmount,
      sinkingAmount: preview.sinkingAmount,
      waterfallAmount: preview.waterfallAmount,
      autoFundWaterfall: true,
    });
    setIsExecuting(false);

    if (res.success) {
      setReceipt(res);
      onDisbursementComplete?.();
    }
  };

  if (loading || !preview) {
    return (
      <Card className="border-border shadow-xs rounded-2xl p-6 text-center text-sm text-muted-foreground">
        Loading Paycheck Splitter...
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="pb-3.5 pt-5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Split className="w-4 h-4 text-primary" /> Paycheck Splitter Engine
            </span>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Splitter Rules"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Net Paycheck Received</label>
            <div className="relative">
              <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                step="50"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-9 text-2xl font-bold font-mono h-13 rounded-2xl"
                placeholder="2400.00"
              />
            </div>
            {/* Quick Amount Pills */}
            <div className="flex gap-1.5 pt-1">
              {[1500, 2000, 2500, 3000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAmountChange(preset.toString())}
                  className="flex-1 py-1 text-xs font-mono font-semibold rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Eliminates manual math. Automatically splits incoming pay across your fixed bills, variable living,
            sinking reserves, and pours surplus directly into your active Waterfall stage.
          </CardDescription>
        </CardHeader>

        {/* Configuration Drawer */}
        {showConfig && (
          <div className="bg-muted/40 border-y border-border/80 px-5 py-4 space-y-3 animate-in fade-in text-xs">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span>Split Ratios (%)</span>
              <span className="font-mono text-muted-foreground font-semibold">Total: 100%</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Fixed Obligations</span>
                  <span className="font-mono font-bold text-foreground">{fixedPct}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={fixedPct}
                  onChange={(e) => handlePctChange("fixed", parseInt(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted-foreground/20 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Variable Living</span>
                  <span className="font-mono font-bold text-foreground">{variablePct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={variablePct}
                  onChange={(e) => handlePctChange("variable", parseInt(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted-foreground/20 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Sinking Funds</span>
                  <span className="font-mono font-bold text-foreground">{sinkingPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={sinkingPct}
                  onChange={(e) => handlePctChange("sinking", parseInt(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted-foreground/20 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Waterfall Surge</span>
                  <span className="font-mono font-bold text-foreground">{waterfallPct}%</span>
                </div>
                <div className="h-1.5 bg-muted-foreground/20 rounded-lg overflow-hidden flex items-center">
                  <div
                    className="bg-emerald-500 h-full rounded-lg transition-all"
                    style={{ width: `${waterfallPct}%` }}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSavePreferences}
              size="sm"
              className="w-full h-8 text-xs font-bold rounded-xl mt-1"
            >
              Save Split Ratios
            </Button>
          </div>
        )}

        <CardContent className="p-5 pt-0 space-y-4">
          {/* 4 Disbursement Envelopes */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* 1. Fixed Bills */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Fixed Bills ({preview.fixedPct}%)
              </span>
              <div className="text-lg font-extrabold text-foreground font-mono">
                ${preview.fixedAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Rent, utilities, insurance
              </span>
            </div>

            {/* 2. Variable Allowance */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Living Allowance ({preview.variablePct}%)
              </span>
              <div className="text-lg font-extrabold text-foreground font-mono">
                ${preview.variableAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Groceries, gas, dining
              </span>
            </div>

            {/* 3. Sinking Reserves */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Sinking Funds ({preview.sinkingPct}%)
              </span>
              <div className="text-lg font-extrabold text-foreground font-mono">
                ${preview.sinkingAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Auto, health, annual bills
              </span>
            </div>

            {/* 4. Waterfall Surge */}
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                Waterfall Surge ({preview.waterfallPct}%)
              </span>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                +${preview.waterfallAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium truncate block">
                👉 {preview.activeStageName}
              </span>
            </div>
          </div>

          {/* 1-Tap Execution Button */}
          <Button
            onClick={handleExecute}
            disabled={isExecuting || preview.paycheckAmount <= 0}
            className="w-full h-12 rounded-2xl font-bold text-xs gap-2 shadow-sm"
          >
            {isExecuting ? (
              "Funding Waterfall & Disbursing..."
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Disburse & Fund Waterfall (+${preview.waterfallAmount.toLocaleString()})
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Disbursement Receipt Dialog */}
      <Dialog open={!!receipt} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-lg font-extrabold">
              Disbursement Executed!
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Every dollar from your ${receipt?.paycheckAmount.toLocaleString()} paycheck has been given an intentional assignment.
            </DialogDescription>
          </DialogHeader>

          {receipt && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2">
                <div className="flex justify-between font-medium text-muted-foreground">
                  <span>Fixed Bills Account</span>
                  <span className="font-mono font-bold text-foreground">
                    ${receipt.fixedAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-muted-foreground">
                  <span>Operating Living Allowance</span>
                  <span className="font-mono font-bold text-foreground">
                    ${receipt.variableAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-muted-foreground">
                  <span>Sinking Fund Reserves</span>
                  <span className="font-mono font-bold text-foreground">
                    ${receipt.sinkingAmount.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-border/80 pt-2 flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Funded {receipt.fundedStageName}</span>
                  <span className="font-mono text-sm">
                    +${receipt.waterfallAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setReceipt(null)}
                className="w-full h-11 rounded-xl font-bold text-xs mt-1"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
