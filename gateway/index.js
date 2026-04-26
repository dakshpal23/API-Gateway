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

const bufferRequest = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const authProxy = async (req, res, next) => {
  const target = getAuthService();
  console.log("🔀 Auth proxy target selected:", target, req.method, req.originalUrl);

  const authPath = req.originalUrl.replace(/^\/auth/, '') || '/';
  const url = new URL(authPath, target);
  const headers = { ...req.headers };
  delete headers.host;

  const body = ['GET', 'HEAD'].includes(req.method)
    ? undefined
    : await bufferRequest(req);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers,
      body: body && body.length ? body : undefined,
      signal: controller.signal,
    });

    upstream.headers.forEach((value, name) => {
      if (name.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(name, value);
      }
    });

    res.status(upstream.status);
    const responseBody = Buffer.from(await upstream.arrayBuffer());
    res.send(responseBody);

    if (upstream.status >= 500) {
      throw new Error('Server error');
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Auth backend timeout');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

const authBreaker = new CircuitBreaker(authProxy, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  volumeThreshold: 1,
  resetTimeout: 10000,
});

authBreaker.on("failure", (result) => console.log("🧪 Circuit failure detected", result));
authBreaker.on("reject", (err) => console.log("🚫 Circuit request rejected", err?.message || err));
authBreaker.on("open", () => console.log("🔥 Circuit OPEN"));
authBreaker.on("halfOpen", () => console.log("⚠️ HALF OPEN"));
authBreaker.on("close", () => console.log("✅ Circuit CLOSED"));

// ==========================
// 🔥 AUTH ROUTE OVERRIDE
// ==========================

app.use("/auth", (req, res, next) => {
  authBreaker.fire(req, res, next)
    .catch((err) => {
      if (!res.headersSent) {
        console.error("Auth circuit breaker rejected request:", err?.message || err);
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