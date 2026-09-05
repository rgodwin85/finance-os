"use client";

import React, { useState } from "react";
import { Download, FileText, Database, CheckCircle2, Shield } from "lucide-react";
import { exportUserData } from "@/actions/export";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = async (format: "json" | "csv") => {
    setIsExporting(true);
    setDownloadSuccess(null);

    const res = await exportUserData();
    setIsExporting(false);

    if (res.error || !res.success) {
      alert(res.error || "Failed to export data");
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    let filename = `finance-os-backup-${timestamp}.${format}`;
    let content = format === "json" ? res.jsonString! : res.csvString!;
    let mimeType = format === "json" ? "application/json" : "text/csv;charset=utf-8;";

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(`Downloaded ${filename} (${format.toUpperCase()})`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[92vw] max-w-[420px] rounded-2xl p-6">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold">Data Sovereignty & Export</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Your financial data is 100% yours. Export complete ledgers and backups anytime with zero lock-in.
          </DialogDescription>
        </DialogHeader>

        {downloadSuccess && (
          <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {/* CSV Export Option */}
          <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Transactions Ledger (.CSV)</h4>
                <p className="text-xs text-muted-foreground">For Excel, Numbers, and Google Sheets</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload("csv")}
              disabled={isExporting}
              className="text-xs h-9 gap-1.5 font-semibold"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
          </div>

          {/* JSON Full System Export Option */}
          <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Complete Database (.JSON)</h4>
                <p className="text-xs text-muted-foreground">Full schema backup with all buckets</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload("json")}
              disabled={isExporting}
              className="text-xs h-9 gap-1.5 font-semibold"
            >
              <Download className="w-3.5 h-3.5" /> JSON
            </Button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
