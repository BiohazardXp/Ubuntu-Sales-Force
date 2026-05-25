import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      {/* Left */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          Field Dashboard
        </h2>
        <p className="text-xs text-slate-500">
          Monitor routes, visits & sales in real time
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-600">
          Logged in as <span className="font-medium">rep1</span>
        </div>

      </div>
    </header>
  );
}