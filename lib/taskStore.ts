// Shared in-memory store — no Provider needed.
// Import { useTasks } in any page/component.

"use client";

import { useState, useEffect } from "react";

export type Priority = "High" | "Medium" | "Low";
export type Status   = "Pending" | "In Progress" | "Completed";
export type Category = "Work" | "Dev" | "Design" | "Sales" | "Finance" | "Personal" | "Other";

export interface Task {
  id:       string;
  title:    string;
  priority: Priority;
  status:   Status;
  due:      string;
  time:     string;
  category: Category;
  notes?:   string;
}

export type TaskFormData = Omit<Task, "id">;

// ── module-level state (survives re-renders, shared across imports) ──────────
let _tasks: Task[] = [
  { id: '1', title: "Prepare monthly report",    priority: "High",   status: "In Progress", due: "2025-05-23", time: "16:00", category: "Work"    },
  { id: '2', title: "Team meeting",              priority: "Medium", status: "Pending",     due: "2025-05-24", time: "10:00", category: "Work"    },
  { id: '3', title: "Update dashboard UI",       priority: "Low",    status: "Completed",   due: "2025-05-29", time: "",      category: "Design"  },
  { id: '4', title: "Client follow-up",          priority: "High",   status: "Pending",     due: "2025-05-23", time: "18:00", category: "Sales"   },
  { id: '5', title: "Code review — auth module", priority: "Medium", status: "In Progress", due: "2025-05-24", time: "14:00", category: "Dev"     },
  { id: '6', title: "Write release notes",       priority: "Low",    status: "Pending",     due: "2025-05-27", time: "",      category: "Dev"     },
  { id: '7', title: "Q2 budget planning",        priority: "High",   status: "Pending",     due: "2025-05-26", time: "09:00", category: "Finance" },
  { id: '8', title: "Design system audit",       priority: "Medium", status: "Pending",     due: "2025-05-28", time: "11:00", category: "Design"  },
];
let _nextId = _tasks.length + 1;
const _listeners = new Set<() => void>();

function notify() { _listeners.forEach(fn => fn()); }

export const taskStore = {
  getAll:  ()              => _tasks,
  getById: (id: string)   => _tasks.find(t => t.id === id) ?? null,
  add(data: TaskFormData): Task {
    const task = { ...data, id: String(_nextId++) };
    _tasks = [..._tasks, task];
    notify();
    return task;
  },
  update(id: string, data: TaskFormData): void {
    _tasks = _tasks.map(t => t.id === id ? { ...t, ...data } : t);
    notify();
  },
  delete(id: string): void {
    _tasks = _tasks.filter(t => t.id !== id);
    notify();
  },
  toggleDone(id: string): void {
    _tasks = _tasks.map(t =>
      t.id === id ? { ...t, status: t.status === "Completed" ? "Pending" : "Completed" } : t
    );
    notify();
  },
};

/** Drop-in hook — subscribes to store changes, no Provider needed. */
export function useTasks() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const trigger = () => rerender(n => n + 1);
    _listeners.add(trigger);
    return () => { _listeners.delete(trigger); };
  }, []);

  return taskStore;
}

// ── shared constants & helpers ───────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  "Work", "Dev", "Design", "Sales", "Finance", "Personal", "Other",
];

export const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

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
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T12:00:00"); d.setHours(0, 0, 0, 0);
  const diff = (d.getTime() - today.getTime()) / 86_400_000;
  if (diff === 0)  return "Today";
  if (diff === 1)  return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isUrgent(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T12:00:00"); d.setHours(0, 0, 0, 0);
  return (d.getTime() - today.getTime()) / 86_400_000 <= 0;
}