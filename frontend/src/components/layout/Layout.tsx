import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="fixed inset-0 flex overflow-hidden" style={{ background: "#f0f2f5" }}>
      <div className="w-56 h-full flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 h-full min-w-0">
        <div className="h-14 flex-shrink-0">
          <Navbar />
        </div>
        <main className="flex-1 min-h-0 overflow-y-auto p-5" style={{ background: "#f0f2f5" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
