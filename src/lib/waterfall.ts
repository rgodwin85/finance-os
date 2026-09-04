export interface WaterfallStage {
  stage: number;
  name: string;
  shortName: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  isCompleted: boolean;
  isLocked: boolean;
  progressPercent: number;
  milestoneBadge?: string;
}

export const WATERFALL_STAGE_DEFINITIONS = [
  {
    stage: 1,
    name: "Stage 1: 3-Month Barebones Emergency Fund",
    shortName: "3-Mo Emergency",
    description: "Essential baseline survival expenses locked in high-yield cash.",
    defaultTarget: 9000,
  },
  {
    stage: 2,
    name: "Stage 2: 6-Month Full Emergency Fund",
    shortName: "6-Mo Full Emergency",
    description: "Complete financial fortress covering 6 months of comfortable living.",
    defaultTarget: 18000,
  },
  {
    stage: 3,
    name: "Stage 3: High-Interest Consumer Debt Payoff",
    shortName: "Debt Payoff (Avalanche)",
    description: "Aggressive elimination of any debt with interest rates > 6%.",
    defaultTarget: 5000,
  },
  {
    stage: 4,
    name: "Stage 4: Retirement Wealth (Roth IRA -> 401(k))",
    shortName: "Retirement Wealth",
    description: "Max out tax-advantaged accounts (Roth IRA first, then employer 401(k)).",
    defaultTarget: 14000,
  },
  {
    stage: 5,
    name: "Stage 5: Taxable Brokerage",
    shortName: "Taxable Brokerage",
    description: "Long-term compounding wealth in low-cost broad-market index funds.",
    defaultTarget: 25000,
  },
];

export function calculateWaterfallState(
  milestones: Array<{
    id?: string;
    waterfall_stage: number;
    name: string;
    target_amount: number;
    current_amount: number;
    is_completed: boolean;
  }>
): {
  stages: WaterfallStage[];
  activeStageNumber: number;
  totalTarget: number;
  totalSaved: number;
  overallProgress: number;
} {
  // Map standard definitions with database state
  const stages: WaterfallStage[] = WATERFALL_STAGE_DEFINITIONS.map((def) => {
    const found = milestones.find((m) => m.waterfall_stage === def.stage);
    const target = found?.target_amount && found.target_amount > 0 ? Number(found.target_amount) : def.defaultTarget;
    const current = found?.current_amount ? Number(found.current_amount) : 0;
    const isCompleted = found?.is_completed || current >= target;
    const rawPercent = target > 0 ? (current / target) * 100 : 0;
    const progressPercent = Math.min(100, Math.max(0, Math.round(rawPercent * 10) / 10));

    let milestoneBadge: string | undefined;
    if (progressPercent >= 100) milestoneBadge = "100% Unlocked";
    else if (progressPercent >= 75) milestoneBadge = "75% Master";
    else if (progressPercent >= 50) milestoneBadge = "50% Halfway";
    else if (progressPercent >= 25) milestoneBadge = "25% Spark";

    return {
      stage: def.stage,
      name: found?.name || def.name,
      shortName: def.shortName,
      description: def.description,
      targetAmount: target,
      currentAmount: current,
      isCompleted,
      isLocked: false, // Calculated in next step
      progressPercent,
      milestoneBadge,
    };
  });

  // Strict Sequential Locking Logic
  // Active stage is the first incomplete stage.
  // Any stage after the active stage is strictly locked.
  let activeStageNumber = 5;
  for (let i = 0; i < stages.length; i++) {
    if (!stages[i].isCompleted) {
      activeStageNumber = stages[i].stage;
      break;
    }
  }

  stages.forEach((stage) => {
    if (stage.stage < activeStageNumber) {
      stage.isLocked = false;
      stage.isCompleted = true;
      stage.progressPercent = 100;
    } else if (stage.stage === activeStageNumber) {
      stage.isLocked = false;
    } else {
      stage.isLocked = true;
    }
  });

  const totalTarget = stages.reduce((acc, s) => acc + s.targetAmount, 0);
  const totalSaved = stages.reduce((acc, s) => acc + Math.min(s.currentAmount, s.targetAmount), 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return {
    stages,
    activeStageNumber,
    totalTarget,
    totalSaved,
    overallProgress,
  };
}
