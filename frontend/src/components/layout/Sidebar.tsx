import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, BarChart2, Package,
  Users, UserCheck, MapPin, CalendarCheck, Fuel,
  LineChart, FileText, Settings, LogOut, Navigation,
} from 'lucide-react';
import { authApi, tokenHelpers } from '../../services/api';
import type { AuthUser, UserRole } from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Nav item definitions with role visibility
// ─────────────────────────────────────────────────────────────────────────────

const ALL_ROLES: UserRole[] = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'SALES_REP'];

const NAV_ITEMS: {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
}[] = [
  {
    to: '/dashboard', icon: <LayoutDashboard size={17}/>, label: 'Dashboard',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR'],
  },
  {
    to: '/live-sales', icon: <TrendingUp size={17}/>, label: 'Live Sales',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR'],
  },
  {
    to: '/sales-reports', icon: <BarChart2 size={17}/>, label: 'Sales Reports',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  },
  {
    to: '/product-analysis', icon: <Package size={17}/>, label: 'Product Analysis',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  },
  {
    to: '/sales-reps', icon: <Users size={17}/>, label: 'Sales Reps',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR'],
  },
  {
    to: '/customers', icon: <UserCheck size={17}/>, label: 'Customers',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR'],
  },
  {
    to: '/routes', icon: <MapPin size={17}/>, label: 'Route & Visits',
    roles: ALL_ROLES,
  },
  {
    to: '/route-assignment', icon: <Navigation size={17}/>, label: 'Assign Routes',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR'],
  },
  {
    to: '/attendance', icon: <CalendarCheck size={17}/>, label: 'Attendance',
    roles: ALL_ROLES,
  },
  {
    to: '/fuel', icon: <Fuel size={17}/>, label: 'Fuel & Vehicles',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  },
  {
    to: '/forecasting', icon: <LineChart size={17}/>, label: 'Forecasting',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  },
  {
    to: '/reports', icon: <FileText size={17}/>, label: 'Reports',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  },
  {
    to: '/settings', icon: <Settings size={17}/>, label: 'Settings',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  },
];

const ROLE_BADGE: Record<UserRole, string> = {
  SUPER_ADMIN:   'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  SUPERVISOR:    'Supervisor',
  SALES_REP:     'Sales Rep',
};

export default function Sidebar() {
  const user: AuthUser | null = tokenHelpers.getUser();
  const role = user?.role as UserRole | undefined;

  const visibleItems = NAV_ITEMS.filter(item =>
    role && item.roles.includes(role)
  );

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U';

  return (
    <aside className="w-56 h-full flex flex-col overflow-hidden" style={{ background: '#1a2236' }}>

      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: '#263049' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#3b82f6' }}>
          <LayoutDashboard size={14} color="white" />
        </div>
        <span className="text-white font-semibold text-sm">Ubuntu Sales</span>
      </div>

      {/* Nav — filtered by role */}
      <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { background: '#3b82f6' } : {}}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Current user + logout */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: '#263049' }}>
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg" style={{ background: '#263049' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: '#3b82f6' }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-xs text-slate-400">
              {role ? ROLE_BADGE[role] : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => authApi.logout()}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
