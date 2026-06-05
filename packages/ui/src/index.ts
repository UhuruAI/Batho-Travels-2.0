export type ButtonTone = "primary" | "secondary" | "ghost" | "destructive";
export type StageStatus = "funded" | "active" | "queued";

export type ButtonRecipe = {
  tone: ButtonTone;
  label: string;
  ariaLabel: string;
  disabled?: boolean;
  loading?: boolean;
};

export type FundingStageProgressItem = {
  key: "flights" | "stay" | "experiences";
  label: string;
  targetCents: number;
  fundedCents: number;
  status: StageStatus;
  expectedCompletionMonth?: number;
};

export function createButtonRecipe(recipe: ButtonRecipe): ButtonRecipe {
  return recipe;
}

export function getFundingStageStatus(
  fundedCents: number,
  targetCents: number,
  isActive: boolean
): StageStatus {
  if (targetCents > 0 && fundedCents >= targetCents) {
    return "funded";
  }

  return isActive ? "active" : "queued";
}

export function formatProgressPercent(fundedCents: number, targetCents: number): string {
  if (targetCents <= 0) {
    return "0%";
  }

  const percent = Math.min(100, Math.round((fundedCents / targetCents) * 100));
  return `${percent}%`;
}

