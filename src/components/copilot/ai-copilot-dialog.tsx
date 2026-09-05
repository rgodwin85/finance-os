"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Car,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Settings,
  RefreshCw,
  Trash2,
  Zap,
  Info,
  Layers,
  Fuel,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  analyzeVoiceBudgetInput,
  applyAIEstimatesToBudget,
} from "@/actions/ai-copilot";
import {
  AICopilotAnalysisResult,
  ConsumableItemEstimate,
  VehicleEstimate,
  AIProviderConfig,
} from "@/lib/ai-engine";
import { hapticSuccess, hapticMedium } from "@/lib/haptics";

interface AICopilotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PRESET_PROMPTS = [
  {
    label: "Toothpaste, Deodorant & Soap",
    text: "I use Burt's Bees charcoal toothpaste 2-pack, Every Man Jack deodorant 2-pack, and Dial soap two 8-packs of bar soap",
  },
  {
    label: "2018 Honda Civic Commute",
    text: "2018 Honda Civic, commute 25 miles a day, gas is $3.45 a gallon",
  },
  {
    label: "Paper Towels & Tide Pods",
    text: "Bounty paper towels 12-pack and Tide pods laundry detergent 80 count",
  },
  {
    label: "Ford F-150 Truck",
    text: "2021 Ford F-150, 35 miles a day commute, gas is $3.60 a gallon",
  },
];

