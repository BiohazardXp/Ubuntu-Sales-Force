import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRouteStop, checkInVisit } from "../../services/api";
import { addSale } from "../../services/api";

type Sale = {
  id: number;
  product: string;
  quantity: number;
  price: number;
  total: number;
};

type Stop = {
  id: number;
  name: string;
  location: string;
  status: "pending" | "visited";
  visitedAt: string | null;
  sales: Sale[];
};

export default function Visit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [stop, setStop] = useState<Stop | null>(null);
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);

  const userId = 1;

  useEffect(() => {
    if (id) {
      getRouteStop(userId, parseInt(id)).then(setStop);
    }
  }, [id]);

  const handleCheckIn = async () => {
    if (!stop) return;

    const res = await checkInVisit(userId, stop.id);
    setStop(res.stop);

    setTimeout(() => {
      navigate("/routes");
    }, 1000);
  };

  const handleAddSale = async () => {
  if (!stop) return;

  const res = await addSale(userId, stop.id, {
    product,
    quantity,
    price,
  });

  setStop(res.stop);

  setProduct("");
  setQuantity(1);
  setPrice(0);
};

  if (!stop) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{stop.name}</h1>
      <p className="text-gray-500">{stop.location}</p>

      <div className="mt-6">
        <p>Status: {stop.status}</p>

        {stop.status === "pending" && (
          <button
            onClick={handleCheckIn}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            Check In
          </button>
        )}

        {stop.status === "visited" && (
          <div className="mt-4 text-green-600">
            Visited at: {stop.visitedAt}
          </div>
        )}

        {stop.status === "visited" && (
  <div className="mt-6 border-t pt-4">
    <h2 className="text-lg font-bold mb-2">Add Sale</h2>

    <input
      className="border p-2 w-full mb-2"
      placeholder="Product name"
      value={product}
      onChange={(e) => setProduct(e.target.value)}
    />

    <input
      className="border p-2 w-full mb-2"
      type="number"
      placeholder="Quantity"
      value={quantity}
      onChange={(e) => setQuantity(Number(e.target.value))}
    />

    <input
      className="border p-2 w-full mb-2"
      type="number"
      placeholder="Price"
      value={price}
      onChange={(e) => setPrice(Number(e.target.value))}
    />

    <button
      onClick={handleAddSale}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Add Sale
    </button>
  </div>
)}

    {stop.sales.length > 0 && (
  <div className="mt-6">
    <h2 className="text-lg font-bold">Sales History</h2>

    <div className="space-y-2 mt-2">
      {stop.sales.map((sale) => (
        <div key={sale.id} className="p-3 border rounded">
          <p className="font-semibold">{sale.product}</p>
          <p className="text-sm">
            Qty: {sale.quantity} | Price: {sale.price}
          </p>
          <p className="text-green-600 font-bold">
            Total: {sale.total}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
      </div>
    </div>
  );
}