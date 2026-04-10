export const routes = {
  "/auth": {
    target: "http://localhost:3001",
    protected: false,
  },
  "/order": {
    target: "http://localhost:3002",
    protected: false,
  },
};