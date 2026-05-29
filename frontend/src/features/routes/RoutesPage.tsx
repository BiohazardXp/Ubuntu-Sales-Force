import { useEffect, useState } from "react";
import { getRoutes } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { MapPin, CheckCircle, Clock, ChevronRight, Navigation, AlertCircle } from "lucide-react";

type RouteStop = {
  id: number;
  name: string;
  location: string;
  status: "pending" | "visited";
};

export default function RoutesPage() {
  const [routes, setRoutes]   = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const navigate = useNavigate();

  const loadRoutes = () => {
    setLoading(true);
    getRoutes(1)
      .then(data => { setRoutes(data); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRoutes(); }, []);

  const visited = routes.filter(r => r.status === "visited").length;
  const pending = routes.filter(r => r.status === "pending").length;
  const pct     = routes.length ? Math.round((visited / routes.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">

      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total Stops", value: routes.length, icon:<Navigation size={16}/>, bg:"#dbeafe", color:"#3b82f6" },
          { label:"Visited",     value: visited,        icon:<CheckCircle size={16}/>, bg:"#dcfce7", color:"#22c55e" },
          { label:"Pending",     value: pending,        icon:<Clock size={16}/>,       bg:"#fef9c3", color:"#eab308" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:c.bg, color:c.color }}>{c.icon}</div>
            <div>
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className="text-xl font-bold text-slate-800">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {routes.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-600">Route Progress</span>
            <span className="text-xs font-bold" style={{ color: pct===100 ? "#22c55e" : "#3b82f6" }}>{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width:`${pct}%`, background: pct===100 ? "#22c55e" : "#3b82f6" }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{visited} of {routes.length} stops completed</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Today's Stops</p>
          {!loading && !error && <span className="text-xs text-slate-400">{routes.length} locations assigned</span>}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading route…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <AlertCircle size={28} className="text-red-300" />
            <p className="text-sm text-slate-500">Could not load route</p>
            <p className="text-xs text-slate-400">Check that the backend server is running</p>
            <button onClick={loadRoutes} className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">Retry</button>
          </div>
        )}

        {!loading && !error && routes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-300">
            <MapPin size={28} />
            <p className="text-sm">No stops assigned for today</p>
          </div>
        )}

        {!loading && !error && routes.length > 0 && (
          <div className="divide-y divide-slate-50">
            {routes.map((stop, i) => (
              <div key={stop.id} onClick={() => navigate(`/visit/${stop.id}`)}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors group">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={stop.status==="visited" ? { background:"#dcfce7", color:"#16a34a" } : { background:"#f1f5f9", color:"#64748b" }}>
                    {stop.status==="visited" ? <CheckCircle size={14}/> : i+1}
                  </div>
                  {i < routes.length-1 && (
                    <div className="w-0.5 h-4 rounded-full" style={{ background: stop.status==="visited" ? "#bbf7d0" : "#e2e8f0" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{stop.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                    <p className="text-xs text-slate-500 truncate">{stop.location}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                  style={stop.status==="visited" ? { background:"#dcfce7", color:"#16a34a" } : { background:"#fef9c3", color:"#a16207" }}>
                  {stop.status==="visited" ? "Visited" : "Pending"}
                </span>
                <ChevronRight size={14} className="text-slate-300 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
