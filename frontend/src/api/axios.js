import axios from "axios";

/** API origin (NO /api here) */
const RAW_ORIGIN = (process.env.REACT_APP_API_ORIGIN || "http://localhost:8080").trim();
export const API_ORIGIN = RAW_ORIGIN.replace(/\/+$/, "");

/** baseURL will become: https://xxx.onrender.com/api */
export const API_BASE = `${API_ORIGIN}/api`;

const VERBOSE = String(process.env.REACT_APP_API_LOG || "").trim() === "1";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { Accept: "application/json" },
  withCredentials: false,
});

/** Remove empty params */
function compactParams(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== "" && v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

function isPlainJson(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof FormData) &&
    !(value instanceof URLSearchParams) &&
    !(value instanceof Blob) &&
    !(value instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(value)
  );
}

api.interceptors.request.use((config) => {
  if (config.params) config.params = compactParams(config.params);

  if (isPlainJson(config.data)) {
    config.headers["Content-Type"] = "application/json";
  } else {
    delete config.headers["Content-Type"];
  }

  if (VERBOSE) {
    const method = String(config.method || "GET").toUpperCase();
    const url = `${(config.baseURL || "").replace(/\/+$/, "")}/${String(config.url || "").replace(/^\/+/, "")}`;
    console.log(`[API ->] ${method} ${url}`, { params: config.params });
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    if (VERBOSE) {
      const method = String(res.config?.method || "GET").toUpperCase();
      const url = `${(res.config?.baseURL || "").replace(/\/+$/, "")}/${String(res.config?.url || "").replace(/^\/+/, "")}`;
      console.log(`[API <-] ${method} ${url} -> ${res.status}`);
    }
    return res;
  },
  (err) => {
    if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") {
      return Promise.reject(err);
    }

    if (VERBOSE) {
      const cfg = err?.config || {};
      const method = String(cfg.method || "GET").toUpperCase();
      const url = `${(cfg.baseURL || "").replace(/\/+$/, "")}/${String(cfg.url || "").replace(/^\/+/, "")}`;
      const status = err?.response?.status ?? "NO_RESPONSE";
      console.warn(`[API x ] ${method} ${url} -> ${status}`, err?.response?.data || err?.message);
    }

    return Promise.reject(err);
  }
);

export default api;
