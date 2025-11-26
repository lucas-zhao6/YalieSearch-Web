'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    email: string | null;
    score: number;
  };
  index: number;
  searchType?: 'text' | 'similar';
  onFindSimilar?: (personId: string) => void;
}

export default function ResultCard({ result, index, searchType = 'text', onFindSimilar }: ResultCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const name = `${result.first_name} ${result.last_name}`.trim() || 'Unknown';
  
  const handleCopyEmail = async () => {
    if (!result.email) return;
    
    try {
      await navigator.clipboard.writeText(result.email);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };
  
  // Rescale similarity scores to user-friendly percentage (60-100%)
  // Text search: raw scores typically 0.10-0.28
  // Similar search: raw scores typically 0.70-0.95
  let rescaledScore: number;
  if (searchType === 'similar') {
    // Face-to-face similarity: higher raw scores
    rescaledScore = ((result.score - 0.70) / (0.95 - 0.70)) * (100 - 60) + 60;
  } else {
    // Text-to-image similarity: lower raw scores
    rescaledScore = ((result.score - 0.10) / (0.28 - 0.10)) * (100 - 60) + 60;
  }
  const similarity = Math.round(Math.min(100, Math.max(60, rescaledScore)));

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

      {/* Thumbnail with lazy loading */}
      <div className="relative w-24 h-32 flex-shrink-0 rounded-xl overflow-hidden">
        {/* Skeleton loader */}
        {!imageLoaded && !imageError && result.image && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 animate-pulse" />
        )}
        
        {result.image && !imageError ? (
          <Image
            src={result.image}
            alt={name}
            fill
            loading="lazy"
            className={`object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="96px"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
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

        {/* Similarity badge and Find Similar button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1
            ${similarity >= 85 ? 'bg-green-500/20 text-green-300' : similarity >= 75 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/10 text-white/60'}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {similarity}% match
          </div>
          
          {onFindSimilar && (
            <button
              onClick={() => onFindSimilar(result.id)}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 hover:bg-yale-blue/30 
                       text-white/60 hover:text-white border border-white/10 hover:border-yale-blue/50
                       transition-all duration-200 inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Find Similar
            </button>
          )}
          
          {result.email && (
            <button
              onClick={handleCopyEmail}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 hover:bg-yale-blue/30 
                       text-white/60 hover:text-white border border-white/10 hover:border-yale-blue/50
                       transition-all duration-200 inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact
            </button>
          )}
        </div>
      </div>

      {/* Hover effect border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-yale-blue-light/30 transition-colors duration-300 pointer-events-none" />
      
      {/* Toast notification */}
      <AnimatePresence>
        {showCopiedToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 
                     px-6 py-3 bg-yale-blue/90 backdrop-blur-lg rounded-xl shadow-2xl
                     border border-yale-blue-light/50"
          >
            <div className="flex items-center gap-2 text-white font-medium">
              <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Email copied to clipboard!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
