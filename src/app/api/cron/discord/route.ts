import { NextRequest, NextResponse } from "next/navigation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handleDiscordReminder(req);
}

export async function POST(req: Request) {
  return handleDiscordReminder(req);
}

async function handleDiscordReminder(req: Request) {
  // Verify Bearer token if CRON_SECRET is configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        delivered: false,
        message: "DISCORD_WEBHOOK_URL is not configured in environment variables.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Build the rich Discord Embed payload
  const discordPayload = {
    username: "Finance OS Fortress",
    avatar_url: "https://raw.githubusercontent.com/rgodwin85/finance-os/main/public/icon.svg",
    embeds: [
      {
        title: "🛡️ Finance OS - Daily Expense Reminder",
        description: "Did you spend outside your fixed bills today? Log it now.",
        color: 0x2563eb, // Vibrant blue
        fields: [
          {
            name: "⚡ Quick Capture",
            value: "Tap the floating **+** button in Finance OS to log expenses in under 15 seconds.",
            inline: false,
          },
          {
            name: "🎯 Strict Waterfall Rules",
            value: "Every dollar outside your baseline impacts your emergency fund & wealth targets.",
            inline: false,
          },
        ],
        footer: {
          text: "Finance OS PWA • Strict Waterfall & Sinking Funds",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          success: false,
          delivered: false,
          status: response.status,
          error: errorText,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        delivered: true,
        message: "Discord notification sent successfully.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        delivered: false,
        error: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
