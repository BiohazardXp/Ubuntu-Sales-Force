import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../../features/auth/Login";
import Dashboard from "../../features/dashboard/Dashboard";
import RoutesPage from "../../features/routes/RoutesPage";
import Visit from "../../features/visits/Visit";
import Layout from "../../components/layout/Layout";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/visit/:id" element={<Visit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}