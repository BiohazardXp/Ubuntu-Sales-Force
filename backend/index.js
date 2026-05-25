const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const USERS = [
  { id: 1, username: "rep1", password: "1234" },
];

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // MVP token (not secure yet)
  res.json({
    token: "mock-jwt-token-" + user.id,
  });
});

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});

let ROUTES = {
  1: [
    {
      id: 101,
      name: "Spar Lusaka Central",
      location: "Cairo Road, Lusaka",
      status: "pending",
      visitedAt: null,
      sales: [],
    },
    {
      id: 102,
      name: "Shoprite Soweto",
      location: "Soweto Market Area",
      status: "pending",
      visitedAt: null,
      sales: [],
    },
    {
      id: 103,
      name: "Game Stores",
      location: "Levy Junction",
      status: "pending",
      visitedAt: null,
      sales: [],
    },
  ],
};

app.get("/route/:userId/:stopId", (req, res) => {
  const { userId, stopId } = req.params;

  const route = ROUTES[userId];
  const stop = route?.find((r) => r.id === parseInt(stopId));

  if (!stop) {
    return res.status(404).json({ message: "Stop not found" });
  }

  res.json(stop);
});

app.post("/visit/checkin", (req, res) => {
  const { userId, stopId } = req.body;

  const route = ROUTES[userId];
  const stop = route?.find((r) => r.id === Number(stopId));

  if (!stop) {
    return res.status(404).json({ message: "Stop not found" });
  }

  stop.status = "visited";
  stop.visitedAt = new Date().toISOString();

  res.json({
    message: "Check-in successful",
    stop,
  });
});

app.post("/sales/add", (req, res) => {
  const { userId, stopId, product, quantity, price } = req.body;

  const route = ROUTES[userId];
  const stop = route?.find((r) => r.id === Number(stopId));

  if (!stop) {
    return res.status(404).json({ message: "Stop not found" });
  }

  const sale = {
    id: Date.now(),
    product,
    quantity,
    price,
    total: quantity * price,
  };

  stop.sales.push(sale);

  res.json({
    message: "Sale recorded",
    stop,
  });
});

app.get("/analytics/:userId", (req, res) => {
  const { userId } = req.params;

  const route = ROUTES[userId] || [];

  let totalSales = 0;
  let visitsCompleted = 0;
  let pendingVisits = 0;

  route.forEach((stop) => {
    if (stop.status === "visited") {
      visitsCompleted++;
    } else {
      pendingVisits++;
    }

    stop.sales.forEach((sale) => {
      totalSales += sale.total;
    });
  });

  res.json({
    totalSales,
    visitsCompleted,
    pendingVisits,
    totalStops: route.length,
  });
});

app.get("/routes/:userId", (req, res) => {
  const { userId } = req.params;

  const route = ROUTES[userId];

  if (!route) {
    return res.status(404).json({ message: "No route found" });
  }

  res.json(route);
});