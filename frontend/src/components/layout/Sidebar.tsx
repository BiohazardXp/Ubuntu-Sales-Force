// import { NavLink } from "react-router-dom";

// const linkClass = ({ isActive }: { isActive: boolean }) =>
//   `block px-4 py-3 rounded-lg text-sm font-medium transition ${
//     isActive
//       ? "bg-slate-800 text-white"
//       : "text-slate-300 hover:bg-slate-800 hover:text-white"
//   }`;

// export default function Sidebar() {
//   return (
//     <aside className="w-64 h-full bg-slate-900 text-white flex flex-col overflow-hidden">
//       {/* HEADER */}
//       <div className="px-6 py-5 border-b border-slate-700 flex-shrink-0">
//         <h1 className="text-lg font-bold">Ubuntu Sales Force</h1>
//         <p className="text-xs text-slate-400">Field System</p>
//       </div>

//       {/* NAV */}
//       <nav className="flex-1 overflow-y-auto p-3 space-y-2">
//         <div className="text-xs text-slate-500 px-2 mb-2">MAIN</div>

//         <NavLink to="/dashboard" className={linkClass}>
//           Dashboard
//         </NavLink>

//         <NavLink to="/routes" className={linkClass}>
//           Routes
//         </NavLink>

//         <NavLink to="/visits" className={linkClass}>
//           Visits
//         </NavLink>

//         <NavLink to="/sales" className={linkClass}>
//           Sales
//         </NavLink>

//         <div className="text-xs text-slate-500 px-2 mt-6 mb-2">
//           MANAGEMENT
//         </div>

//         <NavLink to="/reports" className={linkClass}>
//           Reports
//         </NavLink>
//       </nav>

//       {/* LOGOUT AT BOTTOM */}
//       <div className="p-4 border-t border-slate-700 flex-shrink-0">
//         <button 
//           onClick={() => {
//             localStorage.removeItem("token");
//             window.location.href = "/";
//           }}
//           className="w-full bg-red-600 py-2 rounded"
//         >
//           Logout
//         </button>
//       </div>
//     </aside>
//   );
// }
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Route,
  ShoppingCart,
  Users,
  UserCheck,
  CalendarCheck,
} from "lucide-react";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
    isActive
      ? "bg-slate-800 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export default function Sidebar() {
  return (
    <aside className="w-64 h-full bg-slate-900 text-white flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="px-6 py-5 border-b border-slate-700 flex-shrink-0">
        <h1 className="text-lg font-bold">Ubuntu Sales Force</h1>
        <p className="text-xs text-slate-400">Field System</p>
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2">

        <div className="text-xs text-slate-500 px-2 mb-2">MAIN</div>

        <NavLink to="/dashboard" className={linkClass}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/routes" className={linkClass}>
          <Route size={18} />
          Routes
        </NavLink>

        <NavLink to="/live-sales" className={linkClass}>
          <ShoppingCart size={18} />
          Live Sales
        </NavLink>

        <NavLink to="/sales-reps" className={linkClass}>
          <Users size={18} />
          Sales Reps
        </NavLink>

        <NavLink to="/customers" className={linkClass}>
          <UserCheck size={18} />
          Customers
        </NavLink>

        <NavLink to="/attendance" className={linkClass}>
          <CalendarCheck size={18} />
          Attendance
        </NavLink>

        <div className="text-xs text-slate-500 px-2 mt-6 mb-2">
          MANAGEMENT
        </div>

        {/* you can expand later */}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-700 flex-shrink-0">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
          className="w-full bg-red-600 py-2 rounded"
        >
          Logout
        </button>
      </div>

    </aside>
  );
}