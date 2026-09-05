"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw, LogIn, LogOut, Download, Sparkles, Sliders, Tv, Wallet, Briefcase, Split, Zap, Layers, TrendingDown, Lock, BookOpen, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { BottomNav, NavTab } from "@/components/layout/bottom-nav";
import { WaterfallCard } from "@/components/dashboard/waterfall-card";
import { CashFlowRunRateCard } from "@/components/dashboard/cashflow-runrate-card";
import { DebtSimulatorCard } from "@/components/debts/debt-simulator-card";
import { QuickAddDialog } from "@/components/transactions/quick-add-dialog";
import { SinkingFundsCard } from "@/components/sinking-funds/sinking-funds-card";
import { UtilityBufferCard } from "@/components/utilities/utility-buffer-card";
import { IncomeHoldingBufferCard } from "@/components/utilities/income-holding-buffer-card";
import { RecentTransactions } from "@/components/transactions/recent-transactions";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { ExportDialog } from "@/components/export/export-dialog";
import { SetupWizardDialog } from "@/components/wizard/setup-wizard-dialog";
import { ManualDialog } from "@/components/manual/manual-dialog";
import { BudgetManagerCard } from "@/components/budget/budget-manager-card";
import { SubscriptionAuditCard } from "@/components/subscriptions/subscription-audit-card";
import { FreedomRateCalculator } from "@/components/calculator/freedom-rate-calculator";
import { PaycheckSplitterCard } from "@/components/budget/paycheck-splitter-card";
import { ImpulseLockerCard } from "@/components/impulse/impulse-locker-card";
import { StreakBadge } from "@/components/streaks/streak-badge";
import { getWaterfallData } from "@/actions/waterfall";
import { getSinkingFunds, SinkingFundItem } from "@/actions/sinking-funds";
import { getTransactions, TransactionItem } from "@/actions/transactions";
import { getCurrentUser, signOut } from "@/actions/auth";
import { getIncomeProfile, IncomeProfile } from "@/actions/income";
import { getCategoriesWithBudget, CategoryWithBudget } from "@/actions/categories";
import { dispatchDiscordSnapshot } from "@/actions/discord-report";
import { WaterfallStage } from "@/lib/waterfall";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("waterfall");
  const [waterfallSubView, setWaterfallSubView] = useState<"ladder" | "debts">("ladder");
  const [budgetSubView, setBudgetSubView] = useState<"envelopes" | "subscriptions" | "freedom" | "splitter" | "locker">("envelopes");
  const [bufferSubView, setBufferSubView] = useState<"income" | "utility">("income");
  const [splitterPrefillAmount, setSplitterPrefillAmount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // User Auth State
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);
  const [incomeProfile, setIncomeProfile] = useState<IncomeProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [sendingDiscord, setSendingDiscord] = useState(false);
  const [discordNotice, setDiscordNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // App Financial State
  const [stages, setStages] = useState<WaterfallStage[]>([]);
  const [activeStageNumber, setActiveStageNumber] = useState(1);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [sinkingFunds, setSinkingFunds] = useState<SinkingFundItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [categoriesWithBudget, setCategoriesWithBudget] = useState<CategoryWithBudget[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [user, profile, wf, funds, txs, cats] = await Promise.all([
        getCurrentUser(),
        getIncomeProfile(),
        getWaterfallData(),
        getSinkingFunds(),
        getTransactions(25),
        getCategoriesWithBudget(),
      ]);

      setCurrentUser(user);
      setIncomeProfile(profile);
      setStages(wf.stages);
      setActiveStageNumber(wf.activeStageNumber);
      setTotalSaved(wf.totalSaved);
      setTotalTarget(wf.totalTarget);
      setOverallProgress(wf.overallProgress);
      setSinkingFunds(funds);
      setTransactions(txs);
      setCategoriesWithBudget(cats);

      // Auto-trigger Setup Wizard if logged in but wizard hasn't been completed yet
      if (user && (!profile || !profile.wizard_completed)) {
        setIsWizardOpen(true);
      }
    } catch (err) {
      console.error("Error loading finance data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
    loadData();
  };

  const handleDispatchDiscord = async () => {
    setSendingDiscord(true);
    setIsProfileMenuOpen(false);
    try {
      const res = await dispatchDiscordSnapshot();
      if (res.success) {
        setDiscordNotice({ type: "success", text: res.message });
      } else {
        setDiscordNotice({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setDiscordNotice({ type: "error", text: err.message || "Failed to dispatch Discord snapshot." });
    } finally {
      setSendingDiscord(false);
      setTimeout(() => setDiscordNotice(null), 5000);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between max-w-md mx-auto shadow-2xl pb-32 selection:bg-primary/20">
      {/* Mobile Top Header - iOS Safe Area Padding prevents iPhone 11 notch/status-bar collision */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/80 pt-[max(env(safe-area-inset-top,0px),28px)] pb-3.5 px-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none flex items-center gap-1.5">
              Finance OS
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                PWA
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Strict Priority Wealth Engine</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={() => setIsManualOpen(true)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Operations Manual & Field Guide"
            aria-label="Operations Manual"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={handleManualRefresh}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Refresh Data"
            disabled={refreshing}
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
          </button>

          <StreakBadge />

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold font-mono transition-transform active:scale-95"
                title={currentUser.email || "User Account"}
              >
                {currentUser.email ? currentUser.email[0].toUpperCase() : "U"}
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-11 w-56 bg-card border border-border rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 space-y-0.5">
                  <div className="px-3 py-2 border-b border-border/60 text-muted-foreground truncate">
                    <span className="block font-medium text-foreground truncate">{currentUser.email}</span>
                  </div>
                  <button
                    onClick={() => { setIsManualOpen(true); setIsProfileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted font-medium transition-colors text-left"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    Field Guide & Rules
                  </button>
                  <button
                    onClick={handleDispatchDiscord}
                    disabled={sendingDiscord}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted font-medium transition-colors text-left"
                  >
                    <Send className={`w-3.5 h-3.5 text-primary ${sendingDiscord ? "animate-spin" : ""}`} />
                    {sendingDiscord ? "Sending Snapshot..." : "Send Discord Snapshot"}
                  </button>
                  <button
                    onClick={() => { setIsWizardOpen(true); setIsProfileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted font-medium transition-colors text-left"
                  >
                    <Sliders className="w-3.5 h-3.5 text-primary" />
                    Re-Run Setup Wizard
                  </button>
                  <button
                    onClick={() => { setIsExportOpen(true); setIsProfileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted font-medium transition-colors text-left"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    Export Data (CSV/JSON)
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-destructive/10 text-destructive font-medium transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAuthOpen(true)}
              className="h-8 text-xs font-bold gap-1 px-2.5 rounded-xl"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Discord Notification Toast Banner */}
      {discordNotice && (
        <div
          className={`mx-4 mt-2 p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            discordNotice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {discordNotice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{discordNotice.text}</span>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-muted-foreground">
            <RefreshCw className="w-7 h-7 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading financial fortress...</span>
          </div>
        ) : (
          <>
            {activeTab === "waterfall" && (
              <div className="space-y-4">
                {/* Waterfall Sub-View Switcher */}
                <div className="flex bg-muted/60 p-1 rounded-2xl border border-border/80 text-xs font-bold">
                  <button
                    onClick={() => setWaterfallSubView("ladder")}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      waterfallSubView === "ladder"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Waterfall Ladder
                  </button>
                  <button
                    onClick={() => setWaterfallSubView("debts")}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      waterfallSubView === "debts"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" /> Stage 3: Debt Payoff
                  </button>
                </div>

                {waterfallSubView === "ladder" ? (
                  <div className="space-y-4">
                    <CashFlowRunRateCard />
                    <WaterfallCard
                      stages={stages}
                      activeStageNumber={activeStageNumber}
                      totalSaved={totalSaved}
                      totalTarget={totalTarget}
                      overallProgress={overallProgress}
                      onRefresh={loadData}
                    />
                  </div>
                ) : (
                  <DebtSimulatorCard onRefresh={loadData} />
                )}
              </div>
            )}

            {activeTab === "budget" && (
              <div className="space-y-4">
                {/* Budget Sub-View Switcher (5-Way) */}
                <div className="grid grid-cols-5 bg-muted/60 p-1 rounded-2xl border border-border/80 text-[10px] font-bold">
                  <button
                    onClick={() => setBudgetSubView("envelopes")}
                    className={`py-2 px-0.5 rounded-xl transition-all flex items-center justify-center gap-1 truncate ${
                      budgetSubView === "envelopes"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Wallet className="w-3 h-3 shrink-0" /> <span className="truncate">Envelopes</span>
                  </button>
                  <button
                    onClick={() => setBudgetSubView("subscriptions")}
                    className={`py-2 px-0.5 rounded-xl transition-all flex items-center justify-center gap-1 truncate ${
                      budgetSubView === "subscriptions"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Tv className="w-3 h-3 shrink-0" /> <span className="truncate">Subs</span>
                  </button>
                  <button
                    onClick={() => setBudgetSubView("freedom")}
                    className={`py-2 px-0.5 rounded-xl transition-all flex items-center justify-center gap-1 truncate ${
                      budgetSubView === "freedom"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Briefcase className="w-3 h-3 shrink-0" /> <span className="truncate">Freedom</span>
                  </button>
                  <button
                    onClick={() => setBudgetSubView("splitter")}
                    className={`py-2 px-0.5 rounded-xl transition-all flex items-center justify-center gap-1 truncate ${
                      budgetSubView === "splitter"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Split className="w-3 h-3 shrink-0" /> <span className="truncate">Splitter</span>
                  </button>
                  <button
                    onClick={() => setBudgetSubView("locker")}
                    className={`py-2 px-0.5 rounded-xl transition-all flex items-center justify-center gap-1 truncate ${
                      budgetSubView === "locker"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Lock className="w-3 h-3 shrink-0" /> <span className="truncate">Locker</span>
                  </button>
                </div>

                {budgetSubView === "envelopes" && (
                  <BudgetManagerCard categories={categoriesWithBudget} onRefresh={loadData} />
                )}
                {budgetSubView === "subscriptions" && (
                  <SubscriptionAuditCard categories={categoriesWithBudget} onRefresh={loadData} />
                )}
                {budgetSubView === "freedom" && (
                  <FreedomRateCalculator />
                )}
                {budgetSubView === "splitter" && (
                  <PaycheckSplitterCard
                    initialAmount={splitterPrefillAmount}
                    onDisbursementComplete={loadData}
                  />
                )}
                {budgetSubView === "locker" && (
                  <ImpulseLockerCard onRefresh={loadData} />
                )}
              </div>
            )}

            {activeTab === "sinking" && (
              <SinkingFundsCard funds={sinkingFunds} onRefresh={loadData} />
            )}

            {activeTab === "utilities" && (
              <div className="space-y-4">
                {/* Buffer Sub-View Switcher */}
                <div className="flex bg-muted/60 p-1 rounded-2xl border border-border/80 text-xs font-bold">
                  <button
                    onClick={() => setBufferSubView("income")}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      bufferSubView === "income"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" /> Income Smoothing
                  </button>
                  <button
                    onClick={() => setBufferSubView("utility")}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      bufferSubView === "utility"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> Utility Bills
                  </button>
                </div>

                {bufferSubView === "income" ? (
                  <IncomeHoldingBufferCard
                    onSalaryDrawn={(amt) => {
                      setSplitterPrefillAmount(amt);
                      setActiveTab("budget");
                      setBudgetSubView("splitter");
                    }}
                    onRefresh={loadData}
                  />
                ) : (
                  <UtilityBufferCard />
                )}
              </div>
            )}

            {activeTab === "history" && (
              <RecentTransactions transactions={transactions} />
            )}
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) for < 15s Expense Entry */}
      <QuickAddDialog
        sinkingFunds={sinkingFunds}
        onTransactionAdded={loadData}
      />

      {/* Sticky Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      <AuthDialog
        open={isAuthOpen}
        onOpenChange={setIsAuthOpen}
        onSuccess={loadData}
      />

      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
      />

      <SetupWizardDialog
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSuccess={loadData}
      />

      <ManualDialog
        open={isManualOpen}
        onOpenChange={setIsManualOpen}
      />
    </main>
  );
}
