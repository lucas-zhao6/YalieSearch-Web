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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto glass rounded-2xl p-8 shadow-2xl"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-display font-bold gradient-text mb-2">
                Welcome to Yalie Search
              </h2>
              <p className="text-white/70 text-lg">
                AI-powered semantic search for the Yale community
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6 text-white/80">
              <p className="text-white/90 leading-relaxed">
                This tool uses AI-powered semantic search to help you find Yale students 
                by describing them in natural language.
              </p>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-yale-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Important Guidelines
                </h3>

                <ul className="space-y-3 ml-7">
                  <li className="flex items-start gap-3">
                    <span className="text-yale-blue-light font-semibold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-white">Usage Policy:</span> This application is built for educational and social purposes. 
                      Any malicious, defamatory, or inappropriate prompts will be monitored and 
                      may result in access restrictions.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-yale-blue-light font-semibold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-white">Search Tips:</span> More specific and detailed descriptions yield better results. 
                      Lower match percentages don't necessarily indicate poor matches—our AI 
                      considers many factors beyond simple similarity scores.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-yale-blue-light font-semibold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-white">AI Limitations:</span> This system uses machine learning and may occasionally 
                      produce inaccurate results. We are not responsible for misidentifications 
                      or misclassifications in search results.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-yale-blue-light font-semibold flex-shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-white">Privacy:</span> All searches are processed securely. No search data is stored 
                      or shared with third parties.
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
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-yale-blue focus:ring-2 focus:ring-yale-blue-light cursor-pointer"
                />
                <label
                  htmlFor="dontShowAgain"
                  className="text-sm text-white/70 cursor-pointer select-none"
                >
                  Don't show this again
                </label>
              </div>

              {/* Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-yale-blue hover:bg-yale-blue-light text-white font-semibold rounded-xl 
                           transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Got it, let's search!
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white/80 transition-colors"
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

