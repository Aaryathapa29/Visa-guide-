import axios from 'axios';

let base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
if (!base.endsWith('/')) base = `${base}/`;
if (!/\/api\/?$/.test(base) && !/\/api\//.test(base)) {
  base = base.replace(/\/+$/, '') + '/api/';
}

const apiClient = axios.create({
  baseURL: base,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getStoredToken() {
  if (typeof window === 'undefined') return '';

  const candidates = [
    window.localStorage.getItem('accessToken'),
    window.localStorage.getItem('access_token'),
    window.localStorage.getItem('token'),
    window.sessionStorage.getItem('accessToken'),
    window.sessionStorage.getItem('access_token'),
    window.sessionStorage.getItem('token'),
  ];
  return candidates.find((value) => Boolean(value)) || '';
}

apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] Token expired or invalid. Clearing session...');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('accessToken');
        window.localStorage.removeItem('access_token');
        window.localStorage.removeItem('token');
        window.sessionStorage.removeItem('accessToken');
        window.sessionStorage.removeItem('access_token');
        window.sessionStorage.removeItem('token');
        const targetPath = window.location.pathname === '/login' ? '/?preview=consultancy' : '/';
        if (window.location.pathname !== targetPath) {
          window.location.href = targetPath;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
