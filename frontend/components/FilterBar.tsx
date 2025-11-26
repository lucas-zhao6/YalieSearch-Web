'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthToken } from '@/lib/auth';

interface FilterOptions {
  colleges: string[];
  years: number[];
  majors: string[];
}

interface Filters {
  college: string | null;
  year: number | null;
  major: string | null;
}

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  disabled?: boolean;
}

export default function FilterBar({ 
  filters, 
  onFiltersChange, 
  disabled = false 
}: FilterBarProps) {
  const [options, setOptions] = useState<FilterOptions>({
    colleges: [],
    years: [],
    majors: []
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/filters`);
        if (response.ok) {
          const data = await response.json();
          setOptions(data);
        }
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const activeFilterCount = [
    filters.college, 
    filters.year, 
    filters.major
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onFiltersChange({ college: null, year: null, major: null });
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-4">
        <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 inline-flex items-center gap-2 ${
            isExpanded || activeFilterCount > 0
              ? 'bg-yale-blue/20 text-yale-blue-light border border-yale-blue/30'
              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-yale-blue rounded-full">
              {activeFilterCount}
            </span>
          )}
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Clear All Button */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            disabled={disabled}
            className="px-3 py-2 text-sm text-white/50 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* College Filter */}
                <div>
                  <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">
                    College
                  </label>
                  <select
                    value={filters.college || ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      college: e.target.value || null
                    })}
                    disabled={disabled}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                             text-white text-sm focus:outline-none focus:border-yale-blue-light
                             disabled:opacity-50"
                  >
                    <option value="">All Colleges</option>
                    {options.colleges.map((college) => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">
                    Class Year
                  </label>
                  <select
                    value={filters.year || ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      year: e.target.value ? parseInt(e.target.value) : null
                    })}
                    disabled={disabled}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                             text-white text-sm focus:outline-none focus:border-yale-blue-light
                             disabled:opacity-50"
                  >
                    <option value="">All Years</option>
                    {options.years.map((year) => (
                      <option key={year} value={year}>Class of {year}</option>
                    ))}
                  </select>
                </div>

                {/* Major Filter */}
                <div>
                  <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">
                    Major
                  </label>
                  <select
                    value={filters.major || ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      major: e.target.value || null
                    })}
                    disabled={disabled}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                             text-white text-sm focus:outline-none focus:border-yale-blue-light
                             disabled:opacity-50"
                  >
                    <option value="">All Majors</option>
                    {options.majors.map((major) => (
                      <option key={major} value={major}>{major}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Pills (shown when collapsed) */}
      {!isExpanded && activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 mt-3 justify-center"
        >
          {filters.college && (
            <span className="px-3 py-1 text-xs bg-yale-blue/20 text-yale-blue-light 
                           rounded-full inline-flex items-center gap-1">
              {filters.college}
              <button 
                onClick={() => onFiltersChange({ ...filters, college: null })}
                className="hover:text-white"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.year && (
            <span className="px-3 py-1 text-xs bg-yale-blue/20 text-yale-blue-light 
                           rounded-full inline-flex items-center gap-1">
              Class of {filters.year}
              <button 
                onClick={() => onFiltersChange({ ...filters, year: null })}
                className="hover:text-white"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.major && (
            <span className="px-3 py-1 text-xs bg-yale-blue/20 text-yale-blue-light 
                           rounded-full inline-flex items-center gap-1 max-w-[200px] truncate">
              {filters.major}
              <button 
                onClick={() => onFiltersChange({ ...filters, major: null })}
                className="hover:text-white flex-shrink-0"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}

