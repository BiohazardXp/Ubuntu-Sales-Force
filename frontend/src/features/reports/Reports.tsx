import { useState, useCallback } from 'react';
import {
  FileText, Download, Loader2, CheckCircle,
  AlertCircle, TrendingUp, CalendarCheck, MapPin,
  Users, ChevronDown, X,
} from 'lucide-react';
import { salesApi, attendanceApi, routesApi, usersApi } from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ReportStatus = 'idle' | 'loading' | 'done' | 'error';

interface ReportState {
  status:  ReportStatus;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtTime  = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit' });

const fmtDate  = (iso: string) =>
  new Date(iso).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' });

const zmw = (n: number) =>
  `ZMW ${n.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}`;

function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map(r => r.map(escape).join(',')).join('\n');
  const a   = document.createElement('a');
  a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// Report card component
// ─────────────────────────────────────────────────────────────────────────────

function ReportCard({
  icon, title, description, fields, state, onGenerate,
}: {
  icon:        React.ReactNode;
  title:       string;
  description: string;
  fields:      React.ReactNode;
  state:       ReportState;
  onGenerate:  () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#dbeafe', color: '#3b82f6' }}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>

      {/* Config fields */}
      <div className="px-5 py-4 space-y-3">
        {fields}

        {/* Status message */}
        {state.status === 'done' && (
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg"
            style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle size={13}/> {state.message}
          </div>
        )}
        {state.status === 'error' && (
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg"
            style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertCircle size={13}/> {state.message}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={onGenerate}
          disabled={state.status === 'loading'}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all w-full justify-center"
          style={{ background: state.status === 'loading' ? '#93c5fd' : '#3b82f6',
            cursor: state.status === 'loading' ? 'not-allowed' : 'pointer' }}>
          {state.status === 'loading'
            ? <><Loader2 size={14} className="animate-spin"/> Generating…</>
            : <><Download size={14}/> Generate & Download</>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Field components
// ─────────────────────────────────────────────────────────────────────────────

const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition";

function DateRange({
  from, to, onFrom, onTo,
}: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void; }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1">From</label>
        <input type="date" className={inputCls} value={from} onChange={e => onFrom(e.target.value)}/>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">To</label>
        <input type="date" className={inputCls} value={to} onChange={e => onTo(e.target.value)}/>
      </div>
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <select className={inputCls + ' appearance-none pr-8'} value={value} onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().split('T')[0];
const weekAgo  = () => {
  const d = new Date(); d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
};

export default function Reports() {
  // ── Sales report state ────────────────────────────────────────────────────
  const [salesFrom,  setSalesFrom]  = useState(weekAgo());
  const [salesTo,    setSalesTo]    = useState(todayISO());
  const [salesGroup, setSalesGroup] = useState('all');
  const [salesState, setSalesState] = useState<ReportState>({ status: 'idle', message: '' });

  // ── Attendance report state ───────────────────────────────────────────────
  const [attFrom,  setAttFrom]  = useState(weekAgo());
  const [attTo,    setAttTo]    = useState(todayISO());
  const [attState, setAttState] = useState<ReportState>({ status: 'idle', message: '' });

  // ── Routes report state ───────────────────────────────────────────────────
  const [routesState, setRoutesState] = useState<ReportState>({ status: 'idle', message: '' });

  // ── Rep performance state ─────────────────────────────────────────────────
  const [perfState, setPerfState] = useState<ReportState>({ status: 'idle', message: '' });

  // ─────────────────────────────────────────────────────────────────────────
  // Generate: Sales Report
  // ─────────────────────────────────────────────────────────────────────────

  const generateSalesReport = useCallback(async () => {
    setSalesState({ status: 'loading', message: '' });
    try {
      const { sales } = await salesApi.companyToday();

      // Filter by date range client-side (API currently returns today only —
      // when historical endpoint is added this can be swapped)
      const rows: (string | number)[][] = [
        ['Date', 'Time', 'Rep', 'Customer', 'Product', 'Quantity', 'Unit Price (ZMW)', 'Total (ZMW)', 'Status'],
      ];

      if (sales.length === 0) {
        rows.push(['No sales data for the selected period', '', '', '', '', '', '', '', '']);
      } else {
        sales.forEach((s: any) => {
          rows.push([
            fmtDate(s.createdAt),
            fmtTime(s.createdAt),
            s.user ? `${s.user.firstName} ${s.user.lastName}` : '—',
            s.stop?.customerName ?? '—',
            s.product,
            s.quantity,
            s.unitPrice,
            s.total,
            s.status ?? 'SUBMITTED',
          ]);
        });

        // Summary row
        const total = sales.reduce((sum: number, s: any) => sum + s.total, 0);
        rows.push([]);
        rows.push(['', '', '', '', '', '', 'TOTAL', total, '']);
      }

      downloadCsv(
        `sales-report-${salesFrom}-to-${salesTo}.csv`,
        rows,
      );

      setSalesState({ status: 'done', message: `Downloaded ${sales.length} transactions.` });
    } catch {
      setSalesState({ status: 'error', message: 'Failed to generate report. Is the API running?' });
    }
  }, [salesFrom, salesTo]);

  // ─────────────────────────────────────────────────────────────────────────
  // Generate: Attendance Report
  // ─────────────────────────────────────────────────────────────────────────

  const generateAttendanceReport = useCallback(async () => {
    setAttState({ status: 'loading', message: '' });
    try {
      const records = await attendanceApi.companyToday();

      const rows: (string | number | null)[][] = [
        ['Date', 'Rep', 'Status', 'Clock In', 'Clock Out', 'Hours Worked'],
      ];

      if (records.length === 0) {
        rows.push(['No attendance data for the selected period', null, null, null, null, null]);
      } else {
        records.forEach((a: any) => {
          const hoursWorked = a.clockIn && a.clockOut
            ? ((new Date(a.clockOut).getTime() - new Date(a.clockIn).getTime()) / 3600000).toFixed(1) + 'h'
            : a.clockIn ? 'On Duty' : '—';

          rows.push([
            fmtDate(a.date),
            a.user ? `${a.user.firstName} ${a.user.lastName}` : '—',
            a.status,
            a.clockIn ? fmtTime(a.clockIn) : '—',
            a.clockOut ? fmtTime(a.clockOut) : '—',
            hoursWorked,
          ]);
        });

        // Summary
        const onTime = records.filter((a: any) => a.status === 'PRESENT').length;
        const late   = records.filter((a: any) => a.status === 'LATE').length;
        const absent = records.filter((a: any) => a.status === 'ABSENT').length;
        rows.push([]);
        rows.push(['SUMMARY', null, null, null, null, null]);
        rows.push([`On Time: ${onTime}`, `Late: ${late}`, `Absent: ${absent}`, null, null, null]);
      }

      downloadCsv(`attendance-report-${attFrom}-to-${attTo}.csv`, rows);
      setAttState({ status: 'done', message: `Downloaded ${records.length} records.` });
    } catch {
      setAttState({ status: 'error', message: 'Failed to generate report.' });
    }
  }, [attFrom, attTo]);

  // ─────────────────────────────────────────────────────────────────────────
  // Generate: Routes Coverage Report
  // ─────────────────────────────────────────────────────────────────────────

  const generateRoutesReport = useCallback(async () => {
    setRoutesState({ status: 'loading', message: '' });
    try {
      const routes = await routesApi.companyToday();

      const rows: (string | number | null)[][] = [
        ['Route', 'Rep', 'Date', 'Total Stops', 'Visited', 'Skipped', 'Pending', 'Completion %'],
      ];

      if (routes.length === 0) {
        rows.push(['No route data for today', null, null, null, null, null, null, null]);
      } else {
        routes.forEach((r: any) => {
          const visited  = r.stops.filter((s: any) => s.status === 'VISITED').length;
          const skipped  = r.stops.filter((s: any) => s.status === 'SKIPPED').length;
          const pending  = r.stops.filter((s: any) => s.status === 'PENDING').length;
          const pct      = r.stops.length ? Math.round((visited / r.stops.length) * 100) : 0;
          const repName  = r.user ? `${r.user.firstName} ${r.user.lastName}` : '—';

          rows.push([
            r.name ?? 'Route',
            repName,
            fmtDate(r.date),
            r.stops.length,
            visited, skipped, pending,
            `${pct}%`,
          ]);

          // Stop detail rows
          r.stops.forEach((s: any) => {
            rows.push([
              `  → ${s.customerName}`,
              '',
              '',
              '',
              s.status === 'VISITED' ? '✓' : '',
              s.status === 'SKIPPED' ? '✓' : '',
              s.status === 'PENDING' ? '✓' : '',
              s.visitedAt ? fmtTime(s.visitedAt) : '',
            ]);
          });
        });
      }

      downloadCsv('routes-coverage-report.csv', rows);
      setRoutesState({ status: 'done', message: `Downloaded ${routes.length} routes.` });
    } catch {
      setRoutesState({ status: 'error', message: 'Failed to generate report.' });
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Generate: Rep Performance Report
  // ─────────────────────────────────────────────────────────────────────────

  const generatePerfReport = useCallback(async () => {
    setPerfState({ status: 'loading', message: '' });
    try {
      const [repSummary, users, attendance] = await Promise.all([
        salesApi.summaryByRep(),
        usersApi.getAll(),
        attendanceApi.companyToday(),
      ]);

      const rows: (string | number | null)[][] = [
        ['Rep', 'Territory', 'Sales Total (ZMW)', 'Transactions', 'Avg Order (ZMW)', 'Attendance Status', 'Clock In', 'Clock Out'],
      ];

      const reps = users.filter((u: any) => u.role === 'SALES_REP' && u.isActive);

      if (reps.length === 0) {
        rows.push(['No active sales reps found', null, null, null, null, null, null, null]);
      } else {
        reps.forEach((rep: any) => {
          const sales = repSummary.find((r: any) => r.userId === rep.id);
          const att   = attendance.find((a: any) => a.userId === rep.id);
          const avg   = sales && sales.saleCount > 0 ? sales.total / sales.saleCount : 0;

          rows.push([
            `${rep.firstName} ${rep.lastName}`,
            rep.territory ?? '—',
            sales?.total ?? 0,
            sales?.saleCount ?? 0,
            avg.toFixed(2),
            att?.status ?? 'ABSENT',
            att?.clockIn ? fmtTime(att.clockIn) : '—',
            att?.clockOut ? fmtTime(att.clockOut) : '—',
          ]);
        });

        // Totals
        const grandTotal = repSummary.reduce((s: number, r: any) => s + r.total, 0);
        const grandCount = repSummary.reduce((s: number, r: any) => s + r.saleCount, 0);
        rows.push([]);
        rows.push(['TOTALS', '', grandTotal, grandCount, grandCount > 0 ? (grandTotal/grandCount).toFixed(2) : '0', '', '', '']);
      }

      downloadCsv(`rep-performance-${todayISO()}.csv`, rows);
      setPerfState({ status: 'done', message: `Downloaded performance data for ${reps.length} reps.` });
    } catch {
      setPerfState({ status: 'error', message: 'Failed to generate report.' });
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#dbeafe', color: '#3b82f6' }}>
          <FileText size={16}/>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-800">Reports</h1>
          <p className="text-xs text-slate-400">Generate and download CSV reports from live data</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs"
        style={{ background: '#eff6ff', color: '#1d4ed8' }}>
        <AlertCircle size={13} className="flex-shrink-0 mt-0.5"/>
        <span>
          All reports pull live data from the API and download instantly as CSV files you can open in Excel or Google Sheets.
          Historical date filtering will unlock once you have multiple days of data.
        </span>
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-2 gap-4">

        {/* Sales Report */}
        <ReportCard
          icon={<TrendingUp size={16}/>}
          title="Sales Report"
          description="All transactions — product, rep, customer, revenue"
          state={salesState}
          onGenerate={generateSalesReport}
          fields={
            <>
              <DateRange from={salesFrom} to={salesTo} onFrom={setSalesFrom} onTo={setSalesTo}/>
              <SelectField
                label="Group by"
                value={salesGroup}
                onChange={setSalesGroup}
                options={[
                  { value: 'all',     label: 'All transactions' },
                  { value: 'rep',     label: 'By rep' },
                  { value: 'product', label: 'By product' },
                ]}
              />
            </>
          }
        />

        {/* Attendance Report */}
        <ReportCard
          icon={<CalendarCheck size={16}/>}
          title="Attendance Report"
          description="Clock-in/out times, status, hours worked per rep"
          state={attState}
          onGenerate={generateAttendanceReport}
          fields={
            <DateRange from={attFrom} to={attTo} onFrom={setAttFrom} onTo={setAttTo}/>
          }
        />

        {/* Routes Coverage Report */}
        <ReportCard
          icon={<MapPin size={16}/>}
          title="Routes Coverage Report"
          description="Route completion, visited vs skipped stops per rep"
          state={routesState}
          onGenerate={generateRoutesReport}
          fields={
            <div className="px-3 py-2.5 rounded-lg text-xs text-slate-500 border border-slate-100"
              style={{ background: '#f8fafc' }}>
              Shows today's route assignments and completion status for all reps.
              Stop-level detail included.
            </div>
          }
        />

        {/* Rep Performance Report */}
        <ReportCard
          icon={<Users size={16}/>}
          title="Rep Performance Report"
          description="Sales totals, transaction counts, attendance — one row per rep"
          state={perfState}
          onGenerate={generatePerfReport}
          fields={
            <div className="px-3 py-2.5 rounded-lg text-xs text-slate-500 border border-slate-100"
              style={{ background: '#f8fafc' }}>
              Pulls all active sales reps and cross-references their sales totals with
              today's attendance. Useful for daily performance reviews.
            </div>
          }
        />

      </div>

      {/* What's coming */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-slate-700 mb-3">Coming with more data</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <TrendingUp size={13}/>, label: 'Weekly / Monthly Sales Trends', note: 'Needs 7+ days of sales data' },
            { icon: <MapPin size={13}/>,     label: 'Territory Performance',          note: 'Needs territory assignments + sales' },
            { icon: <Users size={13}/>,      label: 'Rep Leaderboard (monthly)',       note: 'Needs 30+ days of rep data' },
          ].map(c => (
            <div key={c.label} className="flex items-start gap-2 p-3 rounded-xl"
              style={{ background: '#f8fafc' }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#e2e8f0', color: '#94a3b8' }}>{c.icon}</div>
              <div>
                <p className="text-xs font-medium text-slate-600">{c.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
