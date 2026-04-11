import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getServiceFromUrl } from '../utils';

const BASE_URL = 'http://localhost:3000';
const REFRESH_MS = 2000;

function StatCard({ label, value, icon, color, subtext, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('400', '500/15')} border ${color.replace('text-', 'border-').replace('400', '500/30')}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function MiniChart({ data, color }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm transition-all duration-300 ${color}`}
          style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? '4px' : '1px', opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.5 }}
        />
      ))}
    </div>
  );
}

export default function StatsPanel() {
  const [logs, setLogs] = useState([]);
  const [rpmHistory, setRpmHistory] = useState(Array(20).fill(0));
  const [lastMinuteCount, setLastMinuteCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchAndAnalyze = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/logs`);
      const data = Array.isArray(res.data) ? res.data : [];
      setLogs(data);

      // Requests in last 60 seconds
      const now = Date.now();
      const recent = data.filter(l => {
        try {
          return now - new Date(l.timestamp).getTime() < 60000;
        } catch { return false; }
      });
      setLastMinuteCount(recent.length);

      // Sliding RPM history
      setRpmHistory(prev => [...prev.slice(1), recent.length]);
    } catch {
      // silently
    }
  }, []);

  useEffect(() => {
    fetchAndAnalyze();
    intervalRef.current = setInterval(fetchAndAnalyze, REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchAndAnalyze]);

  const total = logs.length;
  const success = logs.filter(l => l.status >= 200 && l.status < 400).length;
  const errors = logs.filter(l => l.status >= 400).length;
  const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : '—';
  const avgResponseTime = total > 0
    ? Math.round(logs.reduce((acc, l) => acc + (l.responseTime || 0), 0) / total)
    : 0;

  // Service breakdown
  const byService = logs.reduce((acc, l) => {
    const s = getServiceFromUrl(l.url);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  // Status distribution
  const statusRanges = {
    '2xx': logs.filter(l => l.status >= 200 && l.status < 300).length,
    '3xx': logs.filter(l => l.status >= 300 && l.status < 400).length,
    '4xx': logs.filter(l => l.status >= 400 && l.status < 500).length,
    '5xx': logs.filter(l => l.status >= 500).length,
  };

  // Recent logs for sparkline (success rate over last 20 fetches)
  const successHistory = rpmHistory;

  const stats = [
    {
      label: 'Total Requests',
      value: total,
      icon: <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      color: 'text-cyan-400',
      subtext: 'All time',
    },
    {
      label: 'Successful',
      value: success,
      icon: <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: 'text-emerald-400',
      subtext: `${successRate}% success rate`,
    },
    {
      label: 'Errors',
      value: errors,
      icon: <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: 'text-rose-400',
      subtext: total > 0 ? `${((errors / total) * 100).toFixed(1)}% error rate` : '',
    },
    {
      label: 'Req / min',
      value: lastMinuteCount,
      icon: <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      color: 'text-amber-400',
      subtext: 'Last 60 seconds',
    },
    {
      label: 'Avg Response',
      value: `${avgResponseTime}ms`,
      icon: <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: 'text-violet-400',
      subtext: 'Average latency',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6 h-full overflow-y-auto pr-1"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-100">Analytics & Stats</h2>
          <p className="text-xs text-gray-500">Live traffic intelligence</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      {/* RPM Mini Chart */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-200">Requests / minute</p>
            <p className="text-xs text-gray-500 mt-0.5">Trailing 20 samples</p>
          </div>
          <span className="text-2xl font-bold text-amber-400">{lastMinuteCount}</span>
        </div>
        <MiniChart data={rpmHistory} color="bg-amber-400" />
      </div>

      {/* Service Breakdown */}
      <div className="glass-panel p-5">
        <p className="text-sm font-semibold text-gray-200 mb-4">Traffic by Service</p>
        <div className="flex flex-col gap-3">
          {Object.entries(byService).length === 0 ? (
            <p className="text-xs text-gray-500">No data yet</p>
          ) : (
            Object.entries(byService).map(([svc, count]) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              const barColors = {
                auth: 'bg-violet-500',
                order: 'bg-cyan-500',
                gateway: 'bg-amber-500',
                other: 'bg-gray-500',
              };
              return (
                <div key={svc}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400 font-medium capitalize">{svc}</span>
                    <span className="text-xs text-gray-500 font-mono">{count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${barColors[svc] || 'bg-gray-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="glass-panel p-5">
        <p className="text-sm font-semibold text-gray-200 mb-4">Status Distribution</p>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(statusRanges).map(([range, count]) => {
            const colors = {
              '2xx': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              '3xx': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              '4xx': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
              '5xx': 'text-rose-600 bg-rose-600/10 border-rose-600/20',
            };
            return (
              <div key={range} className={`p-3 rounded-lg border text-center ${colors[range]}`}>
                <p className="text-lg font-bold font-mono">{count}</p>
                <p className="text-xs opacity-70 mt-0.5">{range}</p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
