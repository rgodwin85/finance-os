"use client";

import React from "react";
import { Layers, PiggyBank, Receipt, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab = "waterfall" | "sinking" | "utilities" | "history";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "waterfall" as NavTab, label: "Waterfall", icon: Layers },
    { id: "sinking" as NavTab, label: "Sinking Funds", icon: PiggyBank },
    { id: "utilities" as NavTab, label: "Utility Buffer", icon: Zap },
    { id: "history" as NavTab, label: "Expenses", icon: Receipt },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-full w-full transition-colors relative",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-sm" />
              )}
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[11px] leading-tight tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
