import 'dotenv/config';
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { routes } from "./config/routes.js";
import { verifyToken } from "./middleware/auth.js";
import { authLimiter, orderLimiter } from "./middleware/rateLimiter.js";
import CircuitBreaker from "opossum";
import cors from "cors";


const logs = [];

const app = express();

app.use(cors());


app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.removeHeader("ETag");
  next();
});

// 🔥 Rate limiters
app.use("/auth", authLimiter);
app.use("/order", orderLimiter);

app.use((req, res, next) => {
  // ❌ IMPORTANT FIX
  if (req.originalUrl === "/logs") return next();

  const start = Date.now();

  res.on("finish", () => {
    logs.push({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: Date.now() - start,
      timestamp: new Date().toISOString(),
      service: req.originalUrl.startsWith("/auth") ? "auth" : "order",
      success: res.statusCode < 400,
    });

    // 🔥 limit logs
    if (logs.length > 100) logs.shift();
  });

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

  return new Promise((resolve, reject) => {
    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,

      onError: (err) => {
        console.log("❌ Proxy failed:", target);
        reject(err);
      },

      onProxyRes: (proxyRes) => {
        if (proxyRes.statusCode >= 500) {
          reject(new Error("Server error")); // 🔥 treat as failure
        } else {
          resolve();
        }
      },
    });

    proxy(req, res, next);
  });
};

const authBreaker = new CircuitBreaker((req) => {
  return getAuthService(); // sirf target decide karega
}, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
});

authBreaker.on("open", () => console.log("🔥 Circuit OPEN"));
authBreaker.on("halfOpen", () => console.log("⚠️ HALF OPEN"));
authBreaker.on("close", () => console.log("✅ Circuit CLOSED"));

// ==========================
// 🔥 AUTH ROUTE OVERRIDE
// ==========================

app.use("/auth", (req, res, next) => {
  authBreaker.fire(req)
    .then((target) => {
      createProxyMiddleware({
        target,
        changeOrigin: true,
      })(req, res, next);
    })
    .catch(() => {
      if (!res.headersSent) {
        res.status(503).json({
          error: "Auth service temporarily unavailable",
        });
      }
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


app.get("/logs", (req, res) => {
  res.json(logs);
});

// ==========================

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});