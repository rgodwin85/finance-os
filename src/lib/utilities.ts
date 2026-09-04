export interface UtilityBufferCalculation {
  trailingAverage: number;
  peakExpense: number;
  recommendedBuffer: number;
  currentBufferBalance: number;
  bufferHealthPercent: number;
  monthlySavingsTarget: number;
}

/**
 * Calculates trailing average and buffer recommendation for variable utility bills
 * (electric, gas, water) to absorb seasonal spikes.
 */
export function calculateUtilityBuffer(
  pastMonthlyExpenses: number[],
  currentBufferBalance: number = 0
): UtilityBufferCalculation {
  if (!pastMonthlyExpenses || pastMonthlyExpenses.length === 0) {
    return {
      trailingAverage: 250,
      peakExpense: 350,
      recommendedBuffer: 300,
      currentBufferBalance,
      bufferHealthPercent: Math.min(100, Math.round((currentBufferBalance / 300) * 100)),
      monthlySavingsTarget: 50,
    };
  }

  const sum = pastMonthlyExpenses.reduce((acc, val) => acc + val, 0);
  const trailingAverage = Math.round(sum / pastMonthlyExpenses.length);
  const peakExpense = Math.max(...pastMonthlyExpenses);

  // Buffer covers the difference between peak month and average over a 3-month seasonal cycle
  // or at minimum 1.3x average monthly utility
  const seasonalDelta = Math.max(0, peakExpense - trailingAverage);
  const recommendedBuffer = Math.max(Math.round(trailingAverage * 0.5), seasonalDelta * 3);

  const bufferHealthPercent = recommendedBuffer > 0
    ? Math.min(100, Math.round((currentBufferBalance / recommendedBuffer) * 100))
    : 100;

  // Amount to contribute monthly to build or maintain the buffer
  const deficit = Math.max(0, recommendedBuffer - currentBufferBalance);
  const monthlySavingsTarget = Math.round(deficit / 6); // Amortized over 6 months

  return {
    trailingAverage,
    peakExpense,
    recommendedBuffer,
    currentBufferBalance,
    bufferHealthPercent,
    monthlySavingsTarget,
  };
}
