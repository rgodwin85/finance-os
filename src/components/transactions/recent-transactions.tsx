"use client";

import React from "react";
import { Receipt, ArrowUpRight } from "lucide-react";
import { TransactionItem } from "@/actions/transactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecentTransactionsProps {
  transactions: TransactionItem[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="border-border shadow-xs rounded-2xl">
      <CardHeader className="py-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Recent Outflows
          </CardTitle>
          <Badge variant="outline" className="text-xs font-mono font-semibold px-2 py-0.5">
            {transactions.length} logged
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground leading-relaxed">
            No expenses logged yet. Tap the <strong className="text-foreground">+</strong> button to capture an expense in &lt;15 seconds!
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <ArrowUpRight className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-bold leading-tight">{tx.category_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span>{tx.description || "General outflow"}</span>
                      <span>•</span>
                      <span className="font-mono">{tx.date}</span>
                    </div>
                  </div>
                </div>
                <div className="font-mono font-extrabold text-sm text-foreground">
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
