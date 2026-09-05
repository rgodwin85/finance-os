"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Layers,
  DollarSign,
  PieChart,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Compass,
  Flame,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ManualTab = "waterfall" | "income" | "budget" | "reserves" | "discipline";

export function ManualDialog({ open, onOpenChange }: ManualDialogProps) {
  const [activeTab, setActiveTab] = useState<ManualTab>("waterfall");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-w-[540px] max-h-[88vh] rounded-3xl p-5 flex flex-col overflow-hidden">
        <DialogHeader className="text-left space-y-1 pb-2 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg font-black tracking-tight">Operations Manual & Field Guide</DialogTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono uppercase font-bold text-primary border-primary/30">
              v1.0 Core
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            The strict mathematical architecture and operational rulebook for Finance OS.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher Pills */}
        <div className="flex gap-1 overflow-x-auto py-2 shrink-0 no-scrollbar border-b border-border/40">
          {[
            { id: "waterfall", label: "Waterfall", icon: Layers },
            { id: "income", label: "Income & Rates", icon: DollarSign },
            { id: "budget", label: "Envelopes", icon: PieChart },
            { id: "reserves", label: "Reserves", icon: ShieldCheck },
            { id: "discipline", label: "Discipline", icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ManualTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4 text-xs text-foreground leading-relaxed">
          {/* TAB 1: WATERFALL */}
          {activeTab === "waterfall" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5 text-sm">
                  <Layers className="w-4 h-4" /> The 5-Stage Wealth Waterfall
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Traditional budgeting fails because people split money into 10 buckets simultaneously, making zero meaningful progress. Finance OS uses a <strong>Strict Priority Waterfall</strong>: all surplus cash aggressively floods the <em>single active stage</em> until complete.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-[10px] font-mono">1</span>
                      Stage 1: Starter Emergency Shield
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">$1,000 Target</Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Keeps immediate minor catastrophes (tire replacement, dental copay) off credit cards. Must be parked in high-yield liquid cash.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-[10px] font-mono">2</span>
                      Stage 2: 3-Month Barebones Runway
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">3x Survival Math</Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Calculated strictly as <code>3 × Barebones Monthly Expenses</code> (rent, groceries, basic utilities, minimum debt payments). Protects against sudden job loss or income disruption.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-[10px] font-mono">3</span>
                      Stage 3: Consumer Debt Liquidation
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">Avalanche / Snowball</Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Eliminates toxic high-interest consumer debt (credit cards, personal loans, high-APR autos). Choose between <strong>Avalanche</strong> (highest APR first for mathematical efficiency) or <strong>Snowball</strong> (lowest balance first for psychological momentum).
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-[10px] font-mono">4</span>
                      Stage 4: 6-Month Comfortable Runway
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">6x Comfort Math</Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Calculated as <code>6 × Comfortable Monthly Outflows</code> (including gym, modest dining, subscriptions). Provides unconditional peace of mind.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-[10px] font-mono">5</span>
                      Stage 5: Wealth Engine & Surplus Investments
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">15%+ Inflow</Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Index funds, retirement compounding (401k/Roth IRA), real estate, or business equity. Only unlocked once high-interest debts and emergency runways are 100% fortified.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INCOME & FREEDOM */}
          {activeTab === "income" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5 text-sm">
                  <DollarSign className="w-4 h-4" /> Income Management & Freedom Numbers
                </span>
                <p className="text-muted-foreground text-[11px]">
                  How to determine net earnings, handle irregular income, and reverse-engineer your required hourly wage or salary.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Minimum Hourly Rate & Freedom Number
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Navigate to <strong>Budget → Freedom Rate</strong>. This engine reverse-engineers your required gross rate by factoring in:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                    <li>Target annual net income (funding your barebones + comfort budgets).</li>
                    <li>Estimated federal, state, and self-employment (FICA) tax drag (default 25%).</li>
                    <li>Actual billable hours per week (e.g. 32 billable hours vs 40 total).</li>
                    <li>Paid weeks off per year.</li>
                  </ul>
                  <p className="text-muted-foreground text-[11px] pt-1">
                    It calculates your exact <strong>Floor Rate</strong> (survival wage), <strong>Comfort Rate</strong>, and <strong>Thrive Rate</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Irregular Income Holding Buffer
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    If your income fluctuates (sales commissions, freelancing, contractor bonuses), <strong>never spend directly from lumpy deposits</strong>.
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Navigate to <strong>Buffers → Holding Buffer</strong>. Park all variable deposits into the Buffer. On the 1st of every month, transfer a fixed, consistent "Owner's Paycheck" to your primary checking account.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Automated Paycheck Splitter
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Navigate to <strong>Budget → Splitter</strong>. Enter any paycheck amount. In 1 tap, the algorithm automatically allocates:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                    <li>Fixed bills prorated to your pay period.</li>
                    <li>Variable grocery/spending envelopes.</li>
                    <li>Sinking fund daily quotas.</li>
                    <li>Remaining 100% surplus into the current active Waterfall milestone.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENVELOPES */}
          {activeTab === "budget" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5 text-sm">
                  <PieChart className="w-4 h-4" /> Zero-Based Envelopes & Governance
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Zero-based budgeting means <code>Income − Expenses − Waterfall Surge = $0</code>. Every dollar receives a strict assignment.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" /> The "Money Must Move" Rebalancer
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    In traditional apps, if you overspend dining out by $50, the app just shows a red bar and lets you ignore it. In Finance OS, <strong>phantom money does not exist</strong>.
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    When an envelope is overspent, you are required to rebalance: transfer cash from a surplus envelope (e.g. Entertainment or Groceries) to cover the deficit.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Default Comprehensive Categories
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Finance OS preloads 30+ default categories across 5 essential tiers (Fixed Survival, Variable Discretionary, Annual Sinking, Debt, and Savings). You never start with a blank screen.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-primary" /> Subscription Audit Hub
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Navigate to <strong>Budget → Subscriptions</strong>. View all recurring software, streaming, gym, and membership charges. Finance OS computes your annual drain and lets you audit active subscriptions with 1 tap.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESERVES */}
          {activeTab === "reserves" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4" /> Sinking Funds & Utility Absorbers
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Large, infrequent expenses (car insurance, tire replacements, holiday gifts, winter heating) should never blindside your monthly cash flow.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" /> Sinking Funds & Pennies-Per-Day Quotas
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Attach target dates and target amounts to upcoming irregular expenses. Finance OS breaks these down into:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                    <li><strong>Monthly Target:</strong> How much to set aside this month.</li>
                    <li><strong>Pennies Per Day:</strong> The tiny daily micro-quota (e.g. $4.10/day for car insurance) to make saving psychological effortless.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Seasonal Utility Spike Shock-Absorber
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Navigate to <strong>Buffers → Utility Buffer</strong>. Electric and natural gas bills spike sharply during peak summer cooling and winter heating.
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    The shock absorber tracks your 6-month trailing average. When a seasonal spike hits, tap <strong>"Absorb Spike from Utility Buffer"</strong> to cover the excess from your buffer, keeping your checking account completely shielded.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HABIT PSYCHOLOGY */}
          {activeTab === "discipline" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5 text-sm">
                  <Flame className="w-4 h-4 text-orange-500" /> Behavioral Friction & Habit Psychology
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Financial freedom is 20% math and 80% behavior. Finance OS builds real psychological rails to intercept reckless impulses.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-primary" /> Safe-to-Spend Daily Pacer
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Displayed on your Waterfall dashboard. Calculates your remaining variable discretionary cash divided by days remaining until your next paycheck. Tells you exactly what you can safely spend today without busting your budget.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-500" /> 72-Hour Impulse Cooling Locker
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Before buying something you didn't plan for, lock it in the <strong>Impulse Locker</strong>. A 72-hour countdown timer begins. When the timer expires, 70%+ of people realize they don't actually want the item, saving thousands in capital.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> Daily Logging Streaks & Mobile Haptics
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Logging transactions every day keeps you mindful. Finance OS tracks your consecutive daily logging streak and delivers subtle physical haptic vibrations on your phone when actions are taken.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Discord Intelligence Snapshots
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Tap the user menu to dispatch a rich real-time report directly to your personal Discord server, keeping your financial progress visible and accountable.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between shrink-0 text-[11px] text-muted-foreground">
          <span>Finance OS • Zero-Based Wealth Engine</span>
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-opacity"
          >
            Close Guide
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
