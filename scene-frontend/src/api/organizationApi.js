import axios from 'axios';

const baseURL = (import.meta.env.VITE_BACKEND_URL || 'https://scene-backend-tv-production.up.railway.app').replace(/\/$/, '');
const TOKEN_KEY = 'scene_org_session';

export const organizationApi = axios.create({ baseURL, timeout: 20000 });
export const getOrganizationToken = () => sessionStorage.getItem(TOKEN_KEY);
export const saveOrganizationToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearOrganizationToken = () => sessionStorage.removeItem(TOKEN_KEY);

organizationApi.interceptors.request.use((config) => {
  const token = getOrganizationToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
