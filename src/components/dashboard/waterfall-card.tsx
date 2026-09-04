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
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Strict Waterfall Engine
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              Stage {activeStageNumber} Active
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            ${totalSaved.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              of ${totalTarget.toLocaleString()} total
            </span>
          </CardTitle>
          <CardDescription>
            Sequential wealth priorities. Downstream stages unlock automatically as earlier targets hit 100%.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Fortress Progress</span>
              <span>{overallProgress}% Total</span>
            </div>
            <Progress value={overallProgress} className="h-2.5 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* Waterfall Priority Stages */}
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const isActive = stage.stage === activeStageNumber;
          const isDone = stage.isCompleted;
          const isLocked = stage.isLocked;

          return (
            <div
              key={stage.stage}
              className={`relative rounded-xl border p-4 transition-all duration-200 ${
                isActive
                  ? "border-primary shadow-md bg-card ring-2 ring-primary/20"
                  : isDone
                  ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10"
                  : "border-border/60 bg-muted/30 opacity-75"
              }`}
            >
              {/* Stage Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isLocked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      stage.stage
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold leading-none">{stage.shortName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isDone ? (
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] px-2 py-0.5">
                      Completed
                    </Badge>
                  ) : isActive ? (
                    <Badge variant="default" className="text-[10px] px-2 py-0.5 animate-pulse">
                      Active Priority
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 text-muted-foreground flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress Bar & Markers */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono font-medium">
                    ${stage.currentAmount.toLocaleString()}
                    <span className="text-muted-foreground font-normal">
                      {" "}/ ${stage.targetAmount.toLocaleString()}
                    </span>
                  </span>
                  <span className="font-semibold text-primary">{stage.progressPercent}%</span>
                </div>

                <div className="relative pt-1">
                  <Progress
                    value={stage.progressPercent}
                    className={`h-2.5 ${
                      isDone
                        ? "[&>div]:bg-emerald-500"
                        : isActive
                        ? "[&>div]:bg-primary"
                        : "[&>div]:bg-muted-foreground/40"
                    }`}
                  />
                  {/* Visual Milestones: 25%, 50%, 75% markers */}
                  <div className="absolute top-1 left-1/4 -ml-0.5 w-1 h-2.5 bg-background/80 rounded-full pointer-events-none" />
                  <div className="absolute top-1 left-2/4 -ml-0.5 w-1 h-2.5 bg-background/80 rounded-full pointer-events-none" />
                  <div className="absolute top-1 left-3/4 -ml-0.5 w-1 h-2.5 bg-background/80 rounded-full pointer-events-none" />
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                  <span>$0</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center justify-between pt-1">
                {stage.milestoneBadge ? (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Award className="w-3 h-3" /> {stage.milestoneBadge}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Next milestone at {stage.progressPercent < 25 ? "25%" : stage.progressPercent < 50 ? "50%" : "75%"}
                  </span>
                )}

                {isActive && (
                  <Button
                    size="sm"
                    className="h-8 text-xs font-semibold gap-1"
                    onClick={() => setAllocatingStage(stage)}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Allocate Funds
                  </Button>
                )}

                {isLocked && (
                  <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1 italic">
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                    Unlocks when Stage {stage.stage - 1} hits 100%
                  </span>
                )}
              </div>

              {/* Sequential Waterfall Arrow Connector */}
              {idx < stages.length - 1 && (
                <div className="flex justify-center -mb-5 mt-2 relative z-10">
                  <div className="bg-background border border-border rounded-full p-1 shadow-xs text-muted-foreground">
                    <ArrowDown className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Allocation Dialog for Active Stage */}
      <Dialog open={!!allocatingStage} onOpenChange={(open) => !open && setAllocatingStage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-primary" />
              Allocate Funds to {allocatingStage?.shortName}
            </DialogTitle>
            <DialogDescription>
              Transfer savings or surplus income directly into this priority stage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAllocate} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="alloc-amount">Deposit Amount ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">$</span>
                <Input
                  id="alloc-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="250.00"
                  className="pl-7 text-lg font-mono"
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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Allocating..." : "Confirm Allocation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
