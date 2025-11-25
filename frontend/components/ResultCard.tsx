'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ResultCardProps {
  result: {
    id: string;
    first_name: string;
    last_name: string;
    image: string | null;
    college: string | null;
    year: number | null;
    major: string | null;
    score: number;
  };
  index: number;
}

export default function ResultCard({ result, index }: ResultCardProps) {
  const name = `${result.first_name} ${result.last_name}`.trim() || 'Unknown';
  const similarity = Math.round(result.score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl glass hover:border-yale-blue-light/50 transition-all duration-300 flex gap-4 p-4"
    >
      {/* Rank badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="w-7 h-7 rounded-full bg-yale-blue/90 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xs">
          #{index + 1}
        </div>
      </div>

      {/* Thumbnail */}
      <div className="relative w-24 h-32 flex-shrink-0 rounded-xl overflow-hidden">
        {result.image ? (
          <Image
            src={result.image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-yale-blue/20 to-yale-blue-dark/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-white/20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Name */}
        <h3 className="text-white font-display text-lg md:text-xl font-semibold mb-1 truncate">
          {name}
        </h3>

        {/* Details */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {result.college && (
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-white/80 text-xs">
              {result.college}
            </span>
          )}
          {result.year && (
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-white/80 text-xs">
              Class of {result.year}
            </span>
          )}
        </div>

        {/* Major */}
        {result.major && (
          <p className="text-white/60 text-sm mb-2 truncate">
            {result.major}
          </p>
        )}

        {/* Similarity badge */}
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1
            ${similarity >= 25 ? 'bg-green-500/20 text-green-300' : similarity >= 20 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/10 text-white/60'}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {similarity}% match
          </div>
        </div>
      </div>

      {/* Hover effect border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-yale-blue-light/30 transition-colors duration-300 pointer-events-none" />
    </motion.div>
  );
}
