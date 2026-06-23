"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Task, TaskFormData, Priority, Status, Category } from "@/types/task";
import { CATEGORIES } from "@/components/utils";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";

const EMPTY: TaskFormData = {
  title:    "",
  priority: "Medium",
  status:   "Pending",
  due:      "",
  time:     "",
  category: "Work",
  notes:    "",
};

interface TaskModalProps {
  open:     boolean;
  onClose:  () => void;
  onSave:   (data: TaskFormData) => void;
  initial?: Partial<TaskFormData> | null;
}

export default function TaskModal({ open, onClose, onSave, initial = null }: TaskModalProps) {
  const [form, setForm] = useState<TaskFormData>(EMPTY);

  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [open, initial]);

  if (!open) return null;

  const set = <K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  return (
 <Modal isOpen={open} showCloseButton={false} onClose={() => (false)}  className=" max-w-md" >
      <div className="">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e2440]">
          <h2 className="text-white text-[16px] font-semibold">
            {initial?.title ? "Edit task" : "New task"}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-[12px] text-slate-400 mb-1.5 uppercase tracking-wide">
              Title *
            </label>
            <input
              autoFocus
              className="w-full bg-[#0f1320] border border-[#252d45] text-slate-100 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-slate-400 mb-1.5 uppercase tracking-wide">
                Priority
              </label>
              <select
                className="w-full bg-[#0f1320] border border-[#252d45] text-slate-100 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-indigo-500 transition-colors"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as Priority)}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-slate-400 mb-1.5 uppercase tracking-wide">
                Status
              </label>
              <select
                className="w-full bg-[#0f1320] border border-[#252d45] text-slate-100 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-indigo-500 transition-colors"
                value={form.status}
                onChange={(e) => set("status", e.target.value as Status)}
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          {/* Due date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-slate-400 mb-1.5 uppercase tracking-wide">
                Due date
              </label>
              <input
                type="date"
                className="w-full bg-[#0f1320] border border-[#252d45] text-slate-100 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-indigo-500 transition-colors"
                value={form.due}
                onChange={(e) => set("due", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[12px] text-slate-400 mb-1.5 uppercase tracking-wide">
                Time
              </label>
              <input
                type="time"
                className="w-full bg-[#0f1320] border border-[#252d45] text-slate-100 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-indigo-500 transition-colors"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
              />
            </div>
          </div>

          {/* Category chips */}
          <div>
            <label className="block text-[12px] text-slate-400 mb-1.5 uppercase tracking-wide">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("category", c as Category)}
                  className={`px-3 py-1 rounded-lg text-[12px] font-medium border transition-all
                    ${form.category === c
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                      : "bg-[#0f1320] border-[#252d45] text-slate-400 hover:border-slate-500"
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] text-slate-400 mb-1.5 uppercase tracking-wide">
              Notes
            </label>
            <textarea
              className="w-full bg-[#0f1320] border border-[#252d45] text-slate-100 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-indigo-500 placeholder-slate-600 resize-none transition-colors"
              placeholder="Additional details..."
              rows={2}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#1e2440] flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-[#252d45] text-slate-400 text-[13px] hover:bg-[#1a1f33] hover:text-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium transition-all"
          >
            {initial?.title ? "Save changes" : "Create task"}
          </button>
        </div>
      </div>
  
    </Modal>
  );
}