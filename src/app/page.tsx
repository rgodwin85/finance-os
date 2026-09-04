"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, Sparkles, RefreshCw } from "lucide-react";
import { BottomNav, NavTab } from "@/components/layout/bottom-nav";
import { WaterfallCard } from "@/components/dashboard/waterfall-card";
import { QuickAddDialog } from "@/components/transactions/quick-add-dialog";
import { SinkingFundsCard } from "@/components/sinking-funds/sinking-funds-card";
import { UtilityBufferCard } from "@/components/utilities/utility-buffer-card";
import { RecentTransactions } from "@/components/transactions/recent-transactions";
import { getWaterfallData } from "@/actions/waterfall";
import { getSinkingFunds, SinkingFundItem } from "@/actions/sinking-funds";
import { getTransactions, TransactionItem } from "@/actions/transactions";
import { WaterfallStage } from "@/lib/waterfall";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("waterfall");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // App State
  const [stages, setStages] = useState<WaterfallStage[]>([]);
  const [activeStageNumber, setActiveStageNumber] = useState(1);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [sinkingFunds, setSinkingFunds] = useState<SinkingFundItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [wf, funds, txs] = await Promise.all([
        getWaterfallData(),
        getSinkingFunds(),
        getTransactions(25),
      ]);

      setStages(wf.stages);
      setActiveStageNumber(wf.activeStageNumber);
      setTotalSaved(wf.totalSaved);
      setTotalTarget(wf.totalTarget);
      setOverallProgress(wf.overallProgress);
      setSinkingFunds(funds);
      setTransactions(txs);
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

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between max-w-md mx-auto shadow-2xl pb-24 selection:bg-primary/20">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none flex items-center gap-1.5">
              Finance OS
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                PWA
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Strict Priority Wealth Engine</p>
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Refresh Data"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
        </button>
      </header>

      {/* Main Tab Content */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Loading financial fortress...</span>
          </div>
        ) : (
          <>
            {activeTab === "waterfall" && (
              <WaterfallCard
                stages={stages}
                activeStageNumber={activeStageNumber}
                totalSaved={totalSaved}
                totalTarget={totalTarget}
                overallProgress={overallProgress}
                onRefresh={loadData}
              />
            )}

            {activeTab === "sinking" && (
              <SinkingFundsCard funds={sinkingFunds} onRefresh={loadData} />
            )}

            {activeTab === "utilities" && (
              <UtilityBufferCard />
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
    </main>
  );
}
