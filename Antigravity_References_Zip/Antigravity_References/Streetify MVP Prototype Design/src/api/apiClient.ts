export const API_BASE_URL = 'http://localhost:8080/api';

/**
 * A wrapper around the standard fetch API that automatically adds the JWT token
 * and sets default headers like Content-Type.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('jwt_token');

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
    localStorage.removeItem('jwt_token');
    window.dispatchEvent(new Event('auth-expired'));
  }

  // Parse JSON or throw error
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // Not JSON
      errorMessage = await response.text() || response.statusText;
    }
    throw new Error(errorMessage);
  }

  // If response is empty or 204 No Content, return null instead of trying to parse JSON
  if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null as any;
  }

  return response.json();
}
