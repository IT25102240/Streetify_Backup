import { tabStorage } from '../utils/storage';

export const API_BASE_URL = 'http://localhost:8080/api';

/**
 * A wrapper around the standard fetch API that automatically adds the JWT token
 * and sets default headers like Content-Type.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tabStorage.getItem('jwt_token');

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle unauthorized/expired token
  if (response.status === 401) {
    const isMockToken = token && token.startsWith("mock-jwt-");
    if (!isMockToken) {
      tabStorage.removeItem('jwt_token');
      window.dispatchEvent(new Event('auth-expired'));
    }
  }

  // Parse response body safely
  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = response.statusText || 'An error occurred';
    if (responseText) {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || responseText;
      } catch {
        errorMessage = responseText;
      }
    }
    throw new Error(errorMessage);
  }

  // If response is empty or 204 No Content, return null instead of trying to parse JSON
  if (response.status === 204 || !responseText || response.headers.get('content-length') === '0') {
    return null as any;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText as any;
  }
}
