import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, CheckCircle, Clock, ChevronRight,
  Navigation, AlertCircle, RotateCcw, Loader2,
} from 'lucide-react';
import { routesApi } from '../../services/api';
import type { Route, Stop } from '../../services/api';

export default function RoutesPage() {
  const navigate = useNavigate();
  const [route,   setRoute]   = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await routesApi.myToday();
      setRoute(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stops   = route?.stops ?? [];
  const visited = stops.filter(s => s.status === 'VISITED').length;
  const pending = stops.filter(s => s.status === 'PENDING').length;
  const pct     = stops.length ? Math.round((visited / stops.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Stops', value: stops.length, icon: <Navigation size={15}/>, bg: '#dbeafe', color: '#3b82f6' },
          { label: 'Visited',     value: visited,       icon: <CheckCircle size={15}/>, bg: '#dcfce7', color: '#22c55e' },
          { label: 'Pending',     value: pending,       icon: <Clock size={15}/>,       bg: '#fef9c3', color: '#eab308' },
          { label: 'Progress',    value: `${pct}%`,     icon: <MapPin size={15}/>,      bg: '#ede9fe', color: '#8b5cf6' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: c.bg, color: c.color }}>{c.icon}</div>
            <div>
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className="text-lg font-bold text-slate-800">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {stops.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {route?.name ?? "Today's Route"}
            </span>
            <span className="text-xs font-bold" style={{ color: pct === 100 ? '#22c55e' : '#3b82f6' }}>
              {visited} of {stops.length} completed
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : '#3b82f6' }} />
          </div>
        </div>
      )}

      {/* Stops list */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Today's Stops</p>
          <button onClick={load} disabled={loading}
            className="text-slate-400 hover:text-slate-600 transition-colors">
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 size={22} className="animate-spin text-blue-400" />
            <p className="text-xs text-slate-400">Loading route…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <AlertCircle size={28} className="text-red-300" />
            <p className="text-sm text-slate-500">Could not load route</p>
            <p className="text-xs text-slate-400">Make sure the API server is running</p>
            <button onClick={load}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
              Retry
            </button>
          </div>
        )}

        {/* No route assigned today */}
        {!loading && !error && !route && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-300">
            <MapPin size={28} />
            <p className="text-sm text-slate-500">No route assigned for today</p>
            <p className="text-xs text-slate-400">Contact your supervisor to assign a route</p>
          </div>
        )}

        {/* Stops */}
        {!loading && !error && stops.length > 0 && (
          <div className="divide-y divide-slate-50">
            {stops.map((stop: Stop, i: number) => {
              const isVisited = stop.status === 'VISITED';
              const isSkipped = stop.status === 'SKIPPED';
              return (
                <div key={stop.id}
                  onClick={() => navigate(`/visit/${stop.id}`)}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors group">

                  {/* Step indicator */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={
                        isVisited ? { background: '#dcfce7', color: '#16a34a' }
                        : isSkipped ? { background: '#f1f5f9', color: '#94a3b8' }
                        : { background: '#dbeafe', color: '#3b82f6' }
                      }>
                      {isVisited ? <CheckCircle size={14}/> : i + 1}
                    </div>
                    {i < stops.length - 1 && (
                      <div className="w-0.5 h-4 rounded-full"
                        style={{ background: isVisited ? '#bbf7d0' : '#e2e8f0' }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {stop.customerName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-slate-500 truncate">{stop.address}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                    style={
                      isVisited ? { background: '#dcfce7', color: '#16a34a' }
                      : isSkipped ? { background: '#f1f5f9', color: '#64748b' }
                      : { background: '#fef9c3', color: '#a16207' }
                    }>
                    {isVisited ? 'Visited' : isSkipped ? 'Skipped' : 'Pending'}
                  </span>

                  <ChevronRight size={14}
                    className="text-slate-300 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
