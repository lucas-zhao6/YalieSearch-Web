'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const suggestions = [
    "Curly red hair and freckles",
    "Timothée Chalamet lookalike",
    "Looks like they give great hugs",
    "Most likely to start a unicorn startup",
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Describe who you're looking for..."
            disabled={isLoading}
            rows={1}
            className="w-full px-6 py-5 pr-40 text-lg bg-white/5 border border-white/10 rounded-2xl 
                       text-white placeholder-white/40
                       focus:outline-none focus:border-yale-blue-light focus:ring-2 focus:ring-yale-blue-light/20
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

