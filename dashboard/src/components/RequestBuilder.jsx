import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getMethodColor, syntaxHighlight, copyToClipboard } from '../utils';
import { useToast } from '../ToastContext';

const BASE_URL = 'http://localhost:3000';
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const PRESETS = [
  { label: 'Login', method: 'POST', path: '/auth/login', body: '{\n  "email": "user@example.com",\n  "password": "password123"\n}' },
  { label: 'Orders', method: 'GET', path: '/order/orders', body: '' },
  { label: 'Health', method: 'GET', path: '/logs', body: '' },
];

export default function RequestBuilder({ token, state, setState }) {
  const { method, endpoint, body, response } = state;
  const setMethod = (m) => setState(prev => ({ ...prev, method: typeof m === 'function' ? m(prev.method) : m }));
  const setEndpoint = (e) => setState(prev => ({ ...prev, endpoint: typeof e === 'function' ? e(prev.endpoint) : e }));
  const setBody = (b) => setState(prev => ({ ...prev, body: typeof b === 'function' ? b(prev.body) : b }));
  const setResponse = (r) => setState(prev => ({ ...prev, response: typeof r === 'function' ? r(prev.response) : r }));
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);
    const url = BASE_URL + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let parsedBody = undefined;
    if (body.trim() && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        addToast('Invalid JSON in request body.', 'error');
        setLoading(false);
        return;
      }
    }

    const startTime = performance.now();
    try {
      const res = await axios({ method, url, headers, data: parsedBody });
      const elapsed = (performance.now() - startTime).toFixed(0);
      setResponse({ status: res.status, data: res.data, time: elapsed, ok: true });
    } catch (err) {
      const elapsed = (performance.now() - startTime).toFixed(0);
      const status = err.response?.status;
      const data = err.response?.data || { error: err.message };
      setResponse({ status, data, time: elapsed, ok: false });
      addToast(`Request failed: ${status || 'Network Error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setMethod(preset.method);
    setEndpoint(preset.path);
    setBody(preset.body);
    setResponse(null);
  };

  const clearAll = () => {
    setMethod('GET');
    setEndpoint('');
    setBody('');
    setResponse(null);
  };

  const handleCopyResponse = () => {
    if (!response) return;
    copyToClipboard(JSON.stringify(response.data, null, 2));
    addToast('Response copied to clipboard!', 'success');
  };

  const statusColor = response
    ? response.ok
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5 h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-100">Request Builder</h2>
          <p className="text-xs text-gray-500">Test your API endpoints</p>
        </div>
        {token && (
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30">
            <span className="status-dot bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs text-emerald-400 font-medium">Authenticated</span>
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-gray-500 self-center mr-1">Presets:</span>
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="px-2.5 py-1 text-xs rounded-md bg-gray-800/60 border border-gray-700/40 
                       text-gray-400 hover:text-gray-200 hover:border-gray-600/60 transition-all duration-150"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Method + Endpoint */}
      <div className="flex gap-2">
        <select
          id="req-method"
          value={method}
          onChange={e => setMethod(e.target.value)}
          className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm font-mono font-bold
                     focus:outline-none focus:border-cyan-500/60 transition-all duration-200 cursor-pointer"
          style={{ color: method === 'GET' ? '#34d399' : method === 'POST' ? '#22d3ee' : method === 'DELETE' ? '#fb7185' : method === 'PUT' ? '#fbbf24' : '#a78bfa' }}
        >
          {METHODS.map(m => (
            <option key={m} value={m} style={{ color: 'white', background: '#1a1f2e' }}>{m}</option>
          ))}
        </select>
        <div className="flex bg-gray-800/60 border border-gray-700/50 rounded-lg overflow-hidden flex-1 focus-within:border-cyan-500/60 transition-all duration-200">
          <div className="px-3 py-2 text-sm font-mono text-gray-500 bg-gray-900/40 border-r border-gray-700/50 flex items-center select-none whitespace-nowrap">
            {BASE_URL}
          </div>
          <input
            id="req-endpoint"
            type="text"
            value={endpoint}
            onChange={e => setEndpoint(e.target.value)}
            placeholder="/auth/login"
            className="bg-transparent border-none focus:outline-none w-full px-3 py-2 font-mono text-sm text-gray-200"
          />
        </div>
        <button
          id="btn-send"
          onClick={sendRequest}
          disabled={loading}
          className="btn-primary shrink-0 flex items-center gap-2 px-5"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
          Send
        </button>
        <button
          id="btn-clear-all"
          onClick={clearAll}
          disabled={loading}
          title="Clear all fields"
          className="btn-danger shrink-0 flex items-center gap-2 px-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>

      {/* Body */}
      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col gap-1.5"
        >
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Request Body (JSON)</label>
          <textarea
            id="req-body"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={6}
            placeholder='{\n  "key": "value"\n}'
            className="input-field font-mono text-sm resize-y"
            spellCheck={false}
          />
        </motion.div>
      )}

      {/* Response */}
      <AnimatePresence>
        {response && (
          <motion.div
            key="response"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-3 flex-1"
          >
            {/* Response meta bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Response</span>
              <div className="flex items-center gap-2 ml-auto">
                {response.status && (
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${statusColor}`}>
                    {response.status}
                  </span>
                )}
                {response.time && (
                  <span className="text-xs text-gray-500 font-mono">{response.time}ms</span>
                )}
                <button
                  id="btn-copy-response"
                  onClick={handleCopyResponse}
                  className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
                  title="Copy response"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button
                  id="btn-clear-response"
                  onClick={() => setResponse(null)}
                  className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5"
                  title="Dismiss response"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Dismiss
                </button>
              </div>
            </div>
            {/* JSON body */}
            <div
              className="json-display flex-1"
              dangerouslySetInnerHTML={{ __html: syntaxHighlight(response.data) }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!response && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-gray-800/60 border border-gray-700/40 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Hit Send to see the response</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
