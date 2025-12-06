'use client';

import { motion } from 'framer-motion';
import ResultCard from './ResultCard';

interface Result {
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

interface ResultsGridProps {
  results: Result[];
  query: string;
  isLoading?: boolean;
  similarTo?: { name: string; id: string } | null;
  searchType?: 'text' | 'similar';
  onFindSimilar?: (personId: string) => void;
}

export default function ResultsGrid({ 
  results, 
  query, 
  isLoading,
  similarTo,
  searchType = 'text',
  onFindSimilar 
}: ResultsGridProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl glass-subtle shimmer"
            />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0 && (query || similarTo)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-arc-mint/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-arc-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl text-arc-slate mb-2">No results found</h3>
        <p className="text-arc-slate-muted">Try a different description</p>
      </motion.div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 flex items-center justify-between"
      >
        {similarTo ? (
          <h2 className="text-arc-slate-light text-sm">
            Found <span className="text-arc-slate font-semibold">{results.length}</span> people similar to{' '}
            <span className="text-arc-teal">{similarTo.name}</span>
          </h2>
        ) : (
          <h2 className="text-arc-slate-light text-sm">
            Found <span className="text-arc-slate font-semibold">{results.length}</span> matches for{' '}
            <span className="text-arc-teal">&quot;{query}&quot;</span>
          </h2>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result, index) => (
          <ResultCard 
            key={result.id || index} 
            result={result} 
            index={index}
            searchType={searchType}
            onFindSimilar={onFindSimilar}
          />
        ))}
      </div>
    </div>
  );
}
