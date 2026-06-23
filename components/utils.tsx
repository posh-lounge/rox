import { Priority, Status } from "@/types/task";

export const CATEGORIES = [
  "Work", "Dev", "Design", "Sales", "Finance", "Personal", "Other",
] as const;

export const PRIORITY_ORDER: Record<Priority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

export const PRIORITY_STYLES: Record<Priority, { bg: string; text: string }> = {
  High:   { bg: "bg-[#2d1f3d]", text: "text-[#c084fc]" },
  Medium: { bg: "bg-[#1f2d2a]", text: "text-[#34d399]" },
  Low:    { bg: "bg-[#1f2a35]", text: "text-[#60a5fa]" },
};

export const STATUS_STYLES: Record<Status, { bg: string; text: string; dot: string }> = {
  Completed:     { bg: "bg-[#1a2520]", text: "text-[#4ade80]", dot: "#4ade80" },
  "In Progress": { bg: "bg-[#2a1f3d]", text: "text-[#a78bfa]", dot: "#a78bfa" },
  Pending:       { bg: "bg-[#2d2a1a]", text: "text-[#fbbf24]", dot: "#fbbf24" },
};

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T12:00:00");
  d.setHours(0, 0, 0, 0);
  const diff = (d.getTime() - today.getTime()) / 86_400_000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isUrgent(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T12:00:00");
  d.setHours(0, 0, 0, 0);
  return (d.getTime() - today.getTime()) / 86_400_000 <= 0;
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}