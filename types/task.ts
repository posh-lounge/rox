export type Priority = "High" | "Medium" | "Low";
export type Status = "Pending" | "In Progress" | "Completed";
export type Category = "Work" | "Dev" | "Design" | "Sales" | "Finance" | "Personal" | "Other";

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  due: string;       // "YYYY-MM-DD"
  time: string;      // "HH:MM" or ""
  category: Category;
  notes?: string;
}

export type TaskFormData = Omit<Task, "id">;