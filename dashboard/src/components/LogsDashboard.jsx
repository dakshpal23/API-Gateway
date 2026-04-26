import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getMethodColor, getStatusBg, getServiceFromUrl, formatTimestamp } from '../utils';
import { useToast } from '../ToastContext';

const BASE_URL = 'http://localhost:3000';
const REFRESH_MS = 2000;

const SERVICE_COLORS = {
  auth: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  order: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  gateway: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  other: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

export default function LogsDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();
  const intervalRef = useRef(null);
  const prevCountRef = useRef(0);

  const fetchLogs = useCallback(async (showToast = false) => {
    try {
      const res = await axios.get(`${BASE_URL}/logs`);
      const data = Array.isArray(res.data) ? res.data : [];
      setLogs(data);
      if (showToast && data.length > prevCountRef.current) {
        addToast(`${data.length - prevCountRef.current} new log(s) received`, 'info', 2000);
      }
      prevCountRef.current = data.length;
    } catch {
      // silently fail during polling
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchLogs(false);
  }, [fetchLogs]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchLogs(true), REFRESH_MS);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchLogs]);

  const clearLogs = () => {
    setLogs([]);
    prevCountRef.current = 0;
    setFilterService('all');
    setFilterStatus('all');
    setSearchQuery('');
    addToast('Logs cleared', 'info');
  };

  // Filtering
  const filteredLogs = logs
    .slice()
    .reverse()
    .filter(log => {
      const service = getServiceFromUrl(log.url);
      if (filterService !== 'all' && service !== filterService) return false;
      if (filterStatus === 'success' && (log.status < 200 || log.status >= 400)) return false;
      if (filterStatus === 'error' && (log.status >= 200 && log.status < 400)) return false;
      if (searchQuery && !log.url?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full gap-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-100">Traffic Logs</h2>
          <p className="text-xs text-gray-500">Real-time request monitoring</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            id="btn-toggle-refresh"
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-gray-800/60 border-gray-700/40 text-gray-400'
            }`}
          >
            {autoRefresh ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                Paused
              </>
            )}
          </button>

          {/* Manual refresh */}
          <button
            id="btn-refresh-logs"
            onClick={() => fetchLogs(false)}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          {/* Clear */}
          <button
            id="btn-clear-logs"
            onClick={clearLogs}
            className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          id="log-search"
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search endpoint…"
          className="input-field text-sm py-1.5 flex-1 min-w-[160px]"
        />

        <div className="flex gap-1.5">
          {['all', 'auth', 'order', 'gateway'].map(s => (
            <button
              key={s}
              onClick={() => setFilterService(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                filterService === s
                  ? s === 'all' ? 'bg-gray-700/80 border-gray-600 text-gray-200'
                    : SERVICE_COLORS[s]
                  : 'bg-gray-800/40 border-gray-700/30 text-gray-500 hover:text-gray-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {['all', 'success', 'error'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                filterStatus === s
                  ? s === 'all' ? 'bg-gray-700/80 border-gray-600 text-gray-200'
                    : s === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-gray-800/40 border-gray-700/30 text-gray-500 hover:text-gray-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">
            {filteredLogs.length} / {logs.length} entries
          </span>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid gap-3 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-700/40"
        style={{ gridTemplateColumns: '80px 80px 1fr 70px 80px 90px' }}>
        <span>Method</span>
        <span>Status</span>
        <span>Endpoint</span>
        <span>Time</span>
        <span>Service</span>
        <span className="text-right">Timestamp</span>
      </div>

      {/* Log Entries */}
      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500">Loading logs…</p>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gray-800/60 border border-gray-700/40 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No logs yet. Send a request to see traffic here.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredLogs.map((log, i) => {
              const service = getServiceFromUrl(log.url);
              const isError = log.status >= 400;
              return (
                <motion.div
                  key={`${log.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                  className={`log-row ${isError ? 'border-rose-500/20 bg-rose-500/5' : ''}`}
                  style={{ gridTemplateColumns: '80px 80px 1fr 70px 80px 90px' }}
                >
                  <div className="grid gap-3 w-full items-center"
                    style={{ gridTemplateColumns: '80px 80px 1fr 70px 80px 90px' }}>
                    {/* Method */}
                    <span className={`method-badge w-fit ${getMethodColor(log.method)}`}>
                      {log.method}
                    </span>

                    {/* Status */}
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold w-fit border ${getStatusBg(log.status)}`}>
                      {log.status || '—'}
                    </span>

                    {/* URL */}
                    <span className="font-mono text-xs text-gray-300 truncate" title={`${BASE_URL}${log.url.startsWith('/') ? '' : '/'}${log.url}`}>
                      {log.url}
                    </span>

                    {/* Response time */}
                    <span className="text-xs font-mono text-gray-400">
                      {log.responseTime != null ? `${log.responseTime}ms` : '—'}
                    </span>

                    {/* Service */}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium w-fit border ${SERVICE_COLORS[service] || SERVICE_COLORS.other}`}>
                      {service}
                    </span>

                    {/* Timestamp */}
                    <span className="text-xs font-mono text-gray-500 text-right">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
