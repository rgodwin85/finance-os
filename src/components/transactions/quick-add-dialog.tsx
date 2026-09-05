"use client";

import React, { useState } from "react";
import { Plus, Receipt, Sparkles } from "lucide-react";
import { addTransaction } from "@/actions/transactions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SinkingFundItem } from "@/actions/sinking-funds";

interface QuickAddDialogProps {
  sinkingFunds?: SinkingFundItem[];
  onTransactionAdded?: () => void;
}

const COMMON_CATEGORIES = [
  { name: "Groceries", type: "variable" },
  { name: "Dining Out", type: "variable" },
  { name: "Gas / Transit", type: "variable" },
  { name: "Utilities", type: "variable" },
  { name: "Coffee / Treats", type: "variable" },
  { name: "Shopping", type: "variable" },
  { name: "Health / Copay", type: "sinking_fund" },
  { name: "Home Maintenance", type: "sinking_fund" },
];

export function QuickAddDialog({ sinkingFunds = [], onTransactionAdded }: QuickAddDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [categoryName, setCategoryName] = useState("Groceries");
  const [description, setDescription] = useState("");
  const [selectedFundId, setSelectedFundId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMsg("Please enter an amount greater than $0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const selectedCat = COMMON_CATEGORIES.find((c) => c.name === categoryName);
    const catType = (selectedCat?.type || "variable") as "fixed" | "variable" | "sinking_fund";

    const res = await addTransaction({
      amount: amountVal,
      category_name: categoryName,
      category_type: catType,
      description: description || undefined,
      sinking_fund_id: selectedFundId || undefined,
    });

    setIsSubmitting(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setAmount("");
      setDescription("");
      setSelectedFundId("");
      setOpen(false);
      if (onTransactionAdded) onTransactionAdded();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) - Clear of bottom navigation bar */}
      <div className="fixed bottom-26 right-5 z-40 pointer-events-auto">
        <Button
          onClick={() => setOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground p-0 flex items-center justify-center transition-transform active:scale-95 ring-4 ring-background border border-primary/30"
          aria-label="Quick Add Expense"
        >
          <Plus className="w-7 h-7" />
        </Button>
      </div>

      {/* Quick Add Modal (< 15 second capture) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md w-[94vw] max-w-[425px] rounded-2xl p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Receipt className="w-5 h-5 text-primary" />
              Quick Add Expense
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Log an expense in under 15 seconds to keep your financial fortress accurate.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Big Amount Input - Min 16px to prevent iOS auto-zoom */}
            <div className="space-y-1.5">
              <Label htmlFor="quick-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount Spent
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-2xl font-bold text-muted-foreground">$</span>
                <Input
                  id="quick-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="pl-9 h-14 text-2xl font-bold font-mono tracking-tight rounded-xl"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Category Quick Pills */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_CATEGORIES.map((cat) => {
                  const isSelected = categoryName === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategoryName(cat.name)}
                      className={`text-xs px-3 py-2 rounded-xl border font-semibold transition-all h-9 flex items-center ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/40 text-muted-foreground hover:text-foreground border-border"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Sinking Fund Link */}
            {sinkingFunds.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="sinking-link" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Draw from Sinking Fund (Optional)
                </Label>
                <select
                  id="sinking-link"
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-xl border border-border bg-background"
                >
                  <option value="">None (Standard Outflow)</option>
                  {sinkingFunds.map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name} (Available: ${fund.current_balance})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="quick-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes (Optional)
              </Label>
              <Input
                id="quick-desc"
                placeholder="Trader Joe's, shell station, etc."
                className="h-11 text-base rounded-xl"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-semibold rounded-xl mt-2 shadow-sm"
            >
              {isSubmitting ? "Logging..." : "Log Outflow ($" + (amount || "0.00") + ")"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
