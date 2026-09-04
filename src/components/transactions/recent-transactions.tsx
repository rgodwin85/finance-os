"use client";

import React from "react";
import { Receipt, ArrowUpRight, Clock } from "lucide-react";
import { TransactionItem } from "@/actions/transactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecentTransactionsProps {
  transactions: TransactionItem[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-primary" />
            Recent Outflows
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            {transactions.length} logged
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No expenses logged yet. Tap the <strong className="text-foreground">+</strong> button below to capture in &lt;15 seconds!
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{tx.category_name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span>{tx.description || "General expense"}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>
                <div className="font-mono font-bold text-xs">
                  -${tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
