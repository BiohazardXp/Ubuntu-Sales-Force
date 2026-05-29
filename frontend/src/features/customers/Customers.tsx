import { useState } from "react";
import { Search, MapPin, ShoppingBag, TrendingUp, User, ChevronRight, Star } from "lucide-react";

interface Customer {
  id: number; name: string; business: string; area: string;
  rep: string; lastVisit: string; totalPurchases: number;
  status: "Active" | "New" | "Inactive"; category: string;
  visitCount: number; avgOrderValue: number;
}

const CUSTOMERS: Customer[] = [
  { id:1,  name:"Kaputo Mini Mart",     business:"Retail",   area:"Lusaka CBD",             rep:"John Banda",     lastVisit:"Today 10:20 AM",    totalPurchases:45200, status:"Active",   category:"Beverages",  visitCount:22, avgOrderValue:2055 },
  { id:2,  name:"Zombe General Store",  business:"Wholesale",area:"Chilenje",               rep:"Mary Mutale",    lastVisit:"Today 09:45 AM",    totalPurchases:38800, status:"Active",   category:"Snacks",     visitCount:18, avgOrderValue:2156 },
  { id:3,  name:"Mutale Superette",     business:"Retail",   area:"Kabulonga",              rep:"Peter Chilufya", lastVisit:"Today 11:00 AM",    totalPurchases:31500, status:"Active",   category:"Dairy",      visitCount:15, avgOrderValue:2100 },
  { id:4,  name:"Phiri Cash & Carry",   business:"Wholesale",area:"Woodlands",              rep:"Grace Phiri",    lastVisit:"Today 08:55 AM",    totalPurchases:28900, status:"Active",   category:"Household",  visitCount:20, avgOrderValue:1445 },
  { id:5,  name:"Lusa Quick Stop",      business:"Retail",   area:"Kalingalinga",           rep:"James Mulenga",  lastVisit:"Yesterday 03:10 PM",totalPurchases:18200, status:"Active",   category:"Beverages",  visitCount:12, avgOrderValue:1517 },
  { id:6,  name:"Bauleni Trading",      business:"Retail",   area:"Bauleni",                rep:"Agnes Zimba",    lastVisit:"Today 10:45 AM",    totalPurchases:14600, status:"New",      category:"Snacks",     visitCount:6,  avgOrderValue:2433 },
  { id:7,  name:"Northmead Grocers",    business:"Retail",   area:"Northmead",              rep:"Agnes Zimba",    lastVisit:"2 days ago",        totalPurchases:9800,  status:"Active",   category:"Dairy",      visitCount:9,  avgOrderValue:1089 },
  { id:8,  name:"Chelston Supermarket", business:"Retail",   area:"Chelston",               rep:"Agnes Zimba",    lastVisit:"Today 09:30 AM",    totalPurchases:22100, status:"Active",   category:"Beverages",  visitCount:14, avgOrderValue:1579 },
  { id:9,  name:"Emmasdale Traders",    business:"Wholesale",area:"Emmasdale",              rep:"Samuel Phiri",   lastVisit:"Today 11:30 AM",    totalPurchases:35000, status:"Active",   category:"Household",  visitCount:19, avgOrderValue:1842 },
  { id:10, name:"New Life Pharmacy",    business:"Pharmacy", area:"Rhodes Park",            rep:"Peter Chilufya", lastVisit:"3 days ago",        totalPurchases:6200,  status:"Inactive", category:"Others",     visitCount:4,  avgOrderValue:1550 },
  { id:11, name:"Kafue Road Depot",     business:"Wholesale",area:"Kafue Road",             rep:"Charity Mwale",  lastVisit:"Today 08:30 AM",    totalPurchases:51000, status:"Active",   category:"Beverages",  visitCount:25, avgOrderValue:2040 },
  { id:12, name:"Olympia Corner Store", business:"Retail",   area:"Olympia",               rep:"Samuel Phiri",   lastVisit:"Yesterday 04:00 PM",totalPurchases:8400,  status:"New",      category:"Snacks",     visitCount:3,  avgOrderValue:2800 },
];

const STATUS_STYLE: Record<Customer["status"], { bg:string; text:string }> = {
  "Active":   { bg:"#dcfce7", text:"#16a34a" },
  "New":      { bg:"#dbeafe", text:"#1d4ed8" },
  "Inactive": { bg:"#f1f5f9", text:"#64748b" },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Beverages":"#3b82f6","Snacks":"#f59e0b","Dairy":"#10b981",
  "Household":"#8b5cf6","Others":"#ef4444","Pharmacy":"#06b6d4",
};

