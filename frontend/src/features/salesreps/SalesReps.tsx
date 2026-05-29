import { useState } from "react";
import {
  Search, MapPin, TrendingUp, Phone, ChevronRight,
  Award, Target, Clock, Users
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface Rep {
  id: number; name: string; avatar: string; territory: string;
  status: "On Duty" | "Off Duty" | "Late" | "Absent"; phone: string;
  salesToday: number; salesTarget: number; customersVisited: number;
  customersTarget: number; conversions: number; efficiency: number;
  consistency: number; trend: number[]; lastSeen: string; checkIn: string;
}

const REPS: Rep[] = [
  { id:1, name:"John Banda",     avatar:"JB", territory:"Lusaka CBD",            status:"On Duty",  phone:"+260 97 123 4567", salesToday:9850, salesTarget:12000, customersVisited:14, customersTarget:18, conversions:78, efficiency:92, consistency:88, trend:[4200,5100,6800,7200,8400,9100,9850], lastSeen:"2 min ago",   checkIn:"07:58 AM" },
  { id:2, name:"Mary Mutale",    avatar:"MM", territory:"Chilenje / Matero",      status:"On Duty",  phone:"+260 96 234 5678", salesToday:8430, salesTarget:10000, customersVisited:12, customersTarget:15, conversions:72, efficiency:85, consistency:90, trend:[3100,4500,5200,6100,7000,7800,8430], lastSeen:"5 min ago",   checkIn:"08:12 AM" },
  { id:3, name:"Peter Chilufya", avatar:"PC", territory:"Kabulonga / Rhodes Park",status:"On Duty",  phone:"+260 95 345 6789", salesToday:7120, salesTarget:10000, customersVisited:10, customersTarget:15, conversions:65, efficiency:71, consistency:74, trend:[2800,3500,4100,5200,5800,6500,7120], lastSeen:"12 min ago",  checkIn:"08:25 AM" },
  { id:4, name:"Grace Phiri",    avatar:"GP", territory:"Woodlands / Ibex Hill",  status:"On Duty",  phone:"+260 97 456 7890", salesToday:6780, salesTarget:9000,  customersVisited:11, customersTarget:14, conversions:70, efficiency:79, consistency:82, trend:[2200,3100,3900,4800,5500,6100,6780], lastSeen:"8 min ago",   checkIn:"07:45 AM" },
  { id:5, name:"James Mulenga",  avatar:"JM", territory:"Kalingalinga / Mtendere",status:"Late",     phone:"+260 96 567 8901", salesToday:5890, salesTarget:9000,  customersVisited:9,  customersTarget:14, conversions:58, efficiency:65, consistency:60, trend:[1800,2400,3100,3900,4600,5200,5890], lastSeen:"25 min ago",  checkIn:"09:15 AM" },
  { id:6, name:"Agnes Zimba",    avatar:"AZ", territory:"Chelston / Northmead",   status:"On Duty",  phone:"+260 95 678 9012", salesToday:5200, salesTarget:8000,  customersVisited:8,  customersTarget:12, conversions:62, efficiency:70, consistency:68, trend:[1500,2100,2800,3400,4100,4700,5200], lastSeen:"3 min ago",   checkIn:"08:05 AM" },
  { id:7, name:"Brian Tembo",    avatar:"BT", territory:"Kabwata / Libala",       status:"Off Duty", phone:"+260 97 789 0123", salesToday:0,    salesTarget:8000,  customersVisited:0,  customersTarget:12, conversions:0,  efficiency:0,  consistency:55, trend:[0,0,0,0,0,0,0],                   lastSeen:"3 hrs ago",   checkIn:"—" },
  { id:8, name:"Ruth Chanda",    avatar:"RC", territory:"Emmasdale / Olympia",    status:"Absent",   phone:"+260 96 890 1234", salesToday:0,    salesTarget:8000,  customersVisited:0,  customersTarget:12, conversions:0,  efficiency:0,  consistency:42, trend:[0,0,0,0,0,0,0],                   lastSeen:"Yesterday",   checkIn:"—" },
];

const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#84cc16","#f97316"];

const STATUS_STYLE: Record<Rep["status"], { bg: string; text: string; dot: string }> = {
  "On Duty":  { bg:"#dcfce7", text:"#16a34a", dot:"#22c55e" },
  "Off Duty": { bg:"#f1f5f9", text:"#64748b", dot:"#94a3b8" },
  "Late":     { bg:"#fef9c3", text:"#a16207", dot:"#eab308" },
  "Absent":   { bg:"#fee2e2", text:"#dc2626", dot:"#ef4444" },
};

const scoreColor = (v: number) => v >= 80 ? "#22c55e" : v >= 60 ? "#f59e0b" : "#ef4444";

function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-semibold" style={{ color: scoreColor(value) }}>{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width:`${value}%`, background: scoreColor(value) }} />
      </div>
    </div>
  );
}

