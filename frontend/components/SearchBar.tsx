'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getSearchHistory, 
  addToSearchHistory, 
  clearSearchHistory, 
  removeFromHistory,
  formatRelativeTime,
  SearchHistoryItem 
} from '@/lib/searchHistory';

interface Filters {
  college: string | null;
  year: number | null;
  major: string | null;
}

interface FilterOptions {
  colleges: string[];
  years: number[];
  majors: string[];
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function SearchBar({ 
  onSearch, 
  isLoading = false,
  filters,
  onFiltersChange
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    colleges: [],
    years: [],
    majors: []
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/filters`);
        if (response.ok) {
          const data = await response.json();
          setFilterOptions(data);
        }
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      } finally {
        setFilterOptionsLoading(false);
      }
    };
    fetchOptions();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      addToSearchHistory(query.trim());
      setHistory(getSearchHistory());
      onSearch(query.trim());
      setShowHistory(false);
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    addToSearchHistory(historyQuery);
    setHistory(getSearchHistory());
    onSearch(historyQuery);
    setShowHistory(false);
  };

  const handleRemoveHistory = (e: React.MouseEvent, historyQuery: string) => {
    e.stopPropagation();
    removeFromHistory(historyQuery);
    setHistory(getSearchHistory());
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
    setShowHistory(false);
  };

  const activeFilterCount = [
    filters.college, 
    filters.year, 
    filters.major
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onFiltersChange({ college: null, year: null, major: null });
  };

  const suggestions = [
    "Curly red hair and freckles",
    "Timothée Chalamet lookalike",
    "Looks like they give great hugs",
    "Most likely to start a unicorn startup",
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Wrapper for click-outside detection */}
      <div ref={wrapperRef} className="relative">
        {/* Main Search Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => history.length > 0 && setShowHistory(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                  if (e.key === 'Escape') {
                    setShowHistory(false);
                  }
                }}
                placeholder="Describe who you're looking for..."
                disabled={isLoading}
                rows={1}
                className="w-full px-6 py-5 pr-40 text-lg bg-transparent
                           text-white placeholder-white/40
                           focus:outline-none
                           transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed
                           resize-none overflow-hidden
                           min-h-[60px] max-h-[200px]"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           px-6 py-2.5 bg-yale-blue hover:bg-yale-blue-light
                           text-white font-medium rounded-xl
                           transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Filter Toggle - small text centered at bottom */}
          <div className="text-center pb-3 pt-1">
            <button
              type="button"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              disabled={isLoading || filterOptionsLoading}
              className={`text-xs transition-colors inline-flex items-center gap-1 ${
                filtersExpanded || activeFilterCount > 0
                  ? 'text-yale-blue-light'
                  : 'text-white/40 hover:text-white/60'
              } disabled:opacity-50`}
            >
              filters
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-yale-blue/30 rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${filtersExpanded ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Clear all link when filters active */}
            {activeFilterCount > 0 && !filtersExpanded && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-2 text-xs text-white/30 hover:text-red-400 transition-colors"
              >
                clear
              </button>
            )}
          </div>

          {/* Expanded Filter Panel */}
          <AnimatePresence>
            {filtersExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* College Filter */}
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">
                        College
                      </label>
                      <select
                        value={filters.college || ''}
                        onChange={(e) => onFiltersChange({
                          ...filters,
                          college: e.target.value || null
                        })}
                        disabled={isLoading}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                                 text-white text-sm focus:outline-none focus:border-yale-blue-light
                                 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">All Colleges</option>
                        {filterOptions.colleges.map((college) => (
                          <option key={college} value={college}>{college}</option>
                        ))}
                      </select>
                    </div>

                    {/* Year Filter */}
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">
                        Class Year
                      </label>
                      <select
                        value={filters.year || ''}
                        onChange={(e) => onFiltersChange({
                          ...filters,
                          year: e.target.value ? parseInt(e.target.value) : null
                        })}
                        disabled={isLoading}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                                 text-white text-sm focus:outline-none focus:border-yale-blue-light
                                 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">All Years</option>
                        {filterOptions.years.map((year) => (
                          <option key={year} value={year}>Class of {year}</option>
                        ))}
                      </select>
                    </div>

                    {/* Major Filter */}
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">
                        Major
                      </label>
                      <select
                        value={filters.major || ''}
                        onChange={(e) => onFiltersChange({
                          ...filters,
                          major: e.target.value || null
                        })}
                        disabled={isLoading}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                                 text-white text-sm focus:outline-none focus:border-yale-blue-light
                                 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">All Majors</option>
                        {filterOptions.majors.map((major) => (
                          <option key={major} value={major}>{major}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Clear All in expanded view */}
                  {activeFilterCount > 0 && (
                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="text-xs text-white/40 hover:text-red-400 transition-colors"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filter Pills (shown when collapsed) */}
          {!filtersExpanded && activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap gap-2 px-4 pb-3 justify-center"
            >
              {filters.college && (
                <span className="px-2.5 py-1 text-xs bg-yale-blue/20 text-yale-blue-light 
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
                <span className="px-2.5 py-1 text-xs bg-yale-blue/20 text-yale-blue-light 
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
                <span className="px-2.5 py-1 text-xs bg-yale-blue/20 text-yale-blue-light 
                               rounded-full inline-flex items-center gap-1 max-w-[180px] truncate">
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

        {/* Search History Dropdown - Outside the card, below everything */}
        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 py-2 bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Recent Searches</span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs text-white/40 hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              </div>
              
              {history.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleHistoryClick(item.query)}
                  className="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white/80 truncate">{item.query}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-white/30">{formatRelativeTime(item.timestamp)}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveHistory(e, item.query)}
                      className="p-1 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestion chips */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-2 mt-4 justify-center"
      >
        <span className="text-white/40 text-sm">Try:</span>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => {
              setQuery(suggestion);
              addToSearchHistory(suggestion);
              setHistory(getSearchHistory());
              onSearch(suggestion);
            }}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 
                       text-white/60 hover:text-white
                       border border-white/10 rounded-full
                       transition-all duration-200
                       disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </motion.div>
    </div>
  );
}
