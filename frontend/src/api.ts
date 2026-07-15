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

export default API;
