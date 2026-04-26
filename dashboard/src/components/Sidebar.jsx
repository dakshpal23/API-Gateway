import { motion } from 'framer-motion';

const NAV_ITEMS = [
  {
    id: 'builder',
    label: 'Request Builder',
    description: 'Test endpoints',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    id: 'logs',
    label: 'Traffic Logs',
    description: 'Real-time monitoring',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Analytics',
    description: 'Stats & metrics',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'auth',
    label: 'Authentication',
    description: 'Get JWT token',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

export default function Sidebar({ activeView, onNavigate, token, onClearToken }) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen glass-panel border-r border-gray-700/50 rounded-none">
      {/* Logo / Brand */}
      <div className="p-5 border-b border-gray-700/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-glow-cyan">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight tracking-tight">API Gateway</h1>
            <p className="text-[10px] text-gray-500 font-mono">Console v1.0</p>
          </div>
        </div>

        {/* Server status indicator */}
        <div className="mt-4 flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-800/50 border border-gray-700/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500">Gateway endpoint</span>
            <span className="text-xs font-mono text-gray-300">localhost:3000</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2 mt-1">Navigation</p>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => onNavigate(item.id)}
            className={`sidebar-item relative w-full text-left ${activeView === item.id ? 'active' : ''}`}
          >
            {activeView === item.id && (
              <motion.div
                layoutId="active-indicator"
                className="absolute inset-0 rounded-lg bg-cyan-500/5"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className={`relative z-10 ${activeView === item.id ? 'text-cyan-400' : 'text-gray-500'}`}>
              {item.icon}
            </span>
            <div className="relative z-10">
              <p className={`text-sm font-medium ${activeView === item.id ? 'text-cyan-400' : 'text-gray-300'}`}>
                {item.label}
              </p>
              <p className="text-[10px] text-gray-600">{item.description}</p>
            </div>
          </button>
        ))}
      </nav>

      {/* Auth Token Section */}
      <div className="p-3 border-t border-gray-700/40">
        {token ? (
          <div className="flex flex-col gap-2">
            <div className="px-3 py-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Token Active</span>
                </div>
                <button
                  id="btn-clear-token"
                  onClick={onClearToken}
                  className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors"
                  title="Clear token"
                >
                  Clear
                </button>
              </div>
              <p className="text-[10px] font-mono text-gray-500 truncate">
                {token.substring(0, 32)}…
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('auth')}
            className="w-full px-3 py-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 
                       text-xs text-violet-400 font-medium hover:bg-violet-500/15 transition-all duration-200
                       flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Login to get token
          </button>
        )}

        <div className="mt-3 px-3 py-2">
          <p className="text-[10px] text-gray-600 text-center">
            API Gateway Dashboard © 2026
          </p>
        </div>
      </div>
    </aside>
  );
}
