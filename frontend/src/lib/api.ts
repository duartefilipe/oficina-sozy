import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user_id");
      localStorage.removeItem("auth_user_nome");
      localStorage.removeItem("auth_username");
      localStorage.removeItem("auth_user_role");
      localStorage.removeItem("auth_oficina_id");
      localStorage.removeItem("auth_oficina_nome");
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);
