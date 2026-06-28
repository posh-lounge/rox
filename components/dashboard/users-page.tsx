"use client";
import React, { useState } from "react";
import { Shield, ChevronDown, Loader2, X, User, Mail, Phone, Check } from "lucide-react";
import { useUsers, useRoles } from "@/lib/api/v1/hooks";
import { apiPost } from "@/lib/api/v1/fetchApi";
import { useQueryClient } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ROLE_COLORS: Record<number, string> = {
  1: "bg-red-500/15 text-red-400 border-red-500/20",
  2: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  3: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  4: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  5: "bg-white/10 text-white/50 border-white/10",
};

function ChangeRoleModal({
  user, roles, onClose,
}: {
  user: { userId: string; firstname: string; lastname: string; role_id: number };
  roles: Array<{ role_id: number; role_name: string; description: string }>;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [roleId, setRoleId] = useState(user.role_id);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiPost("/api/main/dashboard/update/update-user-role", { target_user_id: user.userId, role_id: roleId });
      qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold">Change Role</h2>
            <p className="text-xs text-white/40 mt-0.5">{user.firstname} {user.lastname}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-3">
          {roles.map(r => (
            <button key={r.role_id} onClick={() => setRoleId(r.role_id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition text-left ${
                roleId === r.role_id
                  ? "bg-indigo-500/15 border-indigo-500/40"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}>
              <div>
                <p className={`text-sm font-medium ${roleId === r.role_id ? "text-indigo-300" : "text-white"}`}>{r.role_name}</p>
                <p className="text-xs text-white/40 mt-0.5">{r.description}</p>
              </div>
              {roleId === r.role_id && <Check size={16} className="text-indigo-400 shrink-0" />}
            </button>
          ))}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handleSave} disabled={loading || roleId === user.role_id}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40">
            {loading && <Loader2 size={14} className="animate-spin" />} Save Role
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: rolesData } = useRoles();
  const [selected, setSelected] = useState<any>(null);

  const users = usersData?.users ?? [];
  const roles = rolesData?.roles ?? [];

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage user accounts and roles</p>
        </div>

        {/* Role legend */}
        <div className="flex gap-2 flex-wrap mb-6">
          {roles.map(r => (
            <span key={r.role_id} className={`text-xs px-3 py-1 rounded-full border ${ROLE_COLORS[r.role_id] ?? "bg-white/10 text-white/40 border-white/10"}`}>
              {r.role_name}
            </span>
          ))}
        </div>

        {/* Users table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["User","Email","Phone","Role","Status","Joined",""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersLoading
                ? Array(4).fill(0).map((_,i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array(7).fill(0).map((_,j) => <td key={j} className="px-5 py-4"><Skeleton height={16} baseColor="#1f2937" highlightColor="#374151" /></td>)}
                    </tr>
                  ))
                : users.length === 0
                ? <tr><td colSpan={7} className="px-5 py-12 text-center text-white/30 text-sm">No users found</td></tr>
                : users.map(u => (
                    <tr key={u.userId} className="border-b border-white/5 hover:bg-white/3 transition group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-indigo-300">{u.firstname[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{u.firstname} {u.lastname}</p>
                            <p className="text-xs text-white/30 font-mono">{u.userId.slice(0, 14)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-sm text-white/60">
                          <Mail size={12} className="text-white/30" />{u.email}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-sm text-white/60">
                          <Phone size={12} className="text-white/30" />{u.phonenumber}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${ROLE_COLORS[u.role_id] ?? "bg-white/10 text-white/40 border-white/10"}`}>
                          {u.role_name ?? `Role #${u.role_id}`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "online" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-white/40"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-white/30">
                        {new Date(u.dates ?? "").toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setSelected(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 hover:text-white transition opacity-0 group-hover:opacity-100">
                          <Shield size={12} /> Change Role
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Permissions reference */}
        <div className="mt-8">
          <h2 className="text-sm font-medium text-white mb-3">Role Permissions Reference</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-2.5 text-left text-white/40 font-medium">Module</th>
                  {roles.map(r => <th key={r.role_id} className="px-4 py-2.5 text-center text-white/40 font-medium">{r.role_name}</th>)}
                </tr>
              </thead>
              <tbody>
                {["products","sales","purchases","spaces","users","reports","stock"].map(module => (
                  <tr key={module} className="border-b border-white/5">
                    <td className="px-4 py-2 text-white/60 capitalize font-medium">{module}</td>
                    {roles.map(r => {
                      // Admin=1 has full, Manager=2 no delete, Cashier=3 sales only, Stock=4 no spaces, Viewer=5 read only
                      const access: Record<number, Record<string, string>> = {
                        1: { products:"Full", sales:"Full", purchases:"Full", spaces:"Full", users:"Full", reports:"Full", stock:"Full" },
                        2: { products:"C·R·E", sales:"C·R·E", purchases:"C·R·E", spaces:"C·R·E", users:"View", reports:"View", stock:"C·R·E" },
                        3: { products:"View", sales:"C·R", purchases:"—", spaces:"View", users:"—", reports:"—", stock:"—" },
                        4: { products:"C·R·E", sales:"View", purchases:"C·R·E", spaces:"—", users:"—", reports:"View", stock:"C·R·E" },
                        5: { products:"View", sales:"View", purchases:"View", spaces:"View", users:"—", reports:"View", stock:"View" },
                      };
                      const val = access[r.role_id]?.[module] ?? "—";
                      return (
                        <td key={r.role_id} className="px-4 py-2 text-center">
                          <span className={val === "Full" ? "text-emerald-400 font-medium" : val === "—" ? "text-white/20" : "text-indigo-300"}>
                            {val}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <ChangeRoleModal user={selected} roles={roles} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
