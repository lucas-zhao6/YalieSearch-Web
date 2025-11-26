'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TrendingItem {
  query: string;
  count: number;
}

interface TrendingSearchesProps {
  onSearchClick: (query: string) => void;
  disabled?: boolean;
}

export default function TrendingSearches({ 
  onSearchClick, 
  disabled = false 
}: TrendingSearchesProps) {
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/trending?period=${period}&limit=8`);
        if (response.ok) {
          const data = await response.json();
          setTrending(data.trending || []);
        }
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, [period]);

  // Don't render if no trending data
  if (!loading && trending.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full max-w-3xl mx-auto mt-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yale-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="text-white/80 font-medium">Trending Searches</h3>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                period === p
                  ? 'bg-yale-blue text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Trending List */}
      {loading ? (
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="h-8 w-24 bg-white/5 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {trending.map((item, index) => (
            <motion.button
              key={item.query}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSearchClick(item.query)}
              disabled={disabled}
              className="group px-4 py-2 bg-white/5 hover:bg-yale-blue/20 
                       border border-white/10 hover:border-yale-blue/30
                       rounded-full transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       inline-flex items-center gap-2"
            >
              <span className="text-white/70 group-hover:text-white text-sm">
                {item.query}
              </span>
              <span className="text-white/30 text-xs">
                {item.count}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

