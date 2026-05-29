import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { tokenHelpers } from '../../services/api';

import Login      from '../../features/auth/Login';
import Layout     from '../../components/layout/Layout';
import Dashboard  from '../../features/dashboard/Dashboard';
import Sales      from '../../features/sales/Sales';
import SalesReps  from '../../features/salesreps/SalesReps';
import Customers  from '../../features/customers/Customers';
import Attendance from '../../features/attendance/Attendance';
import RoutesPage from '../../features/routes/RoutesPage';
import Visit      from '../../features/visits/Visit';
import Settings   from '../../features/settings/Settings';

function RequireAuth({ children }: { children: React.ReactNode }) {
  return tokenHelpers.get() ? <>{children}</> : <Navigate to="/" replace />;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  return tokenHelpers.get() ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-700">{title}</p>
        <p className="text-slate-400 mt-1 text-sm">Coming soon</p>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/dashboard"        element={<Dashboard />} />
          <Route path="/live-sales"       element={<Sales />} />
          <Route path="/sales-reps"       element={<SalesReps />} />
          <Route path="/customers"        element={<Customers />} />
          <Route path="/attendance"       element={<Attendance />} />
          <Route path="/routes"           element={<RoutesPage />} />
          <Route path="/visit/:id"        element={<Visit />} />
          <Route path="/settings"         element={<Settings />} />
          <Route path="/sales-reports"    element={<Placeholder title="Sales Reports" />} />
          <Route path="/product-analysis" element={<Placeholder title="Product Analysis" />} />
          <Route path="/fuel"             element={<Placeholder title="Fuel & Vehicles" />} />
          <Route path="/forecasting"      element={<Placeholder title="Forecasting" />} />
          <Route path="/reports"          element={<Placeholder title="Reports" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
