// import { useEffect, useState } from "react";
// import { getAnalytics } from "../../services/api";
// import { Link } from "react-router-dom";
// import {
//   BarChart,
//   Bar,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   CartesianGrid,
// } from "recharts";

// const salesByRep = [
//   { name: "John", sales: 1200 },
//   { name: "Mary", sales: 1800 },
//   { name: "Peter", sales: 900 },
//   { name: "Grace", sales: 2200 },
//   { name: "Brian", sales: 1500 },
// ];

// type Analytics = {
//   totalSales: number;
//   visitsCompleted: number;
//   pendingVisits: number;
//   totalStops: number;
// };

// const COLORS = ["#22c55e", "#f59e0b"];

// export default function Dashboard() {
//   // LIVE KPI STATE
//   const [kpis, setKpis] = useState({
//     totalSales: 8600,
//     visitsCompleted: 24,
//     pendingVisits: 6,
//     totalStops: 30,
//   });

//   // LINE CHART (sales over time)
//   const [salesOverTime, setSalesOverTime] = useState([
//     { time: "9AM", sales: 200 },
//     { time: "10AM", sales: 400 },
//     { time: "11AM", sales: 300 },
//     { time: "12PM", sales: 600 },
//     { time: "1PM", sales: 500 },
//   ]);

//   // PIE CHART
//   const visitData = [
//     { name: "Completed", value: kpis.visitsCompleted },
//     { name: "Pending", value: kpis.pendingVisits },
//   ];

//   const progress = Math.round(
//     (kpis.visitsCompleted / kpis.totalStops) * 100
//   );

//   // 🔄 LIVE UPDATES
//   useEffect(() => {
//     const interval = setInterval(() => {
//       // update KPIs
//       setKpis((prev) => ({
//         totalSales: prev.totalSales + Math.floor(Math.random() * 300),
//         visitsCompleted:
//           prev.visitsCompleted + (Math.random() > 0.7 ? 1 : 0),
//         pendingVisits: Math.max(
//           0,
//           prev.pendingVisits - (Math.random() > 0.6 ? 1 : 0)
//         ),
//         totalStops: prev.totalStops,
//       }));

//       // update line chart
//       setSalesOverTime((prev) => {
//         const newPoint = {
//           time: `${9 + prev.length}AM`,
//           sales: Math.floor(Math.random() * 800 + 200),
//         };

//         return [...prev, newPoint].slice(-6);
//       });
//     }, 4000);

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="space-y-6">

//       {/* HEADER */}
//       <div className="bg-white p-6 rounded-xl border shadow-sm">
//         <h1 className="text-2xl font-bold text-slate-900">
//           Field Operations Dashboard
//         </h1>
//         <p className="text-slate-500 mt-1">
//           Live overview of sales activity and field operations
//         </p>
//       </div>

//       {/* KPI CARDS */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

//         <div className="bg-white p-5 rounded-xl border shadow-sm">
//           <p className="text-sm text-slate-500">Total Sales</p>
//           <p className="text-2xl font-bold text-slate-900 mt-2">
//             K {kpis.totalSales.toLocaleString()}
//           </p>
//         </div>

//         <div className="bg-white p-5 rounded-xl border shadow-sm">
//           <p className="text-sm text-slate-500">Visits Completed</p>
//           <p className="text-2xl font-bold text-green-600 mt-2">
//             {kpis.visitsCompleted}
//           </p>
//         </div>

//         <div className="bg-white p-5 rounded-xl border shadow-sm">
//           <p className="text-sm text-slate-500">Pending Visits</p>
//           <p className="text-2xl font-bold text-yellow-600 mt-2">
//             {kpis.pendingVisits}
//           </p>
//         </div>

//         <div className="bg-white p-5 rounded-xl border shadow-sm">
//           <p className="text-sm text-slate-500">Total Stops</p>
//           <p className="text-2xl font-bold text-slate-900 mt-2">
//             {kpis.totalStops}
//           </p>
//         </div>

//       </div>

//       {/* CHARTS ROW 1 */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

//         {/* BAR CHART */}
//         <div className="bg-white p-6 rounded-xl border shadow-sm">
//           <h2 className="font-semibold mb-4 text-slate-900">
//             Sales by Rep
//           </h2>

