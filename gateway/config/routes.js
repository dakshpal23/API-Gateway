export const routes = {
  '/auth': {
    target: 'http://localhost:3001',
    protected: false,   // login/signup — no token required
  },
  '/order': {
    target: 'http://localhost:3002',
    protected: true,    // requires valid JWT
  },
}