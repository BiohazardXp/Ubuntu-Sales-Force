import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../../features/auth/Login";
import Dashboard from "../../features/dashboard/Dashboard";
import RoutesPage from "../../features/routes/RoutesPage";
import Visit from "../../features/visits/Visit";
import Sales from "../../features/sales/Sales";
import Layout from "../../components/layout/Layout";

// Placeholder for pages not yet built
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
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/visit/:id" element={<Visit />} />
          <Route path="/live-sales" element={<Sales />} />
          <Route path="/sales-reports" element={<Placeholder title="Sales Reports" />} />
          <Route path="/product-analysis" element={<Placeholder title="Product Analysis" />} />
          <Route path="/sales-reps" element={<Placeholder title="Sales Reps" />} />
          <Route path="/customers" element={<Placeholder title="Customers" />} />
          <Route path="/attendance" element={<Placeholder title="Attendance" />} />
          <Route path="/fuel" element={<Placeholder title="Fuel & Vehicles" />} />
          <Route path="/forecasting" element={<Placeholder title="Forecasting" />} />
          <Route path="/reports" element={<Placeholder title="Reports" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
