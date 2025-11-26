/**
 * Search History utilities using localStorage
 */

const HISTORY_KEY = 'yalie_search_history';
const MAX_HISTORY_ITEMS = 20;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

/**
 * Check if anonymous mode is enabled
 */
export function isAnonymousMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('anonymous_mode') === 'true';
}

/**
 * Set anonymous mode
 */
export function setAnonymousMode(enabled: boolean): void {
  localStorage.setItem('anonymous_mode', enabled ? 'true' : 'false');
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * Add a search query to history
 */
export function addToSearchHistory(query: string): void {
  if (typeof window === 'undefined') return;
  
  // Don't save if anonymous mode is enabled
  if (isAnonymousMode()) return;
  
  // Don't save empty queries
  if (!query.trim()) return;
  
  const history = getSearchHistory();
  
  // Remove duplicate if exists
  const filteredHistory = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
  
  // Add new item at the beginning
  const newItem: SearchHistoryItem = {
    query: query.trim(),
    timestamp: Date.now()
  };
  
  // Keep only the most recent items
  const updatedHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * Remove a specific item from history
 */
export function removeFromHistory(query: string): void {
  if (typeof window === 'undefined') return;
  
  const history = getSearchHistory();
  const filteredHistory = history.filter(item => item.query !== query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

