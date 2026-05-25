import { useState } from "react";
import { Calendar, Filter, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [date] = useState("20 May 2024");

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-slate-800">Dashboard Overview</h1>

      <div className="flex items-center gap-3">
        {/* Date picker */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition">
          <Calendar size={13} className="text-slate-400" />
          {date}
          <ChevronDown size={12} className="text-slate-400" />
        </button>

        {/* Filter */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition">
          <Filter size={13} className="text-slate-400" />
          Filter
        </button>

        {/* Admin avatar */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-700">Admin</span>
          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
