'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user opted out of seeing the welcome message
    const hasOptedOut = localStorage.getItem('hideWelcomeModal');
    if (!hasOptedOut) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideWelcomeModal', 'true');
    }
    setIsOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 bg-arc-slate/30 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto glass-solid rounded-3xl p-8 shadow-glass-lg"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-arc-teal to-arc-teal-dark flex items-center justify-center shadow-button">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-display font-bold gradient-text mb-2">
                Welcome to Yalie Search
              </h2>
            </div>

            {/* Content */}
            <div className="space-y-6 text-arc-slate-light">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-arc-slate flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-arc-teal/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-arc-teal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Important Guidelines
                </h3>

                <ul className="space-y-3 ml-8">
                  <li className="flex items-start gap-3">
                    <span className="text-arc-teal font-semibold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-arc-slate">Usage Policy:</span> This tool is built for educational and social purposes. 
                      Malicious or inappropriate use may result in access restrictions.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-arc-teal font-semibold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-arc-slate">Search Tips:</span> More specific queries yield better results. 
                      Low match percentages do not indicate errors; search relevance considers multiple factors.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-arc-teal font-semibold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-arc-slate">Search History & Analytics:</span> Only minimal, anonymous logs are collected for performance and analytics. 
                      No personally identifiable search history is stored. Users can enable Anonymous Mode to prevent contribution to aggregated analytics.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-arc-teal font-semibold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-arc-slate">Data Privacy:</span> All searches use only directory data accessible to authenticated Yale users. 
                      No data is shared with external parties.
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 space-y-4">
              {/* Checkbox */}
              <div className="flex items-center justify-center gap-2">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-arc-teal/30 bg-white/60 text-arc-teal focus:ring-2 focus:ring-arc-teal/30 cursor-pointer"
                />
                <label
                  htmlFor="dontShowAgain"
                  className="text-sm text-arc-slate-light cursor-pointer select-none"
                >
                  Don&apos;t show this again
                </label>
              </div>

              {/* Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleClose}
                  className="px-8 py-3 btn-primary font-semibold rounded-xl 
                           transition-all duration-300 transform hover:scale-105"
                >
                  Got it, let&apos;s search!
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-arc-slate-muted hover:text-arc-slate transition-colors rounded-lg hover:bg-arc-slate/5"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
