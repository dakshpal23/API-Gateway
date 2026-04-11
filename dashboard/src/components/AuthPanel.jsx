import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../ToastContext';

const BASE_URL = 'http://localhost:3000';

export default function AuthPanel({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
      const token = res.data?.token || res.data?.accessToken || res.data?.access_token;
      if (token) {
        onLogin(token);
        addToast('Authenticated successfully!', 'success');
      } else {
        addToast('Login succeeded but no token found in response.', 'warning');
        onLogin(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      addToast(`Auth failed: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearFields = () => {
    setEmail('');
    setPassword('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-100">Authentication</h2>
          <p className="text-xs text-gray-500">Obtain a JWT bearer token</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="auth-email" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="input-field"
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="auth-password" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field"
            autoComplete="current-password"
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button
            id="btn-login"
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Authenticating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </>
            )}
          </button>
          <button
            id="btn-clear-auth"
            type="button"
            disabled={loading}
            onClick={clearFields}
            className="btn-danger flex items-center gap-2 px-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </form>

      {/* Info */}
      <div className="glass-card p-3 flex gap-2 mt-auto">
        <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-gray-400 leading-relaxed">
          Logs in via <span className="font-mono text-cyan-400">POST /auth/login</span>. The JWT token will be attached automatically to subsequent requests.
        </p>
      </div>
    </motion.div>
  );
}
