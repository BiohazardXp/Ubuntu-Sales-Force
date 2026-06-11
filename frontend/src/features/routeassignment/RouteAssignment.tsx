import { useEffect, useState, useCallback } from 'react';
import {
  MapPin, Plus, Trash2, ChevronUp, ChevronDown,
  Users, Calendar, Loader2, CheckCircle, AlertCircle,
  X, Route, Save,
} from 'lucide-react';
import { routesApi, usersApi } from '../../services/api';
import type { AuthUser, Route as RouteType } from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StopDraft {
  key:          string; // local UI key
  customerName: string;
  address:      string;
  notes:        string;
}

interface Toast { id: number; type: 'success' | 'error'; message: string; }

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().split('T')[0];

const emptyStop = (): StopDraft => ({
  key:          crypto.randomUUID(),
  customerName: '',
  address:      '',
  notes:        '',
});

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
          style={{ background: t.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: t.type === 'success' ? '#16a34a' : '#dc2626', minWidth: 260 }}>
          {t.type === 'success' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
          <span className="flex-1">{t.message}</span>
          <button className="opacity-50 hover:opacity-100" onClick={() => onRemove(t.id)}><X size={12}/></button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stop row component
// ─────────────────────────────────────────────────────────────────────────────

function StopRow({
  stop, index, total,
  onChange, onRemove, onMoveUp, onMoveDown,
}: {
  stop: StopDraft; index: number; total: number;
  onChange: (key: string, field: keyof StopDraft, value: string) => void;
  onRemove: (key: string) => void;
  onMoveUp: (key: string) => void;
  onMoveDown: (key: string) => void;
}) {
  const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition";

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        {/* Order badge */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: '#3b82f6' }}>{index + 1}</div>
        <p className="text-xs font-semibold text-slate-600 flex-1">Stop {index + 1}</p>

        {/* Move up/down */}
        <div className="flex gap-0.5">
          <button onClick={() => onMoveUp(stop.key)} disabled={index === 0}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition">
            <ChevronUp size={13}/>
          </button>
          <button onClick={() => onMoveDown(stop.key)} disabled={index === total - 1}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition">
            <ChevronDown size={13}/>
          </button>
        </div>

        {/* Remove */}
        <button onClick={() => onRemove(stop.key)} disabled={total === 1}
          className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition">
          <Trash2 size={13}/>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Customer / Business name *</label>
          <input className={inp} placeholder="Kaputo Mini Mart"
            value={stop.customerName}
            onChange={e => onChange(stop.key, 'customerName', e.target.value)}/>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Address *</label>
          <input className={inp} placeholder="Cairo Road, Lusaka"
            value={stop.address}
            onChange={e => onChange(stop.key, 'address', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Notes (optional)</label>
          <input className={inp} placeholder="e.g. Ask for the manager, use back entrance…"
            value={stop.notes}
            onChange={e => onChange(stop.key, 'notes', e.target.value)}/>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assigned routes panel
// ─────────────────────────────────────────────────────────────────────────────

function AssignedRoutes({ routes, loading }: { routes: RouteType[]; loading: boolean }) {
  if (loading) return (
    <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
      <Loader2 size={16} className="animate-spin"/> <span className="text-xs">Loading…</span>
    </div>
  );

  if (routes.length === 0) return (
    <div className="flex flex-col items-center justify-center py-8 gap-1 text-slate-300">
      <Route size={24}/>
      <p className="text-xs">No routes assigned today</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {routes.map(r => {
        const visited = r.stops.filter(s => s.status === 'VISITED').length;
        const pct     = r.stops.length ? Math.round((visited / r.stops.length) * 100) : 0;
        return (
          <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-semibold text-slate-800">{r.name ?? 'Route'}</p>
                <p className="text-xs text-slate-400">{r.stops.length} stops</p>
              </div>
              <span className="text-xs font-bold" style={{ color: pct === 100 ? '#22c55e' : '#3b82f6' }}>
                {visited}/{r.stops.length} done
              </span>
            </div>
            {/* Progress */}
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : '#3b82f6' }}/>
            </div>
            {/* Stop list */}
            <div className="mt-2 space-y-1">
              {r.stops.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={s.status === 'VISITED'
                      ? { background: '#dcfce7', color: '#16a34a' }
                      : s.status === 'SKIPPED'
                      ? { background: '#f1f5f9', color: '#94a3b8' }
                      : { background: '#fef9c3', color: '#a16207' }}>
                    {s.status === 'VISITED' ? '✓' : i + 1}
                  </div>
                  <span className="text-xs text-slate-600 truncate flex-1">{s.customerName}</span>
                  <span className="text-xs flex-shrink-0"
                    style={{ color: s.status === 'VISITED' ? '#16a34a' : s.status === 'SKIPPED' ? '#94a3b8' : '#a16207' }}>
                    {s.status === 'VISITED' ? 'Done' : s.status === 'SKIPPED' ? 'Skipped' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function RouteAssignment() {
  // Reps
  const [reps,      setReps]      = useState<AuthUser[]>([]);
  const [repsLoading, setRepsLoading] = useState(true);

  // Form state
  const [selectedRep, setSelectedRep] = useState('');
  const [date,        setDate]        = useState(todayISO());
  const [routeName,   setRouteName]   = useState('');
  const [stops,       setStops]       = useState<StopDraft[]>([emptyStop()]);
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  // Today's assigned routes (right panel)
  const [assigned,         setAssigned]         = useState<RouteType[]>([]);
  const [assignedLoading,  setAssignedLoading]  = useState(true);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  // ── Load reps ──────────────────────────────────────────────────────────────
  useEffect(() => {
    usersApi.getAll()
      .then(all => setReps(all.filter(u => u.role === 'SALES_REP' && u.isActive)))
      .catch(() => addToast('error', 'Could not load reps.'))
      .finally(() => setRepsLoading(false));
  }, []);

  // ── Load today's routes ────────────────────────────────────────────────────
  const loadAssigned = useCallback(async () => {
    setAssignedLoading(true);
    try {
      const routes = await routesApi.companyToday();
      setAssigned(routes);
    } catch {
      // Supervisor may not have permission — silently ignore
    } finally {
      setAssignedLoading(false);
    }
  }, []);

  useEffect(() => { loadAssigned(); }, [loadAssigned]);

  // ── Stop CRUD ──────────────────────────────────────────────────────────────
  const addStop = () => setStops(p => [...p, emptyStop()]);

  const removeStop = (key: string) =>
    setStops(p => p.filter(s => s.key !== key));

  const changeStop = (key: string, field: keyof StopDraft, value: string) =>
    setStops(p => p.map(s => s.key === key ? { ...s, [field]: value } : s));

  const moveStop = (key: string, dir: 'up' | 'down') => {
    setStops(p => {
      const idx = p.findIndex(s => s.key === key);
      if (idx < 0) return p;
      const next = [...p];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return p;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedRep)  e.rep  = 'Please select a rep.';
    if (!date)         e.date = 'Please set a date.';
    stops.forEach((s, i) => {
      if (!s.customerName.trim()) e[`stop_${i}_name`]    = 'Required';
      if (!s.address.trim())      e[`stop_${i}_address`] = 'Required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await routesApi.create({
        userId: selectedRep,
        date,
        name:   routeName || undefined,
        stops:  stops.map((s, i) => ({
          customerName: s.customerName.trim(),
          address:      s.address.trim(),
          notes:        s.notes.trim() || undefined,
          order:        i + 1,
        })),
      });

      addToast('success', `Route assigned with ${stops.length} stop${stops.length > 1 ? 's' : ''}.`);

      // Reset form
      setSelectedRep('');
      setDate(todayISO());
      setRouteName('');
      setStops([emptyStop()]);
      setErrors({});

      // Refresh assigned list
      loadAssigned();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      addToast('error', Array.isArray(msg) ? msg[0] : (msg ?? 'Failed to assign route.'));
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition bg-white";

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))}/>

      <div className="flex gap-5">

        {/* ── Left: Assignment form ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <Route size={15}/>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">Assign Route</h1>
              <p className="text-xs text-slate-400">Create a daily route for a sales rep</p>
            </div>
          </div>

          {/* Rep + Date + Name */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Route Details</p>

            {/* Rep picker */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <span className="flex items-center gap-1"><Users size={11}/> Assign to Rep *</span>
              </label>
              {repsLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 size={13} className="animate-spin"/> Loading reps…
                </div>
              ) : reps.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  No active sales reps found. Add reps in Settings first.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {reps.map(rep => (
                    <button key={rep.id} onClick={() => { setSelectedRep(rep.id); setErrors(e => ({ ...e, rep: '' })); }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all"
                      style={selectedRep === rep.id
                        ? { borderColor: '#3b82f6', background: '#eff6ff', borderWidth: 1.5 }
                        : { borderColor: '#e2e8f0', background: 'white' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: '#3b82f6' }}>
                        {rep.firstName[0]}{rep.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {rep.firstName} {rep.lastName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{rep.territory ?? 'No territory'}</p>
                      </div>
                      {selectedRep === rep.id && (
                        <CheckCircle size={13} className="ml-auto flex-shrink-0" style={{ color: '#3b82f6' }}/>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {errors.rep && <p className="text-xs text-red-500 mt-1">{errors.rep}</p>}
            </div>

            {/* Date + Route name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1"><Calendar size={11}/> Date *</span>
                </label>
                <input type="date" className={inp} value={date}
                  onChange={e => { setDate(e.target.value); setErrors(ev => ({ ...ev, date: '' })); }}/>
                {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Route Name (optional)</label>
                <input className={inp} placeholder="e.g. Monday CBD Run"
                  value={routeName} onChange={e => setRouteName(e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Stops */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <MapPin size={11}/> Stops ({stops.length})
              </p>
              <button onClick={addStop}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all text-white"
                style={{ background: '#3b82f6' }}>
                <Plus size={12}/> Add Stop
              </button>
            </div>

            {stops.map((stop, i) => (
              <StopRow
                key={stop.key}
                stop={stop}
                index={i}
                total={stops.length}
                onChange={changeStop}
                onRemove={removeStop}
                onMoveUp={k => moveStop(k, 'up')}
                onMoveDown={k => moveStop(k, 'down')}
              />
            ))}

            {/* Show stop-level errors */}
            {stops.some((_, i) => errors[`stop_${i}_name`] || errors[`stop_${i}_address`]) && (
              <p className="text-xs text-red-500">Please fill in all required stop fields.</p>
            )}
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving || reps.length === 0}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: saving ? '#93c5fd' : '#3b82f6', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving
              ? <><Loader2 size={15} className="animate-spin"/> Assigning…</>
              : <><Save size={15}/> Assign Route</>}
          </button>
        </div>

        {/* ── Right: Today's assigned routes ── */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Today's Routes
            </p>
            <span className="text-xs text-slate-400">{assigned.length} assigned</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <AssignedRoutes routes={assigned} loading={assignedLoading}/>
          </div>
        </div>

      </div>
    </>
  );
}
