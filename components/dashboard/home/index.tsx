// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import {
  Package,
  AlertCircle,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Scissors,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ─── FABRIC INVENTORY DATA ──────────────────────────────────────────────────

// Fabric consumption (meters) over last 7 days
const fabricUsageData = [
  { name: "Mon", meters: 45 },
  { name: "Tue", meters: 38 },
  { name: "Wed", meters: 52 },
  { name: "Thu", meters: 30 },
  { name: "Fri", meters: 25 },
  { name: "Sat", meters: 35 },
  { name: "Sun", meters: 42 },
];

// Fabric categories distribution
const categoryData = [
  { name: "Silk", value: 45 },
  { name: "Cotton", value: 30 },
  { name: "Linen", value: 15 },
  { name: "Wool", value: 10 },
];
const COLORS = ["#FBBF24", "#F59E0B", "#D97706", "#B45309"];

// Low stock fabrics (below threshold)
const lowStockFabrics = [
  { id: 1, name: "Blue Silk", color: "Blue", stock: 12, threshold: 20, unit: "meters" },
  { id: 2, name: "Red Cotton", color: "Red", stock: 8, threshold: 15, unit: "meters" },
  { id: 3, name: "White Linen", color: "White", stock: 5, threshold: 10, unit: "meters" },
  { id: 4, name: "Black Wool", color: "Black", stock: 3, threshold: 8, unit: "meters" },
];

// Recent orders (fabric purchases & customer orders)
const recentOrders = [
  {
    id: "#ORD-001",
    customer: "James Anderson",
    date: "2026-06-22",
    total: "$450",
    items: "Blue Silk (15m), White Linen (8m)",
    status: "Delivered",
  },
  {
    id: "#ORD-002",
    customer: "Sarah Mitchell",
    date: "2026-06-22",
    total: "$320",
    items: "Red Cotton (12m), Black Wool (5m)",
    status: "Processing",
  },
  {
    id: "#ORD-003",
    customer: "Robert Chen",
    date: "2026-06-21",
    total: "$670",
    items: "Gold Silk (20m), Cream Linen (10m)",
    status: "Shipped",
  },
  {
    id: "#ORD-004",
    customer: "Emily Davis",
    date: "2026-06-21",
    total: "$210",
    items: "Navy Cotton (8m)",
    status: "Cancelled",
  },
  {
    id: "#ORD-005",
    customer: "Michael Brown",
    date: "2026-06-20",
    total: "$890",
    items: "Royal Silk (25m), Grey Wool (12m)",
    status: "Delivered",
  },
];

// Quick stats
const stats = [
  {
    title: "Total Fabric (meters)",
    value: "8,450",
    change: "+12.5%",
    trend: "up",
    icon: Package,
    color: "text-yellow-400",
  },
  {
    title: "Active Orders",
    value: "23",
    change: "+8.2%",
    trend: "up",
    icon: DollarSign,
    color: "text-amber-400",
  },
  {
    title: "Low Stock Items",
    value: "4",
    change: "-2",
    trend: "down",
    icon: AlertCircle,
    color: "text-red-400",
  },
  {
    title: "Tailoring Jobs",
    value: "18",
    change: "+5.3%",
    trend: "up",
    icon: Scissors,
    color: "text-emerald-400",
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // ── Skeletons ──
  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-yellow-500/10 bg-[#0B0B0B] p-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton circle width={40} height={40} />
            <Skeleton width={60} height={20} />
          </div>
          <Skeleton width={100} height={30} className="mt-2" />
          <Skeleton width={80} height={16} className="mt-1" />
        </div>
      ))}
    </div>
  );

  const ChartSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-yellow-500/10 bg-[#0B0B0B] p-4">
        <Skeleton width={120} height={20} className="mb-4" />
        <Skeleton height={200} />
      </div>
      <div className="rounded-xl border border-yellow-500/10 bg-[#0B0B0B] p-4">
        <Skeleton width={120} height={20} className="mb-4" />
        <Skeleton height={200} />
      </div>
    </div>
  );

  const TableSkeleton = () => (
    <div className="rounded-xl border border-yellow-500/10 bg-[#0B0B0B] p-4">
      <Skeleton width={150} height={20} className="mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton width={80} height={16} />
            <Skeleton width={120} height={16} />
            <Skeleton width={90} height={16} />
            <Skeleton width={60} height={16} />
            <Skeleton width={70} height={16} className="ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <StatsSkeleton />
        <ChartSkeleton />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TableSkeleton />
          <TableSkeleton />
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Delivered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      Processing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Shipped: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
          styles[status] || "bg-white/5 text-white/70 border-white/10"
        }`}
      >
        {status === "Delivered" && <CheckCircle className="h-3 w-3" />}
        {status === "Processing" && <Clock className="h-3 w-3" />}
        {status === "Shipped" && <Clock className="h-3 w-3" />}
        {status === "Cancelled" && <XCircle className="h-3 w-3" />}
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-yellow-500/10 bg-[#0B0B0B] p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-medium ${
                  stat.trend === "up" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fabric Usage (meters) */}
        <div className="rounded-xl border border-yellow-500/10 bg-[#0B0B0B] p-4">
          <h3 className="mb-4 text-sm font-medium text-slate-300">
            Fabric Usage (meters)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fabricUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B0B0B",
                    borderColor: "#FBBF24",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="meters" fill="#FBBF24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fabric Categories */}
        <div className="rounded-xl border border-yellow-500/10 bg-[#0B0B0B] p-4">
          <h3 className="mb-4 text-sm font-medium text-slate-300">
            Fabric Categories
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B0B0B",
                    borderColor: "#FBBF24",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-slate-300 text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock & Recent Orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <div className="rounded-xl border border-yellow-500/10 bg-[#0B0B0B] p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-300">
            <AlertCircle className="h-4 w-4 text-red-400" />
            Low Stock Alert
          </h3>
          {lowStockFabrics.length === 0 ? (
            <p className="text-sm text-slate-500">All fabrics are well stocked.</p>
          ) : (
            <div className="space-y-3">
              {lowStockFabrics.map((fabric) => (
                <div
                  key={fabric.id}
                  className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0"
                >
                  <div>
                    <span className="text-sm text-white">{fabric.name}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      ({fabric.color})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      Stock: <span className="text-red-400">{fabric.stock}</span> /{" "}
                      {fabric.threshold} {fabric.unit}
                    </span>
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                      Reorder
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-xl border border-yellow-500/10 bg-[#0B0B0B] p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Clock className="h-4 w-4 text-amber-400" />
            Recent Orders
          </h3>
          <div className="space-y-3">
            {recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex flex-col border-b border-white/5 pb-2 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{order.id}</p>
                    <p className="text-xs text-slate-400">{order.customer}</p>
                    <p className="text-xs text-slate-500">{order.items}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-white">
                      {order.total}
                    </span>
                    {statusBadge(order.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}