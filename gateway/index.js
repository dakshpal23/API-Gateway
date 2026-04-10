import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { routes } from "./config/routes.js";
import { verifyToken } from "./middleware/auth.js";
import { authLimiter, orderLimiter } from "./middleware/rateLimiter.js";
import CircuitBreaker from "opossum";

const app = express();

// 🔥 Rate limiters
app.use("/auth", authLimiter);
app.use("/order", orderLimiter);

// 🔥 Logging
app.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.url}`);
  next();
});


// ==========================
// 🔥 AUTH LOAD BALANCING
// ==========================

const authServices = [
  "http://localhost:3001",
  "http://localhost:5001",
];

let authIndex = 0;

const getAuthService = () => {
  const service = authServices[authIndex];
  authIndex = (authIndex + 1) % authServices.length;
  return service;
};


// ==========================
// 🔥 AUTH CIRCUIT BREAKER
// ==========================

const authProxy = (req, res, next) => {
  const target = getAuthService();

  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
  });

  return proxy(req, res, next); // ✅ IMPORTANT
};

const authBreaker = new CircuitBreaker(authProxy, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
});


// ==========================
// 🔥 AUTH ROUTE OVERRIDE
// ==========================

app.use("/auth", (req, res, next) => {
  authBreaker.fire(req, res, next).catch(() => {
    res.status(503).json({
      error: "Auth service temporarily unavailable",
    });
  });
});


// ==========================
// 🔥 DYNAMIC ROUTING (OTHERS)
// ==========================

Object.keys(routes).forEach((route) => {
  if (route === "/auth") return; // ❗ skip auth

  const { target, protected: isProtected } = routes[route];

  app.use(
    route,
    ...(isProtected ? [verifyToken] : []),
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
});


// ==========================

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});