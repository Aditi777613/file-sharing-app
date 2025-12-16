import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("auth_token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("auth_token");
  }
}

export function initAuthFromStorage() {
  const token = localStorage.getItem("auth_token");
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
  return token;
}



