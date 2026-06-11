import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, CheckCircle, ArrowLeft, Plus,
  Package, ShoppingCart, AlertCircle, Loader2,
  SkipForward,
} from 'lucide-react';
import { routesApi, salesApi } from '../../services/api';
import type { Stop, Sale } from '../../services/api';

export default function Visit() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [stop,        setStop]        = useState<Stop | null>(null);
  const [sales,       setSales]       = useState<Sale[]>([]);
  const [salesTotal,  setSalesTotal]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);
  const [marking,     setMarking]     = useState(false);
  const [addingSale,  setAddingSale]  = useState(false);

  const [product,   setProduct]   = useState('');
  const [quantity,  setQuantity]  = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  // ── Load the stop from today's route ──────────────────────────────────────
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      // Fetch today's route and find the matching stop
      const route = await routesApi.myToday();
      if (!route) { setError(true); return; }

      const found = route.stops.find(s => s.id === id);
      if (!found) { setError(true); return; }
      setStop(found);

      // Load sales for this stop
      const { sales: mySales, total } = await salesApi.myToday();
      const stopSales = mySales.filter((s: any) => s.stopId === id);
      setSales(stopSales);
      setSalesTotal(total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Mark visited ──────────────────────────────────────────────────────────
  const handleMarkVisited = async () => {
    if (!stop) return;
    setMarking(true);
    try {
      const updated = await routesApi.updateStop(stop.id, { status: 'VISITED' });
      setStop(updated);
    } finally {
      setMarking(false);
    }
  };

  // ── Mark skipped ──────────────────────────────────────────────────────────
  const handleSkip = async () => {
    if (!stop) return;
    setMarking(true);
    try {
      const updated = await routesApi.updateStop(stop.id, { status: 'SKIPPED' });
      setStop(updated);
    } finally {
      setMarking(false);
    }
  };

  // ── Add sale ──────────────────────────────────────────────────────────────
  const handleAddSale = async () => {
    if (!stop || !product || quantity < 1 || unitPrice <= 0) return;
    setAddingSale(true);
    try {
      const sale = await salesApi.create({
        product,
        quantity,
        unitPrice,
        stopId:  stop.id,
        localId: `${stop.id}-${Date.now()}`,
      });
      setSales(prev => [...prev, sale]);
      setSalesTotal(prev => prev + sale.total);
      setProduct(''); setQuantity(1); setUnitPrice(0);
    } finally {
      setAddingSale(false);
    }
  };

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-2">
      <Loader2 size={22} className="animate-spin text-blue-400" />
      <p className="text-xs text-slate-400">Loading stop…</p>
    </div>
  );

  if (error || !stop) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle size={28} className="text-red-300" />
      <p className="text-sm text-slate-500">Stop not found</p>
      <p className="text-xs text-slate-400">It may not be on today's route</p>
      <button onClick={() => navigate('/routes')}
        className="mt-1 px-4 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
        ← Back to Route
      </button>
    </div>
  );

  const isVisited = stop.status === 'VISITED';
  const isSkipped = stop.status === 'SKIPPED';
  const isPending = stop.status === 'PENDING';

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* Back */}
      <button onClick={() => navigate('/routes')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors w-fit">
        <ArrowLeft size={13}/> Back to Route
      </button>

      {/* Stop header */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{stop.customerName}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={12} className="text-slate-400"/>
              <p className="text-xs text-slate-500">{stop.address}</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-medium flex-shrink-0"
            style={
              isVisited ? { background: '#dcfce7', color: '#16a34a' }
              : isSkipped ? { background: '#f1f5f9', color: '#64748b' }
              : { background: '#fef9c3', color: '#a16207' }
            }>
            {isVisited ? '✓ Visited' : isSkipped ? 'Skipped' : '⏳ Pending'}
          </span>
        </div>

        {isVisited && stop.visitedAt && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
            <Clock size={12} className="text-slate-400"/>
            <p className="text-xs text-slate-500">
              Checked in at{' '}
              <span className="font-medium text-slate-700">
                {new Date(stop.visitedAt).toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
        )}

        {/* Action buttons — only when pending */}
        {isPending && (
          <div className="flex gap-2 mt-4">
            <button onClick={handleMarkVisited} disabled={marking}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: '#22c55e' }}>
              {marking
                ? <Loader2 size={14} className="animate-spin"/>
                : <CheckCircle size={14}/>}
              Check In
            </button>
            <button onClick={handleSkip} disabled={marking}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60">
              <SkipForward size={14}/>
              Skip
            </button>
          </div>
        )}
      </div>

      {/* Revenue summary — once visited */}
      {isVisited && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sales Made',   value: sales.length,                              color: '#3b82f6' },
            { label: 'Total Revenue',value: `ZMW ${salesTotal.toLocaleString()}`,       color: '#22c55e' },
            { label: 'Avg Order',    value: sales.length
                ? `ZMW ${Math.round(salesTotal / sales.length).toLocaleString()}`
                : 'ZMW 0',                                                              color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add sale form — only after check-in */}
      {isVisited && (
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={14} className="text-blue-500"/> Add Sale
          </p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="col-span-3">
              <label className="text-xs text-slate-500 mb-1 block">Product Name</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="e.g. Coca-Cola 500ml"
                value={product} onChange={e => setProduct(e.target.value)}/>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Quantity</label>
              <input type="number" min={1}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={quantity} onChange={e => setQuantity(Number(e.target.value))}/>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Unit Price (ZMW)</label>
              <input type="number" min={0} step={0.01}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))}/>
            </div>
            <div className="flex items-end">
              <div className="bg-slate-50 rounded-xl px-3 py-2 w-full text-center border border-slate-100">
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-sm font-bold text-slate-800">
                  ZMW {(quantity * unitPrice).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <button onClick={handleAddSale}
            disabled={addingSale || !product || unitPrice <= 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: '#3b82f6' }}>
            {addingSale
              ? <><Loader2 size={13} className="animate-spin"/> Adding…</>
              : <><ShoppingCart size={13}/> Record Sale</>}
          </button>
        </div>
      )}

      {/* Sales at this stop */}
      {sales.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Sales at This Stop</p>
            <span className="text-xs font-bold text-emerald-600">
              ZMW {sales.reduce((t, s) => t + s.total, 0).toLocaleString()} total
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {sales.map(sale => (
              <div key={sale.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#dbeafe' }}>
                  <Package size={13} style={{ color: '#3b82f6' }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{sale.product}</p>
                  <p className="text-xs text-slate-400">
                    Qty {sale.quantity} × ZMW {sale.unitPrice.toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-600">
                  ZMW {sale.total.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
