import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

export const getRoutes = async (userId: number) => {
  const res = await api.get(`/routes/${userId}`);
  return res.data;
};

export default api;

export const getRouteStop = async (userId: number, stopId: number) => {
  const res = await api.get(`/route/${userId}/${stopId}`);
  return res.data;
};

export const checkInVisit = async (userId: number, stopId: number) => {
  const res = await api.post(`/visit/checkin`, {
    userId,
    stopId,
  });
  return res.data;
};

export const addSale = async (
  userId: number,
  stopId: number,
  data: {
    product: string;
    quantity: number;
    price: number;
  }
) => {
  const res = await api.post("/sales/add", {
    userId,
    stopId,
    ...data,
  });

  return res.data;
};

export const getAnalytics = async (userId: number) => {
  const res = await api.get(`/analytics/${userId}`);
  return res.data;
};