import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

// ── Static/seed data ────────────────────────────────────────────────────────

const CATEGORY_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

const categoryData = [
  { name: "Beverages", value: 45, amount: 34642, color: "#3b82f6" },
  { name: "Snacks",    value: 26, amount: 13685, color: "#f59e0b" },
  { name: "Dairy",     value: 15, amount: 8214,  color: "#10b981" },
  { name: "Household", value: 10, amount: 6478,  color: "#8b5cf6" },
  { name: "Others",    value: 5,  amount: 2740,  color: "#ef4444" },
];

const initialRepSales = [
  { name: "John Banda",      sales: 9850 },
  { name: "Mary Mutale",     sales: 8430 },
  { name: "Peter Chilufya",  sales: 7120 },
  { name: "Grace Phiri",     sales: 6780 },
  { name: "James Mulenga",   sales: 5890 },
  { name: "Others",          sales: 17800 },
];

const forecastData = [
  { day: "Tue", val: 55000 },
  { day: "Wed", val: 62000 },
  { day: "Thu", val: 58000 },
  { day: "Fri", val: 70000 },
  { day: "Sat", val: 80000 },
  { day: "Sun", val: 72000 },
  { day: "Mon", val: 85000 },
];

const buildLiveData = () =>
  Array.from({ length: 30 }, (_, i) => ({
    t: `${String(6 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
    v: Math.floor(2000 + Math.random() * 8000),
  }));

const attendanceInitial = [
  { rep: "John Banda",     clockIn: "07:58 AM", clockOut: "05:32 PM", status: "On Time" },
  { rep: "Mary Mutale",    clockIn: "08:12 AM", clockOut: "05:45 PM", status: "On Time" },
  { rep: "Peter Chilufya", clockIn: "08:25 AM", clockOut: "—",        status: "On Duty" },
  { rep: "Grace Phiri",    clockIn: "07:45 AM", clockOut: "05:20 PM", status: "On Time" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const zmw = (n: number) =>
  `ZMW ${n.toLocaleString("en-ZM", { minimumFractionDigits: 2 })}`;

const zmwShort = (n: number) => `ZMW ${n.toLocaleString("en-ZM")}`;

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  change,
  changeLabel,
  positive,
  valueColor,
}: {
  label: string;
  value: string;
  change: string;
  changeLabel: string;
  positive: boolean;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold mb-1" style={{ color: valueColor ?? "#0f172a" }}>
        {value}
      </p>
      <div className={`flex items-center gap-1 text-xs ${positive ? "text-emerald-600" : "text-red-500"}`}>
        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span className="font-medium">{change}</span>
        <span className="text-slate-400">{changeLabel}</span>
      </div>
    </div>
  );
}

function ActiveRepsCard({ active, total }: { active: number; total: number }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">Active Reps</p>
      <p className="text-xl font-bold text-slate-900 mb-1">
        {active} <span className="text-slate-300 font-normal">/ {total}</span>
      </p>
      <p className="text-xs text-slate-400">On Duty</p>
    </div>
  );
}

// Custom donut label
const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.07) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [totalSales, setTotalSales]       = useState(54760);
  const [salesHour, setSalesHour]         = useState(6250);
  const [orders, setOrders]               = useState(256);
  const [customers, setCustomers]         = useState(128);
  const [activeReps]                      = useState(18);
  const [liveData, setLiveData]           = useState(buildLiveData);
  const [repSales]                        = useState(initialRepSales);
  const [onTime]                          = useState(14);
  const [late]                            = useState(3);
  const [absent]                          = useState(2);

  // Tick live values every 5 s
  useEffect(() => {
    const id = setInterval(() => {
      const delta = Math.floor(Math.random() * 800 + 200);
      setTotalSales(p => p + delta);
      setSalesHour(Math.floor(Math.random() * 3000 + 4000));
      setOrders(p => p + (Math.random() > 0.5 ? 1 : 0));
      setCustomers(p => p + (Math.random() > 0.7 ? 1 : 0));
      setLiveData(prev => {
        const next = [...prev.slice(1), { t: "now", v: Math.floor(2000 + Math.random() * 8000) }];
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const topThree = repSales.filter(r => r.name !== "Others").slice(0, 3);

  return (
    <div className="space-y-4">

      {/* ── Row 1: KPI cards ── */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard
          label="Total Sales Today"
          value={zmw(totalSales)}
          change="+12.5%"
          changeLabel="vs yesterday"
          positive
          valueColor="#10b981"
        />
        <StatCard
          label="Sales This Hour"
          value={zmw(salesHour)}
          change="+8.3%"
          changeLabel="vs last hour"
          positive
          valueColor="#3b82f6"
        />
        <StatCard
          label="Total Orders"
          value={orders.toString()}
          change="+15.2%"
          changeLabel="vs yesterday"
          positive
          valueColor="#0f172a"
        />
        <StatCard
          label="Customers Visited"
          value={customers.toString()}
          change="+10.7%"
          changeLabel="vs yesterday"
          positive
          valueColor="#f59e0b"
        />
        <ActiveRepsCard active={activeReps} total={22} />
      </div>

      {/* ── Row 2: Live chart | Category donut | Sales by rep ── */}
      <div className="grid grid-cols-12 gap-3">

        {/* Live sales area chart */}
        <div className="col-span-5 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-700 mb-3">Live Sales (Today)</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={liveData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={4} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(v: number) => [`ZMW ${v.toLocaleString()}`, "Sales"]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2}
                fill="url(#liveGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category donut */}
        <div className="col-span-3 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-700 mb-1">Sales by Category (Today)</p>
          <div className="flex items-center gap-2">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%" cy="50%"
                  innerRadius={28} outerRadius={50}
                  dataKey="value"
                  labelLine={false}
                  label={CustomLabel}
                >
                  {categoryData.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, _: any, props: any) =>
                    [`ZMW ${props.payload.amount.toLocaleString()}`, props.payload.name]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1 text-xs">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-slate-600">{c.name}</span>
                  <span className="text-slate-400 ml-auto pl-2">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1 space-y-0.5">
            {categoryData.map((c) => (
              <p key={c.name} className="text-xs text-slate-500 flex justify-between">
                <span style={{ color: c.color }} className="font-medium">{c.name}</span>
                <span>ZMW {c.amount.toLocaleString()}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Sales by Rep bar chart */}
        <div className="col-span-4 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-700 mb-3">Sales by Rep (Today)</p>
          <div className="space-y-2">
            {repSales.map((r) => {
              const max = repSales[repSales.length - 1].sales; // "Others" largest total
              const pct = Math.round((r.sales / 20000) * 100);
              return (
                <div key={r.name} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-28 truncate">{r.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${pct}%`, background: "#3b82f6" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-700 w-20 text-right">
                    ZMW {r.sales.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Attendance | Recent attendance | Top reps | Forecast ── */}
      <div className="grid grid-cols-12 gap-3">

        {/* Attendance summary */}
        <div className="col-span-2 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-700 mb-3">Attendance (Today)</p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-xs text-slate-600 flex-1">On Time</span>
              <span className="text-xs font-semibold text-slate-800">{onTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="text-xs text-slate-600 flex-1">Late</span>
              <span className="text-xs font-semibold text-slate-800">{late}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
              <span className="text-xs text-slate-600 flex-1">Absent</span>
              <span className="text-xs font-semibold text-slate-800">{absent}</span>
            </div>
            <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 flex-shrink-0" />
              <span className="text-xs text-slate-600 flex-1">Total Reps</span>
              <span className="text-xs font-bold text-slate-800">22</span>
            </div>
          </div>
        </div>

        {/* Recent Attendance table */}
        <div className="col-span-4 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-700 mb-3">Recent Attendance</p>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-1.5 text-left font-medium">Rep Name</th>
                <th className="pb-1.5 text-left font-medium">Clock In</th>
                <th className="pb-1.5 text-left font-medium">Clock Out</th>
                <th className="pb-1.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceInitial.map((row) => (
                <tr key={row.rep} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 text-xs text-slate-700">{row.rep}</td>
                  <td className="py-1.5 text-xs text-slate-500">{row.clockIn}</td>
                  <td className="py-1.5 text-xs text-slate-500">{row.clockOut}</td>
                  <td className="py-1.5">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: row.status === "On Time" ? "#10b981"
                             : row.status === "On Duty" ? "#3b82f6"
                             : "#f59e0b",
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Performing Reps */}
        <div className="col-span-3 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-700 mb-3">Top Performing Reps (Today)</p>
          <div className="space-y-3">
            {topThree.map((rep, i) => (
              <div key={rep.name} className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{
                    background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#cd7f32",
                  }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{rep.name}</p>
                  <p className="text-xs text-slate-400">{zmwShort(rep.sales)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Forecast */}
        <div className="col-span-3 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-700">Sales Forecast</p>
          <p className="text-xs text-slate-400 mb-1">Next 7 Days Forecast</p>
          <p className="text-lg font-bold text-slate-900">ZMW 415,000.00</p>
          <p className="text-xs text-slate-400 mb-2">Expected Sales</p>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={forecastData} barSize={10} margin={{ left: -10, right: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [`ZMW ${v.toLocaleString()}`, "Forecast"]}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Bar dataKey="val" radius={[3, 3, 0, 0]}>
                {forecastData.map((_, i) => (
                  <Cell key={i} fill={i === 6 ? "#3b82f6" : "#bfdbfe"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
