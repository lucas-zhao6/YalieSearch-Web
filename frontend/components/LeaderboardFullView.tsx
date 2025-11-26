'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Import college logos
import benjaminFranklinLogo from '@/college_logos/benjamin.franklin.png';
import berkeleyLogo from '@/college_logos/berkeley.png';
import branfordLogo from '@/college_logos/branford.png';
import davenportLogo from '@/college_logos/davenport.png';
import ezraStilesLogo from '@/college_logos/ezra.stiles.png';
import graceHopperLogo from '@/college_logos/grace.hopper.png';
import jonathanEdwardsLogo from '@/college_logos/jonathan.edwards.png';
import morseLogo from '@/college_logos/morse.png';
import pauliMurrayLogo from '@/college_logos/pauli.murray.png';
import piersonLogo from '@/college_logos/pierson.png';
import saybrookLogo from '@/college_logos/saybrook.png';
import sillimanLogo from '@/college_logos/silliman.png';
import timothyDwightLogo from '@/college_logos/timothy.dwight.png';
import trumbullLogo from '@/college_logos/trumbull.png';

const collegeLogos: { [key: string]: any } = {
  "Benjamin Franklin": benjaminFranklinLogo,
  "Berkeley": berkeleyLogo,
  "Branford": branfordLogo,
  "Davenport": davenportLogo,
  "Ezra Stiles": ezraStilesLogo,
  "Grace Hopper": graceHopperLogo,
  "Jonathan Edwards": jonathanEdwardsLogo,
  "Morse": morseLogo,
  "Pauli Murray": pauliMurrayLogo,
  "Pierson": piersonLogo,
  "Saybrook": saybrookLogo,
  "Silliman": sillimanLogo,
  "Timothy Dwight": timothyDwightLogo,
  "Trumbull": trumbullLogo,
};

interface Individual {
  person_id: string;
  first_name: string;
  last_name: string;
  image: string | null;
  college: string | null;
  year: number | null;
  major: string | null;
  appearance_count: number;
}

interface College {
  college: string;
  total_appearances: number;
  unique_members: number;
}

type Tab = 'individuals' | 'colleges';

export default function LeaderboardFullView() {
  const [activeTab, setActiveTab] = useState<Tab>('individuals');
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const [individualsRes, collegesRes] = await Promise.all([
        fetch(`${apiUrl}/api/leaderboard/individuals?limit=50`),
        fetch(`${apiUrl}/api/leaderboard/colleges`)
      ]);
      
      if (!individualsRes.ok) throw new Error('Failed to fetch individual leaderboard');
      if (!collegesRes.ok) throw new Error('Failed to fetch college leaderboard');
      
      const individualsData = await individualsRes.json();
      const collegesData = await collegesRes.json();
      
      setIndividuals(individualsData.leaderboard || []);
      setColleges(collegesData.leaderboard || []);
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-yellow-900';
    if (rank === 2) return 'bg-gray-400 text-gray-900';
    if (rank === 3) return 'bg-orange-600 text-orange-900';
    return 'bg-white/10 text-white/60';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-5xl font-bold mb-4"
        >
          <span className="gradient-text">Leaderboard</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white/60 text-lg"
        >
          See who's most searched across all queries
        </motion.p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('individuals')}
          className={`px-6 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
            activeTab === 'individuals'
              ? 'bg-yale-blue text-white shadow-lg'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Top People
          </div>
        </button>
        <button
          onClick={() => setActiveTab('colleges')}
          className={`px-6 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
            activeTab === 'colleges'
              ? 'bg-yale-blue text-white shadow-lg'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Top Colleges
          </div>
        </button>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200 disabled:opacity-50"
          title="Refresh"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-3 border-yale-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50 text-lg">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-300">{error}</p>
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
                  <div className="p-12 text-center text-white/50">
                    <p className="text-lg">No data yet. Start searching to populate the leaderboard!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {individuals.map((person, index) => (
                      <div
                        key={person.person_id}
                        className="flex items-center gap-4 p-5 hover:bg-white/5 transition-colors"
                      >
                        {/* Rank */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${getRankBadgeColor(index + 1)}`}>
                          {index + 1}
                        </div>

                        {/* Photo */}
                        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                          {person.image ? (
                            <Image
                              src={person.image}
                              alt={`${person.first_name} ${person.last_name}`}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-lg truncate">
                            {person.first_name} {person.last_name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-white/50">
                            {person.college && <span>{person.college}</span>}
                            {person.year && (
                              <>
                                {person.college && <span>•</span>}
                                <span>Class of {person.year}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Count */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-yale-blue-light">
                            {person.appearance_count}
                          </div>
                          <div className="text-xs text-white/40">
                            {person.appearance_count === 1 ? 'search' : 'searches'}
                          </div>
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
                  <div className="p-12 text-center text-white/50">
                    <p className="text-lg">No data yet. Start searching to populate the leaderboard!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {colleges.map((college, index) => (
                      <div
                        key={college.college}
                        className="flex items-center gap-4 p-5 hover:bg-white/5 transition-colors"
                      >
                        {/* Rank */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${getRankBadgeColor(index + 1)}`}>
                          {index + 1}
                        </div>

                        {/* College Logo/Icon */}
                        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white flex-shrink-0 p-2">
                          {collegeLogos[college.college] ? (
                            <Image
                              src={collegeLogos[college.college]}
                              alt={college.college}
                              fill
                              className="object-contain p-1"
                              sizes="56px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-yale-blue/20 rounded-full">
                              <svg className="w-7 h-7 text-yale-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-lg">
                            {college.college}
                          </h3>
                          <div className="text-sm text-white/50">
                            {college.unique_members} {college.unique_members === 1 ? 'member' : 'members'} on leaderboard
                          </div>
                        </div>

                        {/* Count */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-yale-blue-light">
                            {college.total_appearances}
                          </div>
                          <div className="text-xs text-white/40">
                            total {college.total_appearances === 1 ? 'appearance' : 'appearances'}
                          </div>
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

