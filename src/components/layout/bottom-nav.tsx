"use client";

import React from "react";
import { Layers, Wallet, PiggyBank, Receipt, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab = "waterfall" | "budget" | "sinking" | "utilities" | "history";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "waterfall" as NavTab, label: "Waterfall", icon: Layers },
    { id: "budget" as NavTab, label: "Budget", icon: Wallet },
    { id: "sinking" as NavTab, label: "Sinking", icon: PiggyBank },
    { id: "utilities" as NavTab, label: "Buffers", icon: Zap },
    { id: "history" as NavTab, label: "Outflows", icon: Receipt },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-lg border-t border-border/80 pb-[max(env(safe-area-inset-bottom,0px),16px)] shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 h-full w-full transition-all relative select-none",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-sm" />
              )}
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110 text-primary")} />
              <span className="text-[11px] tracking-tight leading-none truncate w-full text-center px-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
