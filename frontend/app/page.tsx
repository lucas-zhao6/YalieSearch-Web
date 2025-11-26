'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import ResultsGrid from '@/components/ResultsGrid';
import WelcomeModal from '@/components/WelcomeModal';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/auth';

interface SearchResult {
  id: string;
  first_name: string;
  last_name: string;
  image: string | null;
  college: string | null;
  year: number | null;
  major: string | null;
  score: number;
}

export default function Home() {
  const { user, loading, login, logout } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      const token = getAuthToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(
        `${apiUrl}/api/search?q=${encodeURIComponent(searchQuery)}&k=20`,
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
        // Content moderation blocked the query
        const errorData = await response.json();
        setError(errorData.detail || 'This search query violates our content policy. Please try a different search.');
        setResults([]);
        return;
      }
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
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
              AI-powered semantic search for Yalies
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
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-bold gradient-text">
              Yalie Search
            </h1>
          </div>
          <div className="flex items-center gap-4">
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4">
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
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12">
              Find Yalies using AI-powered semantic search
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </motion.div>

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

      {/* Results Section */}
      {hasSearched && (
        <section className="pb-20">
          <ResultsGrid results={results} query={query} isLoading={isLoading} />
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-white/30 text-sm">
        <p>
          Powered by CLIP embeddings • Built with Next.js & FastAPI
        </p>
      </footer>
    </main>
  );
}
