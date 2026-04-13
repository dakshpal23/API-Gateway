import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './ToastContext';
import Sidebar from './components/Sidebar';
import RequestBuilder from './components/RequestBuilder';
import LogsDashboard from './components/LogsDashboard';
import StatsPanel from './components/StatsPanel';
import AuthPanel from './components/AuthPanel';

const VIEW_META = {
  builder: { title: 'Request Builder', subtitle: 'Craft and fire HTTP requests at your gateway', badge: 'Postman-like' },
  logs:    { title: 'Traffic Logs',    subtitle: 'Live stream of requests flowing through the gateway', badge: 'Real-time' },
  stats:   { title: 'Analytics',       subtitle: 'Request throughput, latency, and error rates', badge: 'Metrics' },
  auth:    { title: 'Authentication',  subtitle: 'Exchange credentials for a JWT bearer token', badge: 'JWT' },
};

function AppContent() {
  const [activeView, setActiveView] = useState('builder');
  const [token, setToken] = useState(null);

  const handleLogin = (jwt) => {
    setToken(jwt);
    if (jwt) setActiveView('builder');
  };

  const meta = VIEW_META[activeView] || VIEW_META.builder;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 grid-bg">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        token={token}
        onClearToken={() => setToken(null)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex-shrink-0 h-14 flex items-center gap-4 px-6 border-b border-gray-700/40 bg-gray-900/40 backdrop-blur-sm">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-100 truncate">{meta.title}</h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-gray-800 border border-gray-700/50 text-[10px] text-gray-400 font-mono">
                {meta.badge}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate hidden md:block">{meta.subtitle}</p>
          </div>

          {/* Right info chips */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <GatewayStatusChip />
            {token && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/8 border border-emerald-500/25">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs text-emerald-400 font-medium">Auth OK</span>
              </div>
            )}
          </div>
        </header>

        {/* View Panel */}
        <div className="flex-1 overflow-hidden p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full glass-panel p-6 overflow-hidden flex flex-col"
            >
              {activeView === 'builder' && <RequestBuilder token={token} />}
              {activeView === 'logs'    && <LogsDashboard />}
              {activeView === 'stats'   && <StatsPanel />}
              {activeView === 'auth'    && <AuthPanel onLogin={handleLogin} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function GatewayStatusChip() {
  const [online, setOnline] = useState(null);

  // Quick ping to /logs to determine gateway reachability — runs once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 3000);
        await fetch('http://localhost:3000/logs', { signal: ctrl.signal });
        clearTimeout(timeout);
        if (!cancelled) setOnline(true);
      } catch {
        if (!cancelled) setOnline(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium ${
      online === true  ? 'bg-emerald-500/8 border-emerald-500/25 text-emerald-400' :
      online === false ? 'bg-rose-500/8 border-rose-500/25 text-rose-400' :
                         'bg-gray-800/60 border-gray-700/40 text-gray-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        online === true ? 'bg-emerald-400 animate-pulse' : online === false ? 'bg-rose-400' : 'bg-gray-500'
      }`} />
      {online === true ? 'Gateway Online' : online === false ? 'Gateway Offline' : 'Checking…'}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}