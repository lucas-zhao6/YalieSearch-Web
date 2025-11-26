/**
 * Authentication utilities for Yale CAS
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  netid: string;
  authenticated: boolean;
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Set auth token in localStorage
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Remove auth token from localStorage
 */
export function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
}

/**
 * Get current user from API
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      clearAuthToken();
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Get CAS login URL from backend
 */
export async function getLoginUrl(): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/login`);
  const data = await response.json();
  return data.login_url;
}

/**
 * Get CAS logout URL from backend
 */
export async function getLogoutUrl(): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/logout`);
  const data = await response.json();
  return data.logout_url;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  clearAuthToken();
  const logoutUrl = await getLogoutUrl();
  window.location.href = logoutUrl;
}

