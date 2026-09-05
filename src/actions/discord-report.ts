"use server";

import { createClient } from "@/lib/supabase/server";
import { getWaterfallData } from "@/actions/waterfall";
import { getStreakStatus } from "@/actions/streaks";
import { getImpulseLockerState } from "@/actions/impulse";
import { getIncomeProfile } from "@/actions/income";

export async function dispatchDiscordSnapshot(): Promise<{ success: boolean; message: string }> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      success: false,
      message: "Discord webhook URL is not configured in environment variables.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [wf, streak, impulse, profile] = await Promise.all([
    getWaterfallData(),
    getStreakStatus(),
    getImpulseLockerState(),
    getIncomeProfile(),
  ]);

  const activeStage = wf.stages.find((s) => s.stage === wf.activeStageNumber);
  const stageName = activeStage?.name || `Stage ${wf.activeStageNumber}`;
  const stageProgress = activeStage?.progressPercent || 0;
  const stageSaved = activeStage?.currentAmount || 0;
  const stageTarget = activeStage?.targetAmount || 0;

  const netIncome = profile?.monthly_net_income || 0;
  const barebones = profile?.barebones_monthly || 0;
  const monthlySurplus = netIncome > 0 ? netIncome - barebones : 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://finance-os-psi-inky.vercel.app";

  const discordPayload = {
    username: "Finance OS Intelligence",
    avatar_url: "https://raw.githubusercontent.com/rgodwin85/finance-os/main/public/icon.svg",
    embeds: [
      {
        title: "🛡️ Finance OS • Financial Fortress Intelligence Snapshot",
        url: appUrl,
        description: `Real-time intelligence report for **${user?.email || "Finance OS User"}**.\n\n🔗 **[Launch Finance OS PWA](${appUrl})**`,
        color: 0x10b981, // Emerald green
        fields: [
          {
            name: `🎯 Active Milestone: Stage ${wf.activeStageNumber}`,
            value: `**${stageName}**\n\`[${stageProgress}% Funded]\` • **$${stageSaved.toLocaleString()}** / $${stageTarget.toLocaleString()}`,
            inline: false,
          },
          {
            name: "🔥 Habit Streak",
            value: `**${streak.currentStreak} Days** consecutive logging\n*(Personal Best: ${streak.longestStreak}d)*`,
            inline: true,
          },
          {
            name: "📊 Monthly Margin",
            value: monthlySurplus >= 0 ? `**+$${monthlySurplus.toLocaleString()}/mo** Surplus` : `**-$${Math.abs(monthlySurplus).toLocaleString()}/mo** Deficit`,
            inline: true,
          },
          {
            name: "🧊 Impulse Locker Saved",
            value: `**$${impulse.totalSaved.toLocaleString()}** protected from impulse buys`,
            inline: false,
          },
        ],
        footer: {
          text: "Finance OS • Strict Priority Waterfall & Zero-Based Governance",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, message: `Discord returned error: ${errText}` };
    }

    return { success: true, message: "Intelligence snapshot dispatched to your Discord channel!" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to reach Discord webhook." };
  }
}
