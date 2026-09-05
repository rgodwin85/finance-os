"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Lock, Unlock, CheckCircle2, ShieldAlert, Award, PlusCircle, ArrowDown } from "lucide-react";
import { WaterfallStage } from "@/lib/waterfall";
import { allocateWaterfallFunds } from "@/actions/waterfall";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WaterfallCardProps {
  stages: WaterfallStage[];
  activeStageNumber: number;
  totalSaved: number;
  totalTarget: number;
  overallProgress: number;
  onRefresh?: () => void;
}

export function WaterfallCard({
  stages,
  activeStageNumber,
  totalSaved,
  totalTarget,
  overallProgress,
  onRefresh,
}: WaterfallCardProps) {
  const [allocatingStage, setAllocatingStage] = useState<WaterfallStage | null>(null);
  const [allocationAmount, setAllocationAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingStage) return;

    const amountNum = parseFloat(allocationAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid allocation amount greater than $0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await allocateWaterfallFunds(allocatingStage.stage, amountNum);

    setIsSubmitting(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      if (res.isCompleted) {
        triggerCelebration();
      }
      setAllocatingStage(null);
      setAllocationAmount("");
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Overview */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/10 shadow-sm rounded-2xl">
        <CardHeader className="pb-3.5 pt-5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Strict Waterfall Engine
            </span>
            <Badge variant="outline" className="text-xs font-mono font-semibold px-2.5 py-1">
              Stage {activeStageNumber} Active
            </Badge>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight mt-2">
            ${totalSaved.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              of ${totalTarget.toLocaleString()} total
            </span>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Sequential wealth priorities. Downstream stages unlock automatically as earlier targets hit 100%.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Fortress Progress</span>
              <span className="text-foreground">{overallProgress}% Total</span>
            </div>
            <Progress value={overallProgress} className="h-3 bg-muted rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Waterfall Priority Stages */}
      <div className="space-y-3.5">
        {stages.map((stage, idx) => {
          const isActive = stage.stage === activeStageNumber;
          const isDone = stage.isCompleted;
          const isLocked = stage.isLocked;

          return (
            <div
              key={stage.stage}
              className={`relative rounded-2xl border p-4.5 transition-all duration-200 ${
                isActive
                  ? "border-primary shadow-md bg-card ring-2 ring-primary/20"
                  : isDone
                  ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10"
                  : "border-border/60 bg-muted/20 opacity-75"
              }`}
            >
              {/* Stage Header */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold shrink-0 ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      stage.stage
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-tight">{stage.shortName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{stage.description}</p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isDone ? (
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-xs px-2.5 py-0.5 font-semibold">
                      Completed
                    </Badge>
                  ) : isActive ? (
                    <Badge variant="default" className="text-xs px-2.5 py-0.5 font-semibold animate-pulse">
                      Active Priority
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs px-2.5 py-0.5 text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress Bar & Markers */}
              <div className="mt-3.5 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-mono font-semibold text-sm">
                    ${stage.currentAmount.toLocaleString()}
                    <span className="text-muted-foreground font-normal text-xs">
                      {" "}/ ${stage.targetAmount.toLocaleString()}
                    </span>
                  </span>
                  <span className="font-bold text-sm text-primary">{stage.progressPercent}%</span>
                </div>

                <div className="relative pt-1">
                  <Progress
                    value={stage.progressPercent}
                    className={`h-3 rounded-full ${
                      isDone
                        ? "[&>div]:bg-emerald-500"
                        : isActive
                        ? "[&>div]:bg-primary"
                        : "[&>div]:bg-muted-foreground/40"
                    }`}
                  />
                  {/* Milestone Markers */}
                  <div className="absolute top-1 left-1/4 -ml-0.5 w-1 h-3 bg-background/80 rounded-full pointer-events-none" />
                  <div className="absolute top-1 left-2/4 -ml-0.5 w-1 h-3 bg-background/80 rounded-full pointer-events-none" />
                  <div className="absolute top-1 left-3/4 -ml-0.5 w-1 h-3 bg-background/80 rounded-full pointer-events-none" />
                </div>

                <div className="flex justify-between text-xs font-mono text-muted-foreground pt-0.5">
                  <span>$0</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-between pt-1">
                {stage.milestoneBadge ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> {stage.milestoneBadge}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Next threshold at {stage.progressPercent < 25 ? "25%" : stage.progressPercent < 50 ? "50%" : "75%"}
                  </span>
                )}

                {isActive && (
                  <Button
                    size="sm"
                    className="h-9 text-xs font-bold gap-1.5 px-3.5 rounded-xl shadow-xs"
                    onClick={() => setAllocatingStage(stage)}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Allocate Funds
                  </Button>
                )}

                {isLocked && (
                  <span className="text-xs text-muted-foreground/90 flex items-center gap-1.5 italic">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    Unlocks when Stage {stage.stage - 1} hits 100%
                  </span>
                )}
              </div>

              {/* Sequential Connector */}
              {idx < stages.length - 1 && (
                <div className="flex justify-center -mb-5 mt-2.5 relative z-10">
                  <div className="bg-background border border-border/80 rounded-full p-1 shadow-xs text-muted-foreground">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Allocation Dialog for Active Stage */}
      <Dialog open={!!allocatingStage} onOpenChange={(open) => !open && setAllocatingStage(null)}>
        <DialogContent className="sm:max-w-md w-[92vw] max-w-[425px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Unlock className="w-5 h-5 text-primary" />
              Allocate Funds to {allocatingStage?.shortName}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Transfer savings or surplus income directly into this priority stage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAllocate} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="alloc-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Deposit Amount ($)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-xl font-bold text-muted-foreground">$</span>
                <Input
                  id="alloc-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="250.00"
                  className="pl-8 h-12 text-xl font-bold font-mono rounded-xl"
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAllocatingStage(null)}
                disabled={isSubmitting}
                className="h-10 text-sm rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-10 text-sm font-semibold rounded-xl">
                {isSubmitting ? "Allocating..." : "Confirm Allocation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
