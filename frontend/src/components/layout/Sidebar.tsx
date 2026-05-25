import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart2,
  Package,
  Users,
  UserCheck,
  MapPin,
  CalendarCheck,
  Fuel,
  LineChart,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/dashboard", icon: <LayoutDashboard size={17} />, label: "Dashboard" },
  { to: "/live-sales", icon: <TrendingUp size={17} />, label: "Live Sales" },
  { to: "/sales-reports", icon: <BarChart2 size={17} />, label: "Sales Reports" },
  { to: "/product-analysis", icon: <Package size={17} />, label: "Product Analysis" },
  { to: "/sales-reps", icon: <Users size={17} />, label: "Sales Reps" },
  { to: "/customers", icon: <UserCheck size={17} />, label: "Customers" },
  { to: "/routes", icon: <MapPin size={17} />, label: "Route & Visits" },
  { to: "/attendance", icon: <CalendarCheck size={17} />, label: "Attendance" },
  { to: "/fuel", icon: <Fuel size={17} />, label: "Fuel & Vehicles" },
  { to: "/forecasting", icon: <LineChart size={17} />, label: "Forecasting" },
  { to: "/reports", icon: <FileText size={17} />, label: "Reports" },
  { to: "/settings", icon: <Settings size={17} />, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 h-full flex flex-col overflow-hidden" style={{ background: "#1a2236" }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#263049" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#3b82f6" }}>
          <LayoutDashboard size={14} color="white" />
        </div>
        <span className="text-white font-semibold text-sm">Ubuntu Sales</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "none" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`
            }
            style={({ isActive }) =>
              isActive ? { background: "#3b82f6" } : {}
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t" style={{ borderColor: "#263049" }}>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
}