function MiniTrend({ data, positive }: { data: number[]; positive: boolean }) {
  const color = positive ? "#22c55e" : "#ef4444";
  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={data.map((v,i) => ({ i, v }))} margin={{ top:2, right:2, left:2, bottom:2 }}>
        <defs>
          <linearGradient id={`mg${positive}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#mg${positive})`} dot={false} />
        <Tooltip formatter={(v:number) => [`ZMW ${v.toLocaleString()}`]} contentStyle={{ fontSize:10, borderRadius:6, padding:"2px 6px" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function SalesReps() {
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("All");
  const [selected, setSelected]   = useState<Rep | null>(null);

  const filtered = REPS.filter(r =>
    (filter === "All" || r.status === filter) &&
    (r.name.toLowerCase().includes(search.toLowerCase()) || r.territory.toLowerCase().includes(search.toLowerCase()))
  );

  const summary = {
    total:      REPS.length,
    onDuty:     REPS.filter(r => r.status === "On Duty").length,
    issues:     REPS.filter(r => r.status === "Late" || r.status === "Absent").length,
    teamSales:  REPS.reduce((s,r) => s + r.salesToday, 0),
  };

  return (
    <div className="flex gap-4" style={{ minHeight: "calc(100vh - 120px)" }}>

      {/* ── Left ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Total Reps",    value: summary.total,                                icon:<Users size={14}/>,       color:"#3b82f6" },
            { label:"On Duty",       value: summary.onDuty,                               icon:<Target size={14}/>,      color:"#22c55e" },
            { label:"Late / Absent", value: summary.issues,                               icon:<Clock size={14}/>,       color:"#f59e0b" },
            { label:"Team Sales",    value:`ZMW ${(summary.teamSales/1000).toFixed(1)}K`, icon:<TrendingUp size={14}/>,  color:"#8b5cf6" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: c.color+"20", color: c.color }}>{c.icon}</div>
              <div>
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className="text-base font-bold text-slate-800">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Search name or territory…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5">
            {["All","On Duty","Late","Off Duty","Absent"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                style={filter===s ? { background:"#3b82f6", color:"white", borderColor:"#3b82f6" }
                                  : { background:"white",   color:"#64748b", borderColor:"#e2e8f0" }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Rep list */}
        <div className="flex flex-col gap-2 overflow-y-auto pb-4" style={{ maxHeight:"calc(100vh - 270px)" }}>
          {filtered.map(rep => {
            const st  = STATUS_STYLE[rep.status];
            const pct = rep.salesTarget ? Math.round((rep.salesToday / rep.salesTarget) * 100) : 0;
            const isSelected = selected?.id === rep.id;
            return (
              <div key={rep.id} onClick={() => setSelected(isSelected ? null : rep)}
                className="bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
                style={{ borderColor: isSelected ? "#3b82f6" : "#f1f5f9", borderWidth: isSelected ? 1.5 : 1 }}>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: AVATAR_COLORS[rep.id % 8] }}>{rep.avatar}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{rep.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background:st.bg, color:st.text }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background:st.dot }} />
                        {rep.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-slate-400" />
                      <p className="text-xs text-slate-500">{rep.territory}</p>
                    </div>
                  </div>

                  <div className="text-right mr-4">
                    <p className="text-sm font-bold text-slate-800">ZMW {rep.salesToday.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{pct}% of target</p>
                  </div>

                  <MiniTrend data={rep.trend} positive={pct >= 50} />

                  <div className="text-right ml-2 mr-2">
                    <p className="text-sm font-bold text-slate-800">{rep.customersVisited}</p>
                    <p className="text-xs text-slate-400">/{rep.customersTarget} visits</p>
                  </div>

                  <ChevronRight size={14} className="text-slate-300 flex-shrink-0"
                    style={{ transform: isSelected ? "rotate(90deg)" : "none", transition:"transform .2s" }} />
                </div>

                {/* Progress */}
                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width:`${Math.min(pct,100)}%`,
                      background: pct>=80 ? "#22c55e" : pct>=50 ? "#3b82f6" : "#f59e0b" }} />
                </div>

                {/* Expanded */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
                    <ScoreBar value={rep.efficiency}  label="Efficiency" />
                    <ScoreBar value={rep.consistency} label="Consistency" />
                    <ScoreBar value={rep.conversions} label="Conversion" />
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <Users size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No reps match your filter</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right detail panel ── */}
      {selected ? (
        <div className="w-64 flex-shrink-0 bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex flex-col gap-4 self-start sticky top-0">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
              style={{ background: AVATAR_COLORS[selected.id % 8] }}>{selected.avatar}</div>
            <p className="text-sm font-bold text-slate-800 mt-1">{selected.name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: STATUS_STYLE[selected.status].bg, color: STATUS_STYLE[selected.status].text }}>
              {selected.status}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <MapPin size={10} />{selected.territory}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <Phone size={12} className="text-slate-400" />
            <span className="text-xs text-slate-600">{selected.phone}</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today</p>
            {[
              { label:"Sales",    value:`ZMW ${selected.salesToday.toLocaleString()}`,    sub:`Target ZMW ${selected.salesTarget.toLocaleString()}` },
              { label:"Visits",   value:`${selected.customersVisited} customers`,          sub:`Target ${selected.customersTarget}` },
              { label:"Check-in", value: selected.checkIn,                                sub:`Last seen ${selected.lastSeen}` },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-start">
                <span className="text-xs text-slate-500">{s.label}</span>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Award size={11} /> AI Performance
            </p>
            <ScoreBar value={selected.efficiency}  label="Efficiency" />
            <ScoreBar value={selected.consistency} label="Consistency" />
            <ScoreBar value={selected.conversions} label="Conversion" />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">7-Day Trend</p>
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={selected.trend.map((v,i) => ({ i, v }))} margin={{ top:2, right:2, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fill="url(#dg)" dot={false} />
                <Tooltip formatter={(v:number) => [`ZMW ${v.toLocaleString()}`, "Sales"]} contentStyle={{ fontSize:10, borderRadius:6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="w-64 flex-shrink-0 bg-white border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-300 self-start" style={{ minHeight:200 }}>
          <Users size={28} />
          <p className="text-xs">Select a rep to view details</p>
        </div>
      )}
    </div>
  );
}
