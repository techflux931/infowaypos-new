// src/api/axios.js
import axios from "axios";

/** ---------- API origin/base ---------- */
const RAW_ORIGIN = (process.env.REACT_APP_API_ORIGIN || "http://localhost:8080").trim();
export const API_ORIGIN = RAW_ORIGIN.replace(/\/+$/, "");
export const API_BASE = `${API_ORIGIN}/api`;

const VERBOSE = String(process.env.REACT_APP_API_LOG || "").trim() === "1";

/** ---------- Instance ---------- */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { Accept: "application/json" },
  withCredentials: false, // set to true only if your backend uses cookies/sessions
});

/** Strip empty query params: "", null, undefined */
function compactParams(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== "" && v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

/** Is a plain JSON object (not FormData, Blob, ArrayBuffer, etc.) */
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

/** ---------- Request interceptor ---------- */
api.interceptors.request.use((config) => {
  // Clean query params
  if (config.params) config.params = compactParams(config.params);

  // Set Content-Type only for plain JSON
  if (isPlainJson(config.data)) {
    config.headers["Content-Type"] = "application/json";
  } else {
    // Let the browser/axios set correct multipart/boundary/etc.
    delete config.headers["Content-Type"];
  }

  if (VERBOSE) {
    const method = String(config.method || "GET").toUpperCase();
    const base = (config.baseURL || "").replace(/\/+$/, "");
    const path = String(config.url || "").replace(/^\/+/, "");
    // eslint-disable-next-line no-console
    console.log(`[API ->] ${method} ${base}/${path}`, { params: config.params });
  }

  return config;
});

/** ---------- Response interceptor ---------- */
api.interceptors.response.use(
  (res) => {
    if (VERBOSE) {
      const { config } = res || {};
      const method = String(config?.method || "GET").toUpperCase();
      const base = (config?.baseURL || "").replace(/\/+$/, "");
      const path = String(config?.url || "").replace(/^\/+/, "");
      // eslint-disable-next-line no-console
      console.log(`[API <-] ${method} ${base}/${path} -> ${res.status}`);
    }
    return res;
  },
  (err) => {
    // Ignore cancels quietly
    if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED") {
      return Promise.reject(err);
    }

    if (VERBOSE) {
      const cfg = err?.config || {};
      const method = String(cfg.method || "GET").toUpperCase();
      const base = (cfg.baseURL || "").replace(/\/+$/, "");
      const path = String(cfg.url || "").replace(/^\/+/, "");
      const status = err?.response?.status ?? "NO_RESPONSE";
      // eslint-disable-next-line no-console
      console.warn(`[API x ] ${method} ${base}/${path} -> ${status}`, err?.response?.data || err?.message);
    }

    return Promise.reject(err);
  }
);

export default api;