//           <div className="h-72">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={salesByRep}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="name" />
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey="sales" fill="#3b82f6" radius={[6, 6, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* LINE CHART */}
//         <div className="bg-white p-6 rounded-xl border shadow-sm">
//           <h2 className="font-semibold mb-4 text-slate-900">
//             Sales Over Time
//           </h2>

//           <div className="h-72">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={salesOverTime}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="time" />
//                 <YAxis />
//                 <Tooltip />
//                 <Line
//                   type="monotone"
//                   dataKey="sales"
//                   stroke="#3b82f6"
//                   strokeWidth={3}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//       </div>

//       {/* CHARTS ROW 2 */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//         {/* PIE CHART */}
//         <div className="bg-white p-6 rounded-xl border shadow-sm">
//           <h2 className="font-semibold mb-4 text-slate-900">
//             Visit Breakdown
//           </h2>

//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie data={visitData} dataKey="value" outerRadius={90} label>
//                   {visitData.map((_, index) => (
//                     <Cell key={index} fill={COLORS[index]} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* PROGRESS */}
//         <div className="bg-white p-6 rounded-xl border shadow-sm col-span-2">
//           <h2 className="font-semibold mb-4 text-slate-900">
//             Today's Progress
//           </h2>

//           <div className="w-full bg-slate-200 rounded-full h-4">
//             <div
//               className="bg-blue-500 h-4 rounded-full transition-all duration-500"
//               style={{ width: `${progress}%` }}
//             />
//           </div>

//           <p className="text-sm text-slate-600 mt-2">
//             {progress}% completed
//           </p>
//         </div>

//       </div>

//       {/* QUICK ACTIONS */}
//       <div className="bg-white p-6 rounded-xl border shadow-sm">
//         <h2 className="font-semibold text-slate-900 mb-4">
//           Quick Actions
//         </h2>

//         <div className="flex gap-3 flex-wrap">

//           <button className="px-4 py-2 border rounded-lg hover:bg-slate-50">
//             View Routes
//           </button>

//           <button className="px-4 py-2 border rounded-lg hover:bg-slate-50">
//             Check Visits
//           </button>

//           <button className="px-4 py-2 border rounded-lg hover:bg-slate-50">
//             Add Sales
//           </button>

//         </div>
//       </div>

//     </div>
//   );
// }
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const salesByRep = [
  { name: "John", sales: 1200 },
  { name: "Mary", sales: 1800 },
  { name: "Peter", sales: 900 },
  { name: "Grace", sales: 2200 },
  { name: "Brian", sales: 1500 },
];

const COLORS = ["#22c55e", "#f59e0b"];

export default function Dashboard() {
  // KPI STATE
  const [kpis, setKpis] = useState({
    totalSales: 8600,
    visitsCompleted: 24,
    pendingVisits: 6,
    totalStops: 30,
  });

  // LINE CHART
  const [salesOverTime, setSalesOverTime] = useState([
    { time: "9AM", sales: 200 },
    { time: "10AM", sales: 400 },
    { time: "11AM", sales: 300 },
    { time: "12PM", sales: 600 },
    { time: "1PM", sales: 500 },
  ]);

  // ACTIVITY FEED
  const [activity, setActivity] = useState<string[]>([
    "System initialized",
    "Loading field data...",
  ]);

  const visitData = [
    { name: "Completed", value: kpis.visitsCompleted },
    { name: "Pending", value: kpis.pendingVisits },
  ];

  const progress = Math.round(
    (kpis.visitsCompleted / kpis.totalStops) * 100
  );

  // TOP PERFORMER (simple derived logic)
  const topRep = salesByRep.reduce((max, rep) =>
    rep.sales > max.sales ? rep : max
  );

  // LIVE ENGINE
  useEffect(() => {
    const reps = ["John", "Mary", "Peter", "Grace", "Brian"];
    const places = ["Spar", "Shoprite", "Game", "Pick n Pay"];

    const interval = setInterval(() => {
      const rep = reps[Math.floor(Math.random() * reps.length)];
      const place = places[Math.floor(Math.random() * places.length)];

      const event = `${rep} completed action at ${place}`;

      // KPI updates (controlled)
      setKpis((prev) => ({
        totalSales: prev.totalSales + Math.floor(Math.random() * 250),
        visitsCompleted:
          prev.visitsCompleted + (Math.random() > 0.7 ? 1 : 0),
        pendingVisits: Math.max(
          0,
          prev.pendingVisits - (Math.random() > 0.6 ? 1 : 0)
        ),
        totalStops: prev.totalStops,
      }));

      // line chart update (kept stable length)
      setSalesOverTime((prev) => {
        const newPoint = {
          time: `${9 + prev.length}AM`,
          sales: Math.floor(Math.random() * 800 + 200),
        };

        return [...prev, newPoint].slice(-6);
      });

      // activity feed
      setActivity((prev) => [event, ...prev].slice(0, 6));

      // toast notification (lightweight)
      toast.success(event, {
        duration: 2000,
      });

    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Field Operations Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Live operations monitoring system
          </p>
        </div>

        {/* LIVE INDICATOR */}
        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          LIVE
        </div>
      </div>

      {/* TOP PERFORMER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-xl shadow">
        <p className="text-sm opacity-80">Top Performer Today</p>
        <h2 className="text-xl font-bold mt-1">{topRep.name}</h2>
        <p className="text-sm opacity-90">
          K {topRep.sales.toLocaleString()} in sales
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500">Total Sales</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            K {kpis.totalSales.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500">Visits Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {kpis.visitsCompleted}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500">Pending Visits</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {kpis.pendingVisits}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500">Progress</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {progress}%
          </p>
        </div>

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* BAR */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-semibold mb-4">Sales by Rep</h2>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByRep}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LINE */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-semibold mb-4">Sales Over Time</h2>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* PIE */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-semibold mb-4">Visit Breakdown</h2>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={visitData} dataKey="value" outerRadius={90} label>
                  {visitData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <div className="bg-white p-6 rounded-xl border shadow-sm col-span-2">
          <h2 className="font-semibold mb-4">Live Activity Feed</h2>

          <div className="space-y-2 max-h-64 overflow-hidden">
            {activity.map((item, i) => (
              <div
                key={i}
                className="text-sm p-2 bg-slate-50 border rounded-lg"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* PROGRESS BAR */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="font-semibold mb-3">Today's Progress</h2>

        <div className="w-full bg-slate-200 rounded-full h-4">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-slate-600 mt-2">
          {progress}% completed
        </p>
      </div>

    </div>
  );
}