import { useState } from "react";
import { Search, CheckCircle, Clock, XCircle, Users, Calendar, Download } from "lucide-react";

interface AttendanceRecord {
  id: number; name: string; avatar: string; territory: string;
  clockIn: string; clockOut: string; status: "On Time" | "Late" | "Absent" | "On Duty";
  hoursWorked: string; visits: number; sales: number;
}

const RECORDS: AttendanceRecord[] = [
  { id:1, name:"John Banda",      avatar:"JB", territory:"Lusaka CBD",             clockIn:"07:58 AM", clockOut:"05:32 PM", status:"On Time", hoursWorked:"9h 34m", visits:14, sales:9850  },
  { id:2, name:"Mary Mutale",     avatar:"MM", territory:"Chilenje / Matero",       clockIn:"08:12 AM", clockOut:"05:45 PM", status:"On Time", hoursWorked:"9h 33m", visits:12, sales:8430  },
  { id:3, name:"Peter Chilufya",  avatar:"PC", territory:"Kabulonga / Rhodes Park",  clockIn:"08:25 AM", clockOut:"—",        status:"On Duty", hoursWorked:"—",      visits:10, sales:7120  },
  { id:4, name:"Grace Phiri",     avatar:"GP", territory:"Woodlands / Ibex Hill",   clockIn:"07:45 AM", clockOut:"05:20 PM", status:"On Time", hoursWorked:"9h 35m", visits:11, sales:6780  },
  { id:5, name:"James Mulenga",   avatar:"JM", territory:"Kalingalinga / Mtendere", clockIn:"09:15 AM", clockOut:"—",        status:"Late",    hoursWorked:"—",      visits:9,  sales:5890  },
  { id:6, name:"Agnes Zimba",     avatar:"AZ", territory:"Chelston / Northmead",    clockIn:"08:05 AM", clockOut:"—",        status:"On Duty", hoursWorked:"—",      visits:8,  sales:5200  },
  { id:7, name:"Brian Tembo",     avatar:"BT", territory:"Kabwata / Libala",        clockIn:"—",        clockOut:"—",        status:"Absent",  hoursWorked:"0h 00m", visits:0,  sales:0     },
  { id:8, name:"Ruth Chanda",     avatar:"RC", territory:"Emmasdale / Olympia",     clockIn:"—",        clockOut:"—",        status:"Absent",  hoursWorked:"0h 00m", visits:0,  sales:0     },
  { id:9, name:"Samuel Phiri",    avatar:"SP", territory:"Meanwood / Bauleni",      clockIn:"07:55 AM", clockOut:"05:10 PM", status:"On Time", hoursWorked:"9h 15m", visits:13, sales:7600  },
  { id:10,name:"Charity Mwale",   avatar:"CM", territory:"Kafue Road",              clockIn:"08:30 AM", clockOut:"05:00 PM", status:"On Time", hoursWorked:"8h 30m", visits:10, sales:6100  },
];

const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#84cc16","#f97316","#ec4899","#14b8a6"];

const STATUS_STYLE: Record<AttendanceRecord["status"], { bg:string; text:string; icon: React.ReactNode }> = {
  "On Time": { bg:"#dcfce7", text:"#16a34a", icon:<CheckCircle size={12}/> },
  "On Duty": { bg:"#dbeafe", text:"#1d4ed8", icon:<Clock size={12}/> },
  "Late":    { bg:"#fef9c3", text:"#a16207", icon:<Clock size={12}/> },
  "Absent":  { bg:"#fee2e2", text:"#dc2626", icon:<XCircle size={12}/> },
};

export default function Attendance() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = RECORDS.filter(r =>
    (filter === "All" || r.status === filter) &&
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    onTime:  RECORDS.filter(r => r.status === "On Time").length,
    onDuty:  RECORDS.filter(r => r.status === "On Duty").length,
    late:    RECORDS.filter(r => r.status === "Late").length,
    absent:  RECORDS.filter(r => r.status === "Absent").length,
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Monday, 20 May 2024</span>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white hover:bg-slate-50">
          <Download size={12} /> Export
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label:"Total Reps",  value: RECORDS.length, color:"#3b82f6", icon:<Users size={14}/> },
          { label:"On Time",     value: counts.onTime,  color:"#22c55e", icon:<CheckCircle size={14}/> },
          { label:"On Duty",     value: counts.onDuty,  color:"#3b82f6", icon:<Clock size={14}/> },
          { label:"Late",        value: counts.late,    color:"#f59e0b", icon:<Clock size={14}/> },
          { label:"Absent",      value: counts.absent,  color:"#ef4444", icon:<XCircle size={14}/> },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{c.label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:c.color+"20", color:c.color }}>{c.icon}</div>
            </div>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width:`${(c.value/RECORDS.length)*100}%`, background:c.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Search rep name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {["All","On Time","On Duty","Late","Absent"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
              style={filter===s ? { background:"#3b82f6", color:"white", borderColor:"#3b82f6" }
                                : { background:"white",   color:"#64748b", borderColor:"#e2e8f0" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100" style={{ background:"#f8fafc" }}>
              {["Rep","Territory","Clock In","Clock Out","Hours","Status","Visits","Sales Today"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const st = STATUS_STYLE[r.status];
              return (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{r.avatar}</div>
                      <span className="text-xs font-medium text-slate-800">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.territory}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-700">{r.clockIn}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.clockOut}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.hoursWorked}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 w-fit text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background:st.bg, color:st.text }}>
                      {st.icon}{r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-700">{r.visits}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold" style={{ color: r.sales > 0 ? "#16a34a" : "#94a3b8" }}>
                      ZMW {r.sales.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-300">
            <Users size={28} className="mb-2" />
            <p className="text-xs">No records found</p>
          </div>
        )}
      </div>
    </div>
  );
}
