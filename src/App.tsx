import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, ExternalLink, RefreshCw, Globe, Shield, Sun, Moon } from 'lucide-react';
import { getTrendingSearches, TrendingItem } from './services/geminiService';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const REGIONS = [
  { code: 'UAE', name: 'United Arab Emirates' },
  { code: 'USA', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'India', name: 'India' },
  { code: 'Saudi Arabia', name: 'Saudi Arabia' },
  { code: 'Egypt', name: 'Egypt' },
  { code: 'Global', name: 'Global' },
];

export default function App() {
  const [trends, setTrends] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [region, setRegion] = useState('UAE');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchTrends = async (selectedRegion: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrendingSearches(selectedRegion);
      if (data.length === 0) {
        setError("No trending data found. Please check your API key and connection.");
      }
      setTrends(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to fetch trending searches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends(region);
  }, [region]);

  const googleTrends = trends.filter(t => t.source.toLowerCase().includes('google'));
  const ddgTrends = trends.filter(t => t.source.toLowerCase().includes('duckduckgo'));

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-[#f5f5f5] dark:bg-[#0a0a0a] text-[#1a1a1a] dark:text-[#f0f0f0] font-sans selection:bg-emerald-100 dark:selection:bg-emerald-900/30 selection:text-emerald-900 dark:selection:text-emerald-100 transition-colors duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Trending Pulse</h1>
              <div className="flex items-center gap-2">
                <select 
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {REGIONS.map(r => (
                    <option key={r.code} value={r.code} className="dark:bg-neutral-900">{r.name}</option>
                  ))}
                </select>
                <span className="text-[10px] text-neutral-300 dark:text-neutral-700">•</span>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm mr-2"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => fetchTrends(region)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/5 dark:text-neutral-300 rounded-full text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Updating...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {error && !loading && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        {loading && trends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-500 dark:text-neutral-400 font-medium animate-pulse">Scanning global search trends...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Google Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Globe size={20} />
                </div>
                <h2 className="text-lg font-semibold">Google Trending</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {googleTrends.map((item: TrendingItem, idx: number) => (
                    <TrendCard key={`google-${idx}`} item={item} index={idx} />
                  ))}
                </AnimatePresence>
              </div>
            </section>

            {/* DuckDuckGo Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 flex items-center justify-center bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
                  <Shield size={20} />
                </div>
                <h2 className="text-lg font-semibold">DuckDuckGo Trending</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {ddgTrends.map((item: TrendingItem, idx: number) => (
                    <TrendCard key={`ddg-${idx}`} item={item} index={idx} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          </div>
        )}

        {lastUpdated && !loading && (
          <footer className="mt-12 pt-8 border-t border-black/5 dark:border-white/5 text-center">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-[0.2em]">
              Pulse Sync: {lastUpdated.toLocaleTimeString()} • Verified {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}

interface TrendCardProps {
  item: TrendingItem;
  index: number;
  key?: string;
}

function TrendCard({ item, index }: TrendCardProps) {
  const chartData = item.momentum.map((val, i) => ({ value: val, time: i }));
  const isUp = item.momentum[item.momentum.length - 1] >= item.momentum[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.01, duration: 0.2 }}
      className="group bg-white dark:bg-neutral-900 px-4 py-4 rounded-xl border border-black/[0.03] dark:border-white/[0.03] hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-900/5 dark:hover:shadow-emerald-500/5 transition-all cursor-default flex items-center gap-4"
    >
      <div className="w-8 h-8 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 rounded-full transition-colors shrink-0">
        <TrendingUp size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
          {item.query}
        </h3>
        {item.description && (
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5">
            {item.description}
          </p>
        )}
      </div>
      
      {/* Sparkline */}
      <div className="w-16 h-8 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={isUp ? '#10b981' : '#ef4444'} 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {item.url && (
        <a 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 text-neutral-300 hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </motion.div>
  );
}
