import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingCart, Users,
  RotateCcw, Loader2, AlertCircle, Download, Calendar,
} from 'lucide-react';
import { salesApi, attendanceApi } from '../../services/api';
import type { Sale } from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RepSummary { userId: string; name: string; total: number; saleCount: number; }
interface SaleWithRel extends Sale {
  user?: { firstName: string; lastName: string };
  stop?: { customerName: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const zmw     = (n: number) => `ZMW ${n.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const zmwShort = (n: number) => n >= 1000 ? `ZMW ${(n/1000).toFixed(1)}K` : `ZMW ${n.toLocaleString()}`;
const fmtTime  = (iso: string) => new Date(iso).toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit' });

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316','#ec4899'];

// ─────────────────────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, positive, color, icon }: {
  label: string; value: string; sub: string;
  positive: boolean; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: color+'20', color }}>{icon}</div>
      </div>
      <p className="text-xl font-bold text-slate-900 mb-1">{value}</p>
      <div className={`flex items-center gap-1 text-xs ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
        {positive ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
        <span>{sub}</span>
      </div>
    </div>
  );
}

const RADIAN = Math.PI / 180;
function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.08) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text x={cx + r*Math.cos(-midAngle*RADIAN)} y={cy + r*Math.sin(-midAngle*RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percent*100).toFixed(0)}%`}
    </text>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-300">
      <ShoppingCart size={28}/>
      <p className="text-sm text-slate-400">{msg}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function SalesReports() {
  const [sales,      setSales]      = useState<SaleWithRel[]>([]);
  const [repSummary, setRepSummary] = useState<RepSummary[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [tab,        setTab]        = useState<'overview'|'transactions'|'reps'>('overview');

  const today = new Date().toLocaleDateString('en-ZM', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const [salesRes, repRes, attRes] = await Promise.all([
        salesApi.companyToday(),
        salesApi.summaryByRep(),
        attendanceApi.companyToday(),
      ]);
      setSales(salesRes.sales);
      setRepSummary(repRes);
      setAttendance(attRes);
    } catch { setError(true); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived
  const totalRevenue = sales.reduce((s,r) => s+r.total, 0);
  const totalOrders  = sales.length;
  const avgOrder     = totalOrders ? totalRevenue/totalOrders : 0;
  const topRep       = repSummary[0];
  const activeReps   = attendance.filter((a:any) => a.clockIn && !a.clockOut).length;
  const onTimeReps   = attendance.filter((a:any) => a.status === 'PRESENT').length;

  // Hourly buckets
  const hourlyData = Array.from({ length: 14 }, (_, i) => {
    const h = 6 + i;
    return {
      hour:  `${String(h).padStart(2,'0')}:00`,
      total: sales.filter(s => new Date(s.createdAt).getHours() === h).reduce((sum,s) => sum+s.total, 0),
    };
  });

  // Product breakdown
  const productMap: Record<string,number> = {};
  sales.forEach(s => { productMap[s.product] = (productMap[s.product]??0) + s.total; });
  const productData = Object.entries(productMap)
    .map(([name,value]) => ({ name, value }))
    .sort((a,b) => b.value-a.value).slice(0, 6);

  // Export CSV
  const exportCsv = () => {
    const rows = [
      ['Rep','Customer','Product','Qty','Unit Price','Total','Time'],
      ...sales.map(s => [
        s.user ? `${s.user.firstName} ${s.user.lastName}` : '—',
        s.stop?.customerName ?? '—',
        s.product, s.quantity, s.unitPrice, s.total,
        fmtTime(s.createdAt),
      ]),
    ];
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(rows.map(r=>r.join(',')).join('\n'));
    a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 size={24} className="animate-spin text-blue-400"/>
      <p className="text-sm text-slate-400">Loading sales data…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle size={28} className="text-red-300"/>
      <p className="text-sm text-slate-500">Could not load sales data</p>
      <button onClick={load} className="px-4 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">Retry</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-slate-800">Sales Reports</h1>
          <div className="flex items-center gap-1 mt-0.5">
            <Calendar size={11} className="text-slate-400"/>
            <p className="text-xs text-slate-400">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white hover:bg-slate-50">
            <RotateCcw size={12}/> Refresh
          </button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background:'#3b82f6' }}>
            <Download size={12}/> Export CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Revenue Today" value={zmw(totalRevenue)}
          sub={totalOrders > 0 ? `${totalOrders} transactions` : 'No sales yet'}
          positive={totalRevenue>0} color="#10b981" icon={<TrendingUp size={14}/>}/>
        <KpiCard label="Total Orders" value={totalOrders.toString()}
          sub={avgOrder > 0 ? `Avg ${zmwShort(avgOrder)}` : 'No orders yet'}
          positive={totalOrders>0} color="#3b82f6" icon={<ShoppingCart size={14}/>}/>
        <KpiCard label="Top Rep" value={topRep ? topRep.name.split(' ')[0] : '—'}
          sub={topRep ? zmwShort(topRep.total) : 'No sales yet'}
          positive={!!topRep} color="#8b5cf6" icon={<Users size={14}/>}/>
        <KpiCard label="Active Reps" value={`${activeReps}`}
          sub={`${onTimeReps} on time today`}
          positive={activeReps>0} color="#f59e0b" icon={<Users size={14}/>}/>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['overview','transactions','reps'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={tab===t ? { background:'white', color:'#0f172a', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' } : { color:'#64748b' }}>
            {t === 'overview' ? 'Overview' : t === 'transactions' ? 'Transactions' : 'By Rep'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-4">

          {/* Hourly + donut */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-7 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <p className="text-xs font-semibold text-slate-700 mb-3">Revenue by Hour</p>
              {sales.length === 0 ? <Empty msg="No sales yet today"/> : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={hourlyData} margin={{ top:4, right:4, left:-10, bottom:0 }}>
                    <defs>
                      <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="hour" tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} interval={1}/>
                    <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false}
                      tickFormatter={v => v===0 ? '' : zmwShort(v)}/>
                    <Tooltip formatter={(v:number) => [zmw(v),'Revenue']}
                      contentStyle={{ fontSize:11, borderRadius:8, border:'1px solid #e2e8f0' }}/>
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#ag)" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="col-span-5 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <p className="text-xs font-semibold text-slate-700 mb-3">Revenue by Product</p>
              {productData.length === 0 ? <Empty msg="No product data yet"/> : (
                <div className="flex items-center gap-3">
                  <ResponsiveContainer width={110} height={110}>
                    <PieChart>
                      <Pie data={productData} cx="50%" cy="50%" innerRadius={28} outerRadius={50}
                        dataKey="value" labelLine={false} label={DonutLabel}>
                        {productData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v:number) => [zmw(v),'Revenue']} contentStyle={{ fontSize:11, borderRadius:8 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {productData.map((p,i) => (
                      <div key={p.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:COLORS[i%COLORS.length] }}/>
                        <span className="text-xs text-slate-600 truncate flex-1">{p.name}</span>
                        <span className="text-xs font-medium text-slate-700 flex-shrink-0">{zmwShort(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rep bar chart */}
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-700 mb-3">Revenue by Rep</p>
            {repSummary.length === 0 ? <Empty msg="No rep sales yet"/> : (
              <ResponsiveContainer width="100%" height={Math.max(120, repSummary.length * 36)}>
                <BarChart data={repSummary} layout="vertical" margin={{ top:0, right:70, left:10, bottom:0 }} barSize={14}>
                  <XAxis type="number" hide/>
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize:11, fill:'#64748b' }} tickLine={false} axisLine={false}/>
                  <Tooltip formatter={(v:number) => [zmw(v),'Revenue']} contentStyle={{ fontSize:11, borderRadius:8 }}/>
                  <Bar dataKey="total" radius={[0,4,4,0]}
                    label={{ position:'right', fontSize:10, fill:'#64748b', formatter:(v:number) => zmwShort(v) }}>
                    {repSummary.map((_,i) => (
                      <Cell key={i} fill={i===0 ? '#3b82f6' : i===1 ? '#60a5fa' : '#bfdbfe'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Attendance table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-700">Attendance Today</p>
            </div>
            {attendance.length === 0 ? <Empty msg="No attendance records yet"/> : (
              <table className="w-full">
                <thead>
                  <tr style={{ background:'#f8fafc' }} className="border-b border-slate-100">
                    {['Rep','Clock In','Clock Out','Status','Sales Today'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a:any) => {
                    const rs = repSummary.find(r => r.userId === a.userId);
                    return (
                      <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-800">
                          {a.user ? `${a.user.firstName} ${a.user.lastName}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{a.clockIn ? fmtTime(a.clockIn) : '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">
                          {a.clockOut ? fmtTime(a.clockOut) : a.clockIn ? <span style={{ color:'#16a34a' }}>On Duty</span> : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={a.status==='PRESENT' ? { background:'#dcfce7',color:'#16a34a' }
                              : a.status==='LATE' ? { background:'#fef9c3',color:'#a16207' }
                              : { background:'#fee2e2',color:'#dc2626' }}>
                            {a.status==='PRESENT' ? 'On Time' : a.status==='LATE' ? 'Late' : 'Absent'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: rs ? '#16a34a' : '#94a3b8' }}>
                          {rs ? zmw(rs.total) : 'ZMW 0.00'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {tab === 'transactions' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">All Transactions Today</p>
            <span className="text-xs text-slate-400">{sales.length} records · {zmw(totalRevenue)}</span>
          </div>
          {sales.length === 0 ? <Empty msg="No transactions today"/> : (
            <table className="w-full">
              <thead>
                <tr style={{ background:'#f8fafc' }} className="border-b border-slate-100">
                  {['Rep','Customer','Product','Qty','Unit Price','Total','Time'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs font-medium text-slate-800">
                      {s.user ? `${s.user.firstName} ${s.user.lastName}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{s.stop?.customerName ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{s.product}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{s.quantity}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{zmw(s.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-emerald-600">{zmw(s.total)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{fmtTime(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background:'#f8fafc' }}>
                  <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">Total</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600">{zmw(totalRevenue)}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* ── BY REP ── */}
      {tab === 'reps' && (
        <div className="flex flex-col gap-3">
          {repSummary.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              <Empty msg="No rep sales data yet"/>
            </div>
          ) : repSummary.map((rep, i) => {
            const share = totalRevenue ? Math.round((rep.total/totalRevenue)*100) : 0;
            return (
              <div key={rep.userId} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#cd7f32':'#3b82f6' }}>
                    {i+1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{rep.name}</p>
                    <p className="text-xs text-slate-400">{rep.saleCount} transaction{rep.saleCount!==1?'s':''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{zmw(rep.total)}</p>
                    <p className="text-xs text-slate-400">{share}% of total</p>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${share}%`, background:COLORS[i%COLORS.length] }}/>
                </div>
              </div>
            );
          })}
          {repSummary.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Company Total Today</p>
              <p className="text-lg font-bold text-emerald-600">{zmw(totalRevenue)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
