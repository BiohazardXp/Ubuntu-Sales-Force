import { useEffect, useState } from "react";
import { getRoutes } from "../../services/api";
import { useNavigate } from "react-router-dom";

type RouteStop = {
  id: number;
  name: string;
  location: string;
  status: "pending" | "visited";
};

export default function Routes() {
  const [routes, setRoutes] = useState<RouteStop[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = 1; // MVP hardcoded rep
    getRoutes(userId).then(setRoutes);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Today's Route</h1>

      <div className="space-y-3">
        {routes.map((stop) => (
  <div
    key={stop.id}
    onClick={() => navigate(`/visit/${stop.id}`)}
    className="p-4 border rounded flex justify-between items-center cursor-pointer hover:bg-gray-50"
  >
    <div>
      <h2 className="font-semibold">{stop.name}</h2>
      <p className="text-sm text-gray-500">{stop.location}</p>
    </div>

    <span
      className={`text-sm px-3 py-1 rounded ${
        stop.status === "visited"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {stop.status}
    </span>
  </div>
))}
      </div>
    </div>
  );
}