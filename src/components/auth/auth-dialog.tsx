"use client";

import React, { useState } from "react";
import { LogIn, UserPlus, Sparkles, Mail, Lock, Shield, CheckCircle2 } from "lucide-react";
import { signInWithEmail, signUpWithEmail, signInWithOtp } from "@/actions/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthDialog({ open, onOpenChange, onSuccess }: AuthDialogProps) {
  const [tab, setTab] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (tab === "signin") {
      const res = await signInWithEmail({ email, password });
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } else if (tab === "signup") {
      const res = await signUpWithEmail({ email, password });
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        if (res.requiresConfirmation) {
          setSuccessMsg("Account created! Check your email to confirm your account.");
        } else {
          onOpenChange(false);
          if (onSuccess) onSuccess();
        }
      }
    } else if (tab === "magic") {
      const res = await signInWithOtp(email);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Magic link sent! Check your email to sign in directly.");
      }
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[92vw] max-w-[420px] rounded-2xl p-6">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <Shield className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold">Finance OS Account</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Sign in to access your private waterfall fortress and sync across devices.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setErrorMsg(null); setSuccessMsg(null); }} className="w-full pt-1">
          <TabsList className="grid grid-cols-3 w-full h-11">
            <TabsTrigger value="signin" className="text-xs font-semibold">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="text-xs font-semibold">Sign Up</TabsTrigger>
            <TabsTrigger value="magic" className="text-xs font-semibold">Magic Link</TabsTrigger>
          </TabsList>

          {errorMsg && (
            <div className="mt-3 p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mt-3 p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-start gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="auth-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-11 text-base rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {tab !== "magic" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <Input
                    id="auth-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 text-base rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold rounded-xl mt-2 gap-2 shadow-sm"
            >
              {isLoading ? (
                "Processing..."
              ) : tab === "signin" ? (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              ) : tab === "signup" ? (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Send Magic Link
                </>
              )}
            </Button>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
