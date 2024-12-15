import axios from 'axios';
import { CONFIG } from 'src/config-global';

const axiosInstance = axios.create({
  baseURL: CONFIG.site.apiBaseURL,
});

console.log("BASE URL: ", CONFIG.site.apiBaseURL);

let accessToken = null;

const getAccessToken = async () => {
  if (accessToken) {
    return accessToken;
  }

  try {
    const response = await fetch('/api/auth/token');
    const data = await response.json();
    accessToken = data.accessToken;
    return accessToken;
  } catch (error) {
    console.error('Failed to fetch token:', error);
    return null;
  }
};

axiosInstance.interceptors.request.use(
  async (config) => {
    console.log('Request interceptor running');
    config.baseURL = CONFIG.site.apiBaseURL;
    const token = await getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Set Authorization header');
    } else {
      console.log('No access token available');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Received 401, clearing token');
      accessToken = null;
      // Redirect to home page
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

export { getAccessToken };

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

export const createAuthenticatedWebSocket = async (url) => {
    const token = await getAccessToken();
    const wsProtocol = CONFIG.site.apiBaseURL.startsWith('https') ? 'wss://' : 'ws://';
    const apiUrlWithoutProtocol = CONFIG.site.apiBaseURL.replace(/^https?:\/\//, '').replace(/^http?:\/\//, '');
    const fullUrl = new URL(url, `${wsProtocol}${apiUrlWithoutProtocol}`);
    const encoded_token = encodeURIComponent(token);
    // Append the token as a query parameter
    fullUrl.searchParams.append('token', encoded_token);
    return new WebSocket(fullUrl.toString());
};
