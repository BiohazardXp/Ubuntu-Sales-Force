import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="fixed inset-0 flex bg-slate-100 overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-64 h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        {/* NAVBAR (fixed height) */}
        <div className="h-14 flex-shrink-0">
          <Navbar />
        </div>

        {/* CONTENT (takes remaining space ONLY) */}
        <main className="flex-1 min-h-0 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}