export function AICopilotDialog({
  open,
  onOpenChange,
  onSuccess,
}: AICopilotDialogProps) {
  const [activeTab, setActiveTab] = useState<"copilot" | "settings">("copilot");
  const [inputText, setInputText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [analysis, setAnalysis] = useState<AICopilotAnalysisResult | null>(null);
  const [editableConsumables, setEditableConsumables] = useState<ConsumableItemEstimate[]>([]);
  const [editableVehicle, setEditableVehicle] = useState<VehicleEstimate | undefined>(undefined);
  const [applyResult, setApplyResult] = useState<{
    message: string;
    categories: string[];
    funds: string[];
  } | null>(null);

  // Provider Settings
  const [provider, setProvider] = useState<"builtin" | "groq" | "gemini" | "ollama">("builtin");
  const [groqKey, setGroqKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  // Speech Recognition Hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    setTranscript,
  } = useSpeechRecognition();

  // Load saved provider settings on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProvider = localStorage.getItem("finos_ai_provider") as any;
      const savedGroq = localStorage.getItem("finos_groq_key");
      const savedGemini = localStorage.getItem("finos_gemini_key");

      if (savedProvider) setProvider(savedProvider);
      if (savedGroq) setGroqKey(savedGroq);
      if (savedGemini) setGeminiKey(savedGemini);
    }
  }, []);

  // Update input text when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("finos_ai_provider", provider);
      localStorage.setItem("finos_groq_key", groqKey);
      localStorage.setItem("finos_gemini_key", geminiKey);
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const toggleMic = () => {
    hapticMedium();
    if (isListening) {
      stopListening();
    } else {
      setTranscript("");
      setInputText("");
      startListening();
    }
  };

  const handleRunAnalysis = async (textToAnalyze?: string) => {
    const query = textToAnalyze || inputText;
    if (!query.trim()) return;

    if (isListening) stopListening();
    setAnalyzing(true);
    setApplyResult(null);

    const config: AIProviderConfig = {
      provider,
      apiKey: provider === "groq" ? groqKey : provider === "gemini" ? geminiKey : undefined,
    };

    try {
      const res = await analyzeVoiceBudgetInput(query, config);
      setAnalysis(res);
      setEditableConsumables(res.consumables || []);
      setEditableVehicle(res.vehicle);
      hapticSuccess();
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRemoveConsumable = (id: string) => {
    setEditableConsumables((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateConsumableCost = (id: string, newCost: number) => {
    setEditableConsumables((prev) =>
      prev.map((c) => (c.id === id ? { ...c, monthlyCost: Math.max(0, newCost) } : c))
    );
  };

  const handleApplyToBudget = async () => {
    if (editableConsumables.length === 0 && !editableVehicle) return;

    setApplying(true);
    try {
      const res = await applyAIEstimatesToBudget({
        consumables: editableConsumables,
        vehicle: editableVehicle,
      });

      if (res.success) {
        hapticSuccess();
        setApplyResult({
          message: res.message,
          categories: res.appliedCategories,
          funds: res.appliedSinkingFunds,
        });
        if (onSuccess) onSuccess();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed to apply estimates.");
    } finally {
      setApplying(false);
    }
  };

  const totalConsumableMonthly = editableConsumables.reduce((s, c) => s + c.monthlyCost, 0);
  const totalFuelMonthly = editableVehicle?.monthlyFuelCost || 0;
  const totalMaintMonthly = editableVehicle?.monthlyMaintenanceQuota || 0;
  const grandMonthlyImpact = Math.round(totalConsumableMonthly + totalFuelMonthly + totalMaintMonthly);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-w-[540px] max-h-[88vh] rounded-3xl p-5 flex flex-col overflow-hidden">
        <DialogHeader className="text-left space-y-1 pb-2 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg font-black tracking-tight">AI Budgeting Copilot</DialogTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab(activeTab === "copilot" ? "settings" : "copilot")}
                className={`p-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "settings"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
                title="AI Engine Settings"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-mono font-bold">
                  {provider === "builtin" ? "Built-in" : provider.toUpperCase()}
                </span>
              </button>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Voice-driven consumable frequency calculation, staple pricing, and vehicle operating cost estimation.
          </DialogDescription>
        </DialogHeader>

        {/* TAB 1: COPILOT ASSISTANT */}
        {activeTab === "copilot" && (
          <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4 text-xs text-foreground leading-relaxed">
            {/* Voice & Text Input Box */}
            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-primary" /> Natural Language / Voice Prompt
                </span>
                {isListening && (
                  <span className="text-[10px] font-bold text-rose-500 animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Listening...
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Dictate or type: 'I use Burt's Bees charcoal toothpaste 2-pack, Every Man Jack deodorant 2-pack, Dial soap two 8-packs, and drive a 2018 Honda Civic 25 miles a day'..."
                  rows={3}
                  className="w-full text-xs p-3 pr-12 rounded-xl bg-muted/40 border border-border/80 focus:outline-hidden focus:ring-2 focus:ring-primary/50 text-foreground resize-none"
                />

                {/* Microphone Button */}
                <button
                  onClick={toggleMic}
                  disabled={!isSupported}
                  className={`absolute right-2.5 bottom-3.5 p-2 rounded-xl transition-all shadow-xs ${
                    isListening
                      ? "bg-rose-500 text-white animate-bounce ring-4 ring-rose-500/20"
                      : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                  }`}
                  title={isListening ? "Stop Listening" : "Start Voice-to-Text"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Action Buttons & Chips */}
              <div className="flex items-center justify-between pt-0.5">
                <Button
                  onClick={() => handleRunAnalysis()}
                  disabled={analyzing || !inputText.trim()}
                  size="sm"
                  className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:opacity-90"
                >
                  {analyzing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {analyzing ? "Analyzing Items..." : "Calculate Frequency & Costs"}
                </Button>

                {inputText && (
                  <button
                    onClick={() => {
                      setInputText("");
                      setAnalysis(null);
                      setApplyResult(null);
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Preset Chips */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-semibold text-muted-foreground block">Quick Examples:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(p.text);
                        handleRunAnalysis(p.text);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-[10px] font-medium text-foreground transition-colors border border-border/50 text-left"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Success Banner */}
            {applyResult && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> {applyResult.message}
                </div>
                {applyResult.categories.length > 0 && (
                  <div className="text-[11px] pl-5">
                    <span className="font-semibold text-foreground">Updated Envelopes: </span>
                    {applyResult.categories.join(", ")}
                  </div>
                )}
                {applyResult.funds.length > 0 && (
                  <div className="text-[11px] pl-5">
                    <span className="font-semibold text-foreground">Configured Sinking Funds: </span>
                    {applyResult.funds.join(", ")}
                  </div>
                )}
              </div>
            )}

            {/* Analysis Results View */}
            {analysis && (
              <div className="space-y-3.5 animate-in fade-in">
                {/* Summary bar */}
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Analysis Engine</span>
                    <span className="text-xs font-semibold text-foreground">{analysis.providerUsed}</span>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/30">
                    +${grandMonthlyImpact}/mo Total
                  </Badge>
                </div>

                {/* Parsed Consumables List */}
                {editableConsumables.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                      Pantry & Consumables ({editableConsumables.length} items)
                    </span>

                    <div className="space-y-2">
                      {editableConsumables.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-foreground text-xs block">{item.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0">
                                  {item.packDescription}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  Est. ${item.estimatedPackPrice.toFixed(2)} pack
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className="font-mono font-extrabold text-xs text-foreground block">
                                  +${item.monthlyCost.toFixed(2)}
                                </span>
                                <span className="text-[9px] text-muted-foreground block font-mono">per month</span>
                              </div>
                              <button
                                onClick={() => handleRemoveConsumable(item.id)}
                                className="p-1 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                            <span>{item.reasoning}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border">
                              {item.suggestedCategory}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parsed Vehicle Details */}
                {editableVehicle && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-blue-500" />
                      Vehicle Commute & Maintenance
                    </span>

                    <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-foreground text-xs block">
                            {editableVehicle.year} {editableVehicle.make} {editableVehicle.model}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {editableVehicle.mpg} MPG • {editableVehicle.monthlyMiles} mi/mo • ${editableVehicle.gasPricePerGallon.toFixed(2)}/gal
                          </span>
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs font-mono font-bold">
                          +${editableVehicle.monthlyFuelCost + editableVehicle.monthlyMaintenanceQuota}/mo
                        </Badge>
                      </div>

                      {/* 2 Allocations */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 space-y-0.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Fuel className="w-3 h-3 text-amber-500" /> Gasoline Envelope
                          </span>
                          <span className="text-sm font-bold font-mono text-foreground block">
                            ${editableVehicle.monthlyFuelCost}/mo
                          </span>
                          <span className="text-[9px] text-muted-foreground block">→ {editableVehicle.suggestedFuelCategory}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 space-y-0.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-emerald-500" /> Maintenance Sinking
                          </span>
                          <span className="text-sm font-bold font-mono text-foreground block">
                            ${editableVehicle.monthlyMaintenanceQuota}/mo
                          </span>
                          <span className="text-[9px] text-muted-foreground block">
                            → ${editableVehicle.annualMaintenanceTarget} annual target
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-muted-foreground">{editableVehicle.reasoning}</p>
                    </div>
                  </div>
                )}

                {/* 1-Tap Apply Button */}
                <div className="pt-2">
                  <Button
                    onClick={handleApplyToBudget}
                    disabled={applying || (editableConsumables.length === 0 && !editableVehicle)}
                    className="w-full h-11 text-xs font-bold rounded-2xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    {applying ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {applying
                      ? "Applying to Envelopes & Reserves..."
                      : `Apply +$${grandMonthlyImpact}/mo to Envelopes & Reserves`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SETTINGS (Open-Source / Low-Cost Provider Config) */}
        {activeTab === "settings" && (
          <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4 text-xs text-foreground leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
              <span className="font-bold text-primary flex items-center gap-1.5 text-sm">
                <Settings className="w-4 h-4" /> AI Engine Configuration
              </span>
              <p className="text-muted-foreground text-[11px]">
                Finance OS works 100% offline out of the box with zero setup. You can optionally connect open-source models (Groq Llama 3) or Google Gemini Flash for advanced web price research.
              </p>
            </div>

            {savedNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-xs animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Engine settings saved!
              </div>
            )}

            <div className="space-y-3">
              {/* Provider Selection Cards */}
              <div className="space-y-2">
                <label className="font-bold text-foreground block">Active Inference Engine:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setProvider("builtin")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      provider === "builtin"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span className="font-bold text-xs block text-foreground">Built-in Engine</span>
                    <span className="text-[10px] text-muted-foreground block">Offline • 100% Free • No Key</span>
                  </button>

                  <button
                    onClick={() => setProvider("groq")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      provider === "groq"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span className="font-bold text-xs block text-foreground">Groq Cloud (Llama 3)</span>
                    <span className="text-[10px] text-muted-foreground block">Free Tier • Open-Source</span>
                  </button>

                  <button
                    onClick={() => setProvider("gemini")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      provider === "gemini"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span className="font-bold text-xs block text-foreground">Google Gemini Flash</span>
                    <span className="text-[10px] text-muted-foreground block">Free Tier • Search Pricing</span>
                  </button>

                  <button
                    onClick={() => setProvider("ollama")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      provider === "ollama"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span className="font-bold text-xs block text-foreground">Ollama (Local)</span>
                    <span className="text-[10px] text-muted-foreground block">localhost:11434 • Private</span>
                  </button>
                </div>
              </div>

              {/* API Keys Configuration */}
              {provider === "groq" && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-card border border-border">
                  <label className="font-bold text-foreground block">Groq API Key (gsk_...):</label>
                  <p className="text-[11px] text-muted-foreground">
                    Get a free API key at <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-primary underline">console.groq.com</a>. Powered by Llama 3.3 70B Versatile.
                  </p>
                  <Input
                    type="password"
                    placeholder="gsk_..."
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    className="text-xs h-9 rounded-xl"
                  />
                </div>
              )}

              {provider === "gemini" && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-card border border-border">
                  <label className="font-bold text-foreground block">Google AI Studio Key (AIza...):</label>
                  <p className="text-[11px] text-muted-foreground">
                    Get a free key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-primary underline">aistudio.google.com</a>. Free tier includes Gemini 2.0 Flash.
                  </p>
                  <Input
                    type="password"
                    placeholder="AIza..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="text-xs h-9 rounded-xl"
                  />
                </div>
              )}

              {provider === "ollama" && (
                <div className="p-3 rounded-2xl bg-card border border-border text-[11px] text-muted-foreground space-y-1">
                  <span className="font-bold text-foreground block">Local Ollama Connection:</span>
                  <p>Requires Ollama running on <code>http://localhost:11434</code> with <code>llama3.1</code> pulled.</p>
                </div>
              )}

              <Button
                onClick={handleSaveSettings}
                size="sm"
                className="w-full h-10 rounded-xl text-xs font-bold gap-1.5"
              >
                Save Engine Preferences
              </Button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between shrink-0 text-[11px] text-muted-foreground">
          <span>Finance OS • Intelligent Budget Automation</span>
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
