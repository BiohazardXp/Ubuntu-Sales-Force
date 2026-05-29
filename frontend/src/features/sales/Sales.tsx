import { useEffect, useState, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { TrendingUp, TrendingDown, Zap, Users, ShoppingCart, MapPin } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LiveTransaction {
  id: number;
  rep: string;
  customer: string;
  product: string;
  amount: number;
  area: string;
  time: string;
}

interface HourlyBucket {
  hour: string;
  sales: number;
  orders: number;
}

// ── Seed helpers ──────────────────────────────────────────────────────────────
const REPS      = ["John Banda","Mary Mutale","Peter Chilufya","Grace Phiri","Agnes Zimba","Samuel Phiri"];
const CUSTOMERS = ["Kaputo Mini Mart","Zombe General","Mutale Superette","Bauleni Trading","Northmead Grocers","Chelston Supermarket","Kafue Road Depot"];
const PRODUCTS  = ["Coca-Cola 2L","Shake Shake","Lacto","Surf Washing Powder","Nik Naks","Fanta 1.5L","Dairibord Milk","Colgate 120ml"];
const AREAS     = ["Lusaka CBD","Chilenje","Kabulonga","Woodlands","Chelston","Bauleni","Northmead","Emmasdale"];

let txCounter = 100;
const randBetween = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const buildHourly = (): HourlyBucket[] =>
  Array.from({ length: 14 }, (_, i) => {
    const h = 6 + i;
    const label = `${String(h).padStart(2,"0")}:00`;
    const isPast = h < 14;
    return {
      hour:   label,
      sales:  isPast ? randBetween(2000, 12000) : 0,
      orders: isPast ? randBetween(5, 25) : 0,
    };
  });

const buildFeed = (): LiveTransaction[] =>
  Array.from({ length: 8 }, (_, i) => ({
    id:       i,
    rep:      pick(REPS),
    customer: pick(CUSTOMERS),
    product:  pick(PRODUCTS),
    amount:   randBetween(200, 3500),
    area:     pick(AREAS),
    time:     `${String(randBetween(7, 13)).padStart(2,"0")}:${String(randBetween(0,59)).padStart(2,"0")} AM`,
  }));

// ── Sub-components ────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, positive, color }: {
  label: string; value: string; sub: string; positive: boolean; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold mb-1" style={{ color }}>{value}</p>
      <div className={`flex items-center gap-1 text-xs ${positive ? "text-emerald-600" : "text-red-500"}`}>
        {positive ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
        <span>{sub}</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Sales() {
  const [hourly,    setHourly]    = useState<HourlyBucket[]>(buildHourly);
  const [feed,      setFeed]      = useState<LiveTransaction[]>(buildFeed);
  const [totalSales,setTotal]     = useState(54760);
  const [orders,    setOrders]    = useState(256);
  const [activeReps]              = useState(18);
  const [pulse,     setPulse]     = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Tick every 4 s — add a new live transaction and update KPIs
  useEffect(() => {
    const id = setInterval(() => {
      const amount = randBetween(300, 4000);
      const newTx: LiveTransaction = {
        id:       ++txCounter,
        rep:      pick(REPS),
        customer: pick(CUSTOMERS),
        product:  pick(PRODUCTS),
        amount,
        area:     pick(AREAS),
        time:     new Date().toLocaleTimeString("en-ZM", { hour:"2-digit", minute:"2-digit" }),
      };

      setFeed(prev => [newTx, ...prev].slice(0, 20));
      setTotal(p => p + amount);
      setOrders(p => p + 1);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);

      // bump current hour bucket
      setHourly(prev => {
        const now = new Date();
        const label = `${String(now.getHours()).padStart(2,"0")}:00`;
        return prev.map(b =>
          b.hour === label
            ? { ...b, sales: b.sales + amount, orders: b.orders + 1 }
            : b
        );
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const topReps = REPS.map(name => ({
    name,
    sales: randBetween(3000, 10000),
  })).sort((a, b) => b.sales - a.sales);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Live indicator ── */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-emerald-600">Live</span>
        <span className="text-xs text-slate-400">— updates every few seconds</span>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Sales Today"  value={`ZMW ${totalSales.toLocaleString()}`}  sub="+12.5% vs yesterday" positive color="#10b981" />
        <KpiCard label="Total Orders"       value={orders.toString()}                      sub="+15.2% vs yesterday" positive color="#3b82f6" />
        <KpiCard label="Active Reps"        value={`${activeReps} / 22`}                  sub="18 currently on duty" positive color="#f59e0b" />
        <KpiCard label="Avg Order Value"    value={`ZMW ${Math.round(totalSales/orders).toLocaleString()}`} sub="vs ZMW 198 yesterday" positive color="#8b5cf6" />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-12 gap-3">

        {/* Hourly sales area chart */}
        <div className="col-span-7 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-700">Hourly Sales Breakdown</p>
            <span className="text-xs text-slate-400">Today 06:00 — 20:00</span>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={hourly} margin={{ top:4, right:4, left:-10, bottom:0 }}>
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize:9, fill:"#94a3b8" }} tickLine={false} axisLine={false} interval={1} />
              <YAxis tick={{ fontSize:9, fill:"#94a3b8" }} tickLine={false} axisLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v:number) => [`ZMW ${v.toLocaleString()}`, "Sales"]}
                contentStyle={{ fontSize:11, borderRadius:8, border:"1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2}
                fill="url(#hg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top reps bar chart */}
        <div className="col-span-5 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">Top Reps Today</p>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={topReps} layout="vertical" margin={{ top:0, right:40, left:4, bottom:0 }} barSize={10}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90}
                tick={{ fontSize:10, fill:"#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v:number) => [`ZMW ${v.toLocaleString()}`, "Sales"]}
                contentStyle={{ fontSize:11, borderRadius:8 }} />
              <Bar dataKey="sales" radius={[0,4,4,0]}>
                {topReps.map((_, i) => (
                  <Cell key={i} fill={i===0 ? "#3b82f6" : i===1 ? "#60a5fa" : "#bfdbfe"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Live feed ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Zap size={13} style={{ color: pulse ? "#f59e0b" : "#94a3b8" }}
            className="transition-colors duration-300" />
          <p className="text-xs font-semibold text-slate-700">Live Transaction Feed</p>
          <span className="ml-auto text-xs text-slate-400">{feed.length} transactions today</span>
        </div>

        <div ref={feedRef} className="divide-y divide-slate-50 overflow-y-auto" style={{ maxHeight: 280 }}>
          {feed.map((tx, i) => (
            <div key={tx.id}
              className="flex items-center gap-4 px-5 py-3 transition-all"
              style={{
                background: i === 0 && pulse ? "#eff6ff" : "white",
                opacity: 1,
              }}>

              {/* Rep avatar */}
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4"][REPS.indexOf(tx.rep) % 6] }}>
                {tx.rep.split(" ").map(n => n[0]).join("")}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">
                  {tx.rep} <span className="font-normal text-slate-500">sold</span> {tx.product}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    <ShoppingCart size={9} className="text-slate-400" />
                    <span className="text-xs text-slate-400">{tx.customer}</span>
                  </div>
                  <span className="text-slate-200">•</span>
                  <div className="flex items-center gap-0.5">
                    <MapPin size={9} className="text-slate-400" />
                    <span className="text-xs text-slate-400">{tx.area}</span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-emerald-600">ZMW {tx.amount.toLocaleString()}</p>
                <p className="text-xs text-slate-400">{tx.time}</p>
              </div>

              {/* New badge */}
              {i === 0 && pulse && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background:"#dbeafe", color:"#1d4ed8" }}>NEW</span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
