"use server";

import { createClient } from "@/lib/supabase/server";

export async function exportUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required to export data." };
  }

  const [categoriesRes, transactionsRes, sinkingFundsRes, milestonesRes, utilityRes] =
    await Promise.all([
      supabase.from("categories").select("*").eq("user_id", user.id),
      supabase
        .from("transactions")
        .select("*, categories(name, type)")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
      supabase.from("sinking_funds").select("*").eq("user_id", user.id),
      supabase.from("milestones").select("*").eq("user_id", user.id).order("waterfall_stage"),
      supabase.from("utility_buffers").select("*").eq("user_id", user.id),
    ]);

  const rawData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    categories: categoriesRes.data || [],
    transactions: transactionsRes.data || [],
    sinking_funds: sinkingFundsRes.data || [],
    milestones: milestonesRes.data || [],
    utility_buffers: utilityRes.data || [],
  };

  // Convert transactions to CSV
  const txRows = (transactionsRes.data || []).map((t: any) => ({
    Date: t.date,
    Amount: t.amount,
    Category: t.categories?.name || "Uncategorized",
    Type: t.categories?.type || "variable",
    Description: `"${(t.description || "").replace(/"/g, '""')}"`,
    CreatedAt: t.created_at,
  }));

  let csvContent = "Date,Amount,Category,Type,Description,CreatedAt\n";
  txRows.forEach((r) => {
    csvContent += `${r.Date},${r.Amount},${r.Category},${r.Type},${r.Description},${r.CreatedAt}\n`;
  });

  return {
    success: true,
    jsonString: JSON.stringify(rawData, null, 2),
    csvString: csvContent,
    recordCount: {
      transactions: (transactionsRes.data || []).length,
      sinkingFunds: (sinkingFundsRes.data || []).length,
      categories: (categoriesRes.data || []).length,
    },
  };
}
