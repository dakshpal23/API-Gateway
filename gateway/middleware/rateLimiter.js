import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

const redisClient = new Redis();

const createLimiter = (maxRequests) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 60 * 1000,
    max: maxRequests,
    keyGenerator: (req) => ipKeyGenerator(req) + req.baseUrl, // 🔥 per route + user
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests",
    },
  });
};

export const authLimiter = createLimiter(10);
export const orderLimiter = createLimiter(10);