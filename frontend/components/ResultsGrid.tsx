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
  score: number;
}

interface ResultsGridProps {
  results: Result[];
  query: string;
  isLoading?: boolean;
}

export default function ResultsGrid({ results, query, isLoading }: ResultsGridProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl glass shimmer"
            />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl text-white/80 mb-2">No results found</h3>
        <p className="text-white/50">Try a different description</p>
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
        <h2 className="text-white/60 text-sm">
          Found <span className="text-white font-semibold">{results.length}</span> matches for{' '}
          <span className="text-yale-blue-light">&quot;{query}&quot;</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result, index) => (
          <ResultCard key={result.id || index} result={result} index={index} />
        ))}
      </div>
    </div>
  );
}

