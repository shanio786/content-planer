export type KillFlag = "working" | "grace" | "review" | "kill";

export function computeProjectFlag(
  createdAt: string | Date,
  revenue: number,
  traffic: number,
  killWarnDays: number,
  killDeadDays: number,
): { flag: KillFlag; ageDays: number } {
  const created = new Date(createdAt).getTime();
  const ageDays = Math.floor((Date.now() - created) / (24 * 60 * 60 * 1000));
  const hasTraction = revenue > 0 || traffic > 100;
  let flag: KillFlag = "grace";
  if (hasTraction) flag = "working";
  else if (ageDays >= killDeadDays) flag = "kill";
  else if (ageDays >= killWarnDays) flag = "review";
  return { flag, ageDays };
}

export const flagBadgeClass: Record<KillFlag, string> = {
  working: "bg-green-500/10 text-green-400 border-green-500/20",
  grace: "bg-muted text-muted-foreground border-border",
  review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  kill: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const flagBadgeLabel: Record<KillFlag, string> = {
  working: "working",
  grace: "young",
  review: "review",
  kill: "kill",
};
