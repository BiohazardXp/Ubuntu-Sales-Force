import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRouteStop, checkInVisit, addSale } from "../../services/api";
import {
  MapPin, Clock, CheckCircle, ArrowLeft, Plus,
  Package, Hash, DollarSign, ShoppingCart, AlertCircle
} from "lucide-react";

type Sale = { id: number; product: string; quantity: number; price: number; total: number; };
type Stop = { id: number; name: string; location: string; status: "pending" | "visited"; visitedAt: string | null; sales: Sale[]; };

export default function Visit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [stop, setStop]       = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [checking, setChecking] = useState(false);
  const [adding, setAdding]   = useState(false);

  const [product,  setProduct]  = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price,    setPrice]    = useState(0);

  const userId = 1;

  useEffect(() => {
    if (id) {
      setLoading(true);
      getRouteStop(userId, parseInt(id))
        .then(data => { setStop(data); setError(false); })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleCheckIn = async () => {
    if (!stop) return;
    setChecking(true);
    try {
      const res = await checkInVisit(userId, stop.id);
      setStop(res.stop);
    } finally {
      setChecking(false);
    }
  };

  const handleAddSale = async () => {
    if (!stop || !product || quantity < 1 || price <= 0) return;
    setAdding(true);
    try {
      const res = await addSale(userId, stop.id, { product, quantity, price });
      setStop(res.stop);
      setProduct(""); setQuantity(1); setPrice(0);
    } finally {
      setAdding(false);
    }
  };

  const totalRevenue = stop?.sales.reduce((s, sale) => s + sale.total, 0) ?? 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-2">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-slate-400">Loading stop…</p>
    </div>
  );

  if (error || !stop) return (
    <div className="flex flex-col items-center justify-center h-64 gap-2">
      <AlertCircle size={28} className="text-red-300" />
      <p className="text-sm text-slate-500">Could not load stop</p>
      <button onClick={() => navigate("/routes")} className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
        Back to Route
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* Back */}
      <button onClick={() => navigate("/routes")}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors w-fit">
        <ArrowLeft size={13} /> Back to Route
      </button>

      {/* Stop header */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{stop.name}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={12} className="text-slate-400" />
              <p className="text-xs text-slate-500">{stop.location}</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-medium flex-shrink-0"
            style={stop.status==="visited"
              ? { background:"#dcfce7", color:"#16a34a" }
              : { background:"#fef9c3", color:"#a16207" }}>
            {stop.status==="visited" ? "✓ Visited" : "⏳ Pending"}
          </span>
        </div>

        {stop.status==="visited" && stop.visitedAt && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
            <Clock size={12} className="text-slate-400" />
            <p className="text-xs text-slate-500">Checked in at <span className="font-medium text-slate-700">{stop.visitedAt}</span></p>
          </div>
        )}

        {stop.status==="pending" && (
          <button onClick={handleCheckIn} disabled={checking}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background:"#22c55e" }}>
            {checking
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking in…</>
              : <><CheckCircle size={15} /> Check In</>}
          </button>
        )}
      </div>

      {/* Add Sale form — only when visited */}
      {stop.status==="visited" && (
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={14} className="text-blue-500" /> Add Sale
          </p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="col-span-3">
              <label className="text-xs text-slate-500 mb-1 block">Product Name</label>
              <div className="relative">
                <Package size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="e.g. Coca-Cola 500ml" value={product} onChange={e => setProduct(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Quantity</label>
              <div className="relative">
                <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" min={1}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Unit Price (ZMW)</label>
              <div className="relative">
                <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" min={0} step={0.01}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  value={price} onChange={e => setPrice(Number(e.target.value))} />
              </div>
            </div>
            <div className="flex items-end">
              <div className="bg-slate-50 rounded-lg px-3 py-2 w-full text-center">
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-sm font-bold text-slate-800">ZMW {(quantity * price).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <button onClick={handleAddSale} disabled={adding || !product || price <= 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
            style={{ background:"#3b82f6" }}>
            {adding
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</>
              : <><ShoppingCart size={13} /> Record Sale</>}
          </button>
        </div>
      )}

      {/* Sales history */}
      {stop.sales.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Sales at This Stop</p>
            <span className="text-xs font-bold text-emerald-600">ZMW {totalRevenue.toLocaleString()} total</span>
          </div>
          <div className="divide-y divide-slate-50">
            {stop.sales.map(sale => (
              <div key={sale.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:"#dbeafe" }}>
                  <Package size={13} style={{ color:"#3b82f6" }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-800">{sale.product}</p>
                  <p className="text-xs text-slate-400">Qty {sale.quantity} × ZMW {sale.price.toLocaleString()}</p>
                </div>
                <p className="text-sm font-bold text-emerald-600">ZMW {sale.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
