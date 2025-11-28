'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import ResultsGrid from '@/components/ResultsGrid';
// import TrendingSearches from '@/components/TrendingSearches'; // COMMENTED OUT - TRENDING FEATURE TEMPORARILY DISABLED
// import LeaderboardFullView from '@/components/LeaderboardFullView'; // COMMENTED OUT - LEADERBOARD FEATURE TEMPORARILY DISABLED
import WelcomeModal from '@/components/WelcomeModal';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/auth';
import { isAnonymousMode, setAnonymousMode } from '@/lib/searchHistory';

interface SearchResult {
  id: string;
  first_name: string;
  last_name: string;
  image: string | null;
  college: string | null;
  year: number | null;
  major: string | null;
  email: string | null;
  score: number;
}

interface Filters {
  college: string | null;
  year: number | null;
  major: string | null;
}

interface SimilarTo {
  name: string;
  id: string;
}

type ActiveView = 'search' | 'leaderboard';

export default function Home() {
  const { user, loading, login, logout } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anonymousMode, setAnonymousModeState] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    college: null,
    year: null,
    major: null
  });
  const [similarTo, setSimilarTo] = useState<SimilarTo | null>(null);
  const [searchType, setSearchType] = useState<'text' | 'similar'>('text');
  const [activeView, setActiveView] = useState<ActiveView>('search');

  // Load anonymous mode preference on mount
  useEffect(() => {
    setAnonymousModeState(isAnonymousMode());
  }, []);

  const toggleAnonymousMode = () => {
    const newValue = !anonymousMode;
    setAnonymousModeState(newValue);
    setAnonymousMode(newValue);
  };

  const handleSearch = async (searchQuery: string, filterOverride?: Filters) => {
    setQuery(searchQuery);
    setSimilarTo(null); // Clear similar mode when doing a new search
    setIsLoading(true);
    setHasSearched(true);
    setError(null);

    // Use provided filters or current state
    const activeFilters = filterOverride ?? filters;

    try {
      const token = getAuthToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Build query params
      const params = new URLSearchParams({
        q: searchQuery,
        k: '20',
        anonymous: anonymousMode.toString()
      });
      
      if (activeFilters.college) params.append('college', activeFilters.college);
      if (activeFilters.year) params.append('year', activeFilters.year.toString());
      if (activeFilters.major) params.append('major', activeFilters.major);
      
      const response = await fetch(
        `${apiUrl}/api/search?${params.toString()}`,
        {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
          } : {},
        }
      );
      
      if (response.status === 401) {
        setError('Please log in to search');
        setResults([]);
        return;
      }
      
      if (response.status === 400) {
        const errorData = await response.json();
        setError(errorData.detail || 'This search query violates our content policy. Please try a different search.');
        setResults([]);
        return;
      }
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data.results);
      setSearchType(data.search_type || 'text');
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindSimilar = async (personId: string) => {
    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    setQuery(''); // Clear the search query

    try {
      const token = getAuthToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(
        `${apiUrl}/api/similar/${personId}?k=20`,
        {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
          } : {},
        }
      );
      
      if (response.status === 401) {
        setError('Please log in to search');
        setResults([]);
        return;
      }
      
      if (response.status === 404) {
        setError('Person not found');
        setResults([]);
        return;
      }
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data.results);
      setSearchType(data.search_type || 'similar');
      setSimilarTo({
        name: `${data.person.first_name} ${data.person.last_name}`.trim(),
        id: data.person.id
      });
    } catch (error) {
      console.error('Find similar error:', error);
      setError('Failed to find similar people. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    // Re-run search if we have a query, passing new filters directly
    // (can't rely on state since it updates async)
    if (query) {
      handleSearch(query, newFilters);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yale-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      </main>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mb-8">
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Yalie Search</span>
            </h1>
            <p className="text-white/60 text-lg">
              {/* AI-powered semantic search for Yalies */}
              Semantic search for Yalies
            </p>
          </div>

          <div className="glass rounded-2xl p-8 mb-6">
            <svg className="w-20 h-20 mx-auto mb-4 text-yale-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl text-white font-semibold mb-2">
              Yale CAS Login Required
            </h2>
            <p className="text-white/60 mb-6">
              Please sign in with your Yale NetID to access Yalie Search
            </p>
            <button
              onClick={login}
              className="px-8 py-3 bg-yale-blue hover:bg-yale-blue-light text-white font-semibold rounded-xl transition-all duration-300 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign in with Yale CAS
            </button>
          </div>

          <p className="text-white/40 text-sm">
            Restricted to Yale University students and affiliates
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Welcome Modal */}
      <WelcomeModal />

      {/* Header with user info */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setActiveView('search');
                setHasSearched(false);
                setResults([]);
                setQuery('');
                setSimilarTo(null);
                setError(null);
              }}
              className="font-display text-xl font-bold gradient-text hover:opacity-80 transition-opacity"
            >
              Yalie Search
            </button>
            
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setActiveView('search')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeView === 'search'
                    ? 'bg-yale-blue text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </div>
              </button>
              {/* LEADERBOARD TAB - TEMPORARILY COMMENTED OUT
              <button
                onClick={() => setActiveView('leaderboard')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeView === 'leaderboard'
                    ? 'bg-yale-blue text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Leaderboard
                </div>
              </button>
              */}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Anonymous Mode Toggle */}
            <button
              onClick={toggleAnonymousMode}
              className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 inline-flex items-center gap-1.5 ${
                anonymousMode 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
              title={anonymousMode ? 'Anonymous mode ON - searches not saved' : 'Anonymous mode OFF - searches saved to history'}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {anonymousMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                )}
              </svg>
              {anonymousMode ? 'Anonymous' : 'Normal'}
            </button>

            <div className="text-sm text-white/60">
              Welcome, <span className="text-white font-semibold">{user.netid}</span>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-all duration-200 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Search View */}
      {activeView === 'search' && (
        <>
          {/* Hero Section */}
          <section className="relative pt-32 pb-8 px-4">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-yale-blue/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yale-blue-light/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto text-center">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-8">
                  {/* Find Yalies using AI-powered semantic search */}
                  Find Yalies using semantic search
                </p>
              </motion.div>

              {/* Search Bar with integrated filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <SearchBar 
                  onSearch={handleSearch} 
                  isLoading={isLoading}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </motion.div>

              {/* TRENDING SEARCHES - TEMPORARILY COMMENTED OUT
              {!hasSearched && (
                <TrendingSearches 
                  onSearchClick={handleSearch}
                  disabled={isLoading}
                />
              )}
              */}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </section>

          {/* Similar To Banner */}
          {similarTo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto px-4 mb-4"
            >
              <div className="flex items-center justify-between p-3 bg-yale-blue/10 border border-yale-blue/20 rounded-xl">
                <span className="text-white/70 text-sm">
                  Showing people similar to <span className="text-yale-blue-light font-semibold">{similarTo.name}</span>
                </span>
                <button
                  onClick={() => {
                    setSimilarTo(null);
                    setResults([]);
                    setHasSearched(false);
                  }}
                  className="text-white/50 hover:text-white text-sm"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}

          {/* Results Section */}
          {hasSearched && (
            <section className="pb-20">
              <ResultsGrid 
                results={results} 
                query={query} 
                isLoading={isLoading}
                similarTo={similarTo}
                searchType={searchType}
                onFindSimilar={handleFindSimilar}
              />
            </section>
          )}
        </>
      )}

      {/* LEADERBOARD VIEW - TEMPORARILY COMMENTED OUT
      {activeView === 'leaderboard' && (
        <section className="relative pt-32 pb-20 px-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-yale-blue/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yale-blue-light/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            <LeaderboardFullView />
          </div>
        </section>
      )}
      */}

      {/* Footer */}
      <footer className="py-8 text-center text-white/30 text-sm">
        <p>
          {/* Powered by CLIP embeddings • Built with Next.js & FastAPI */}
          Built with Next.js & FastAPI
        </p>
      </footer>
    </main>
  );
}
