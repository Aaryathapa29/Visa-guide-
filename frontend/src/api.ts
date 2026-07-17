import axios from "axios";

// Normalize the backend base URL so that requests are sent to the API root
let base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
if (!base.endsWith("/")) base = base + "/";
// Ensure we point to the API namespace. If the user provided a URL that already
// includes '/api', do not append it again.
if (!/\/api\/?$/.test(base) && !/\/api\//.test(base)) {
  base = base.replace(/\/+$/, "") + "/api/";
}

const API = axios.create({
  baseURL: base,
});

function getStoredToken() {
  if (typeof window === "undefined") return "";

  const candidates = [
    window.localStorage.getItem("accessToken"),
    window.localStorage.getItem("access_token"),
    window.sessionStorage.getItem("accessToken"),
    window.sessionStorage.getItem("access_token"),
  ];

  return candidates.find((value) => Boolean(value)) || "";
}

function isPublicEndpoint(url: string = "") {
  const normalized = url.split("?")[0].replace(/^\/+/, "").toLowerCase();
  const publicSegments = ["login", "signup", "register", "password-reset", "check-email"];

  return publicSegments.some((segment) => normalized.includes(segment));
}

API.interceptors.request.use((config) => {
  const requestUrl = typeof config.url === "string" ? config.url : "";

  if (!isPublicEndpoint(requestUrl)) {
    const token = getStoredToken();
    if (token) {
      if (typeof config.headers?.set === "function") {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        };
      }
    }
  }

  return config;
});

export default API;
