'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Individual {
  id: string;
  first_name: string;
  last_name: string;
  image: string | null;
  college: string | null;
  year: number | null;
  appearance_count: number;
}

interface College {
  college: string;
  total_appearances: number;
  unique_members: number;
}

interface LeaderboardStats {
  unique_queries: number;
  unique_people: number;
  total_appearances: number;
}

type Tab = 'individuals' | 'colleges';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<Tab>('individuals');
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Fetch both leaderboards in parallel
      const [individualsRes, collegesRes] = await Promise.all([
        fetch(`${apiUrl}/api/leaderboard/individuals?limit=20`),
        fetch(`${apiUrl}/api/leaderboard/colleges`)
      ]);
      
      if (individualsRes.ok) {
        const data = await individualsRes.json();
        setIndividuals(data.leaderboard || []);
        setStats(data.stats || null);
      }
      
      if (collegesRes.ok) {
        const data = await collegesRes.json();
        setColleges(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchLeaderboard();
    }
  }, [isExpanded]);

  // Don't render anything if there's no data and not expanded
  if (!isExpanded && individuals.length === 0 && !loading) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="mt-8 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                   rounded-xl text-white/60 hover:text-white transition-all duration-200
                   inline-flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        View Leaderboard
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto mt-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-display font-bold text-white">Leaderboard</h2>
          {stats && (
            <span className="text-xs text-white/40">
              {stats.unique_queries} unique searches
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="p-2 text-white/40 hover:text-white/80 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 text-white/40 hover:text-white/80 transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('individuals')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'individuals'
              ? 'bg-yale-blue text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          Top People
        </button>
        <button
          onClick={() => setActiveTab('colleges')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'colleges'
              ? 'bg-yale-blue text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          Top Colleges
        </button>
      </div>

      {/* Content */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-yale-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-white/50 text-sm">Loading leaderboard...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'individuals' ? (
              <motion.div
                key="individuals"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {individuals.length === 0 ? (
                  <div className="p-8 text-center text-white/50">
                    <p>No data yet. Start searching to populate the leaderboard!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {individuals.map((person, index) => (
                      <div
                        key={person.id}
                        className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                      >
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          index === 2 ? 'bg-amber-600/20 text-amber-500' :
                          'bg-white/5 text-white/40'
                        }`}>
                          {index + 1}
                        </div>

                        {/* Photo */}
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                          {person.image ? (
                            <Image
                              src={person.image}
                              alt={`${person.first_name} ${person.last_name}`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">
                            {person.first_name} {person.last_name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            {person.college && <span>{person.college}</span>}
                            {person.year && <span>'{String(person.year).slice(-2)}</span>}
                          </div>
                        </div>

                        {/* Count */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-yale-blue-light">
                            {person.appearance_count}
                          </div>
                          <div className="text-xs text-white/40">appearances</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="colleges"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {colleges.length === 0 ? (
                  <div className="p-8 text-center text-white/50">
                    <p>No data yet. Start searching to populate the leaderboard!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {colleges.map((college, index) => (
                      <div
                        key={college.college}
                        className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                      >
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          index === 2 ? 'bg-amber-600/20 text-amber-500' :
                          'bg-white/5 text-white/40'
                        }`}>
                          {index + 1}
                        </div>

                        {/* College Icon */}
                        <div className="w-12 h-12 rounded-full bg-yale-blue/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-yale-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium">
                            {college.college}
                          </h3>
                          <div className="text-xs text-white/50">
                            {college.unique_members} members on leaderboard
                          </div>
                        </div>

                        {/* Count */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-yale-blue-light">
                            {college.total_appearances}
                          </div>
                          <div className="text-xs text-white/40">total appearances</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