export default function Customers() {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("All");
  const [selected, setSelected]   = useState<Customer | null>(null);

  const filtered = CUSTOMERS.filter(c =>
    (statusFilter === "All" || c.status === statusFilter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
     c.area.toLowerCase().includes(search.toLowerCase()) ||
     c.rep.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = CUSTOMERS.reduce((s,c) => s + c.totalPurchases, 0);
  const active       = CUSTOMERS.filter(c => c.status === "Active").length;
  const newCount     = CUSTOMERS.filter(c => c.status === "New").length;

  return (
    <div className="flex gap-4">

      {/* ── Left ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Total Customers", value: CUSTOMERS.length,                           color:"#3b82f6", icon:<User size={14}/> },
            { label:"Active",          value: active,                                     color:"#22c55e", icon:<Star size={14}/> },
            { label:"New Today",       value: newCount,                                   color:"#3b82f6", icon:<TrendingUp size={14}/> },
            { label:"Total Revenue",   value:`ZMW ${(totalRevenue/1000).toFixed(0)}K`,   color:"#8b5cf6", icon:<ShoppingBag size={14}/> },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background:c.color+"20", color:c.color }}>{c.icon}</div>
              <div>
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className="text-base font-bold text-slate-800">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search customer, area or rep…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5">
            {["All","Active","New","Inactive"].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                style={statusFilter===s ? { background:"#3b82f6", color:"white", borderColor:"#3b82f6" }
                                        : { background:"white",   color:"#64748b", borderColor:"#e2e8f0" }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Customer list */}
        <div className="flex flex-col gap-2 overflow-y-auto pb-4" style={{ maxHeight:"calc(100vh - 270px)" }}>
          {filtered.map(c => {
            const st = STATUS_STYLE[c.status];
            const catColor = CATEGORY_COLORS[c.category] ?? "#64748b";
            const isSel = selected?.id === c.id;
            return (
              <div key={c.id} onClick={() => setSelected(isSel ? null : c)}
                className="bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
                style={{ borderColor: isSel ? "#3b82f6" : "#f1f5f9", borderWidth: isSel ? 1.5 : 1 }}>

                <div className="flex items-center gap-3">
                  {/* Category dot */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: catColor+"20" }}>
                    <ShoppingBag size={15} style={{ color: catColor }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background:st.bg, color:st.text }}>{c.status}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: catColor+"15", color: catColor }}>{c.category}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1"><MapPin size={10} className="text-slate-400"/><span className="text-xs text-slate-500">{c.area}</span></div>
                      <div className="flex items-center gap-1"><User size={10} className="text-slate-400"/><span className="text-xs text-slate-500">{c.rep}</span></div>
                    </div>
                  </div>

                  <div className="text-right mr-4">
                    <p className="text-sm font-bold text-slate-800">ZMW {c.totalPurchases.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{c.visitCount} visits total</p>
                  </div>

                  <div className="text-right mr-3">
                    <p className="text-xs text-slate-500">Last visit</p>
                    <p className="text-xs font-medium text-slate-700">{c.lastVisit}</p>
                  </div>

                  <ChevronRight size={14} className="text-slate-300 flex-shrink-0"
                    style={{ transform: isSel ? "rotate(90deg)" : "none", transition:"transform .2s" }} />
                </div>

                {/* Expanded */}
                {isSel && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
                    {[
                      { label:"Total Purchases", value:`ZMW ${c.totalPurchases.toLocaleString()}` },
                      { label:"Avg Order Value",  value:`ZMW ${c.avgOrderValue.toLocaleString()}` },
                      { label:"Business Type",    value: c.business },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-xs text-slate-400">{s.label}</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <User size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No customers found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right detail panel ── */}
      {selected ? (
        <div className="w-64 flex-shrink-0 bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex flex-col gap-4 self-start sticky top-0">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: (CATEGORY_COLORS[selected.category]??'#64748b')+"20" }}>
              <ShoppingBag size={22} style={{ color: CATEGORY_COLORS[selected.category]??'#64748b' }} />
            </div>
            <p className="text-sm font-bold text-slate-800 mt-1">{selected.name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: STATUS_STYLE[selected.status].bg, color: STATUS_STYLE[selected.status].text }}>
              {selected.status}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <MapPin size={10}/>{selected.area}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</p>
            {[
              { label:"Business Type",    value: selected.business },
              { label:"Category",         value: selected.category },
              { label:"Assigned Rep",     value: selected.rep },
              { label:"Total Visits",     value: `${selected.visitCount}` },
              { label:"Last Visit",       value: selected.lastVisit },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-start">
                <span className="text-xs text-slate-500">{s.label}</span>
                <span className="text-xs font-semibold text-slate-800 text-right max-w-32">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue</p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Total Purchases</span>
                <span className="text-xs font-bold text-emerald-600">ZMW {selected.totalPurchases.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Avg Order</span>
                <span className="text-xs font-semibold text-slate-700">ZMW {selected.avgOrderValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-64 flex-shrink-0 bg-white border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-300 self-start" style={{ minHeight:180 }}>
          <User size={28} />
          <p className="text-xs">Select a customer to view details</p>
        </div>
      )}
    </div>
  );
}
