// src/components/VendorList.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./VendorList.css";

const FORM_ROUTE = "/total-purchase/vendor";
const BACK_ROUTE = "/total-purchase";
const DEFAULT_SORT = { by: "createdAt", dir: "asc" };

/* -------------------- utils -------------------- */
function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function dedupeById(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).filter((v) => {
    const id = v?.id ?? v?._id ?? v?.code;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function normalizeForSort(val) {
  if (val == null) return "";
  if (typeof val === "number") return val;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "string") {
    const t = Date.parse(val);
    if (!Number.isNaN(t)) return t;
    if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
    return val.toLowerCase();
  }
  if (val instanceof Date) return +val;
  return String(val).toLowerCase();
}

const nz = (v, dash = "-") => {
  const s = typeof v === "string" ? v.trim() : v;
  return s == null || s === "" ? dash : s;
};

/* ---- getters so cells are never blank ---- */
function getCode(v) {
  return nz(v?.code ?? v?.vendorCode ?? v?._id ?? v?.id);
}

function getVendorName(v) {
  const name =
    v?.name ??
    v?.vendorName ??
    v?.displayName ??
    v?.vendor ??
    v?.companyName ??
    v?.company ??
    v?.supplierName ??
    v?.partyName ??
    v?.vendor?.name ??
    v?.company?.name ??
    v?.party?.name ??
    v?.supplier?.name;

  if (name && String(name).trim()) return String(name).trim();

  // last resort: take a primary contact name
  return (
    v?.contactPerson ||
    v?.contacts?.find?.((c) => c?.isPrimary || c?.primary)?.name ||
    v?.contacts?.[0]?.name ||
    "-"
  );
}

function getContact(v) {
  if (v?.contactPerson) return nz(v.contactPerson);
  const fromPrimary =
    v?.contacts?.find?.((c) => c?.isPrimary || c?.primary)?.name ??
    v?.contacts?.[0]?.name;
  return nz(fromPrimary);
}

function getEmail(v) {
  const email =
    v?.email ??
    v?.emails?.[0] ??
    v?.contactEmail ??
    v?.contacts?.find?.((c) => c?.isPrimary || c?.primary)?.email ??
    v?.contacts?.[0]?.email;
  return nz(email);
}

function getPhone(v) {
  const phone =
    v?.phone ??
    v?.mobile ??
    v?.phones?.[0] ??
    v?.contacts?.find?.((c) => c?.isPrimary || c?.primary)?.phone ??
    v?.contacts?.[0]?.phone;
  return nz(phone);
}

function isActive(v) {
  return v?.active !== false;
}

function orderContent(content, sortBy, dir) {
  if (!Array.isArray(content) || !content.length) return [];
  const factor = dir === "desc" ? -1 : 1;

  const key = (o) => {
    if (sortBy === "name" || sortBy === "vendor" || sortBy === "vendorName")
      return getVendorName(o);
    if (sortBy === "contactPerson") return getContact(o);
    if (sortBy === "email") return getEmail(o);
    if (sortBy === "phone") return getPhone(o);
    if (sortBy === "active") return isActive(o) ? 1 : 0;

    return (
      o?.[sortBy] ??
      (sortBy === "createdAt" ? o?.created_at ?? o?.createdOn : undefined) ??
      o?.id ??
      o?._id ??
      o?.code ??
      o?.name ??
      ""
    );
  };

  return [...content].sort((a, b) => {
    const A = normalizeForSort(key(a));
    const B = normalizeForSort(key(b));
    if (A < B) return -1 * factor;
    if (A > B) return 1 * factor;
    const ta = normalizeForSort(a?.id ?? a?._id ?? a?.code ?? "");
    const tb = normalizeForSort(b?.id ?? b?._id ?? b?.code ?? "");
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
}

/* -------------------- component -------------------- */
export default function VendorList() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const abortRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [query, setQuery] = useState("");
  const debouncedQ = useDebounced(query);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [{ by: sortBy, dir }, setSort] = useState(DEFAULT_SORT);
  const [refreshKey, setRefreshKey] = useState(0);

  const params = useMemo(
    () => ({
      q: debouncedQ || undefined,
      page,
      size,
      sortBy,
      dir,
      sort: `${sortBy},${dir}`,
    }),
    [debouncedQ, page, size, sortBy, dir]
  );

  const fetchVendors = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/vendors", { params, signal });
        const contentRaw = Array.isArray(data) ? data : data?.content ?? [];
        const content = orderContent(dedupeById(contentRaw), sortBy, dir);
        setRows(content);
        setTotalPages(
          Number.isFinite(data?.totalPages) ? data.totalPages : content.length ? 1 : 0
        );
        setTotalElements(
          Number.isFinite(data?.totalElements) ? data.totalElements : content.length
        );
      } catch (e) {
        if (e.name !== "CanceledError" && e.code !== "ERR_CANCELED") {
          setError(e?.response?.data?.message || e.message || "Failed to fetch vendors");
        }
      } finally {
        setLoading(false);
      }
    },
    [params, sortBy, dir]
  );

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    fetchVendors(ac.signal);
    return () => ac.abort();
  }, [fetchVendors, refreshKey]);

  // reflect add/update coming back from form
  useEffect(() => {
    if (state?.justAdded) {
      setRefreshKey((k) => k + 1);
      window.history.replaceState({}, document.title);
      return;
    }
    if (state?.justUpdated) {
      const u = state.justUpdated;
      const uid = u?.id ?? u?._id ?? u?.code;
      setRows((prev) =>
        orderContent(
          dedupeById(
            prev.map((r) => ((r?.id ?? r?._id ?? r?.code) === uid ? { ...r, ...u } : r))
          ),
          sortBy,
          dir
        )
      );
      window.history.replaceState({}, document.title);
    }
  }, [state, sortBy, dir]);

  const onSort = (col) => {
    setPage(0);
    setSort((s) =>
      s.by === col ? { by: col, dir: s.dir === "asc" ? "desc" : "asc" } : { by: col, dir: "asc" }
    );
  };

  const reload = () => setRefreshKey((k) => k + 1);
  const goAdd = () => navigate(FORM_ROUTE);
  const goEdit = (row) => navigate(FORM_ROUTE, { state: { edit: row } });
  const goBack = () => navigate(BACK_ROUTE);

  const toggleActive = async (row) => {
    const id = row?.id ?? row?._id;
    if (!id) return;
    const newVal = !(row.active !== false);

    const apply = (val) =>
      setRows((r) => r.map((x) => ((x?.id ?? x?._id) === id ? { ...x, active: val } : x)));

    apply(newVal);
    try {
      await api.patch(`/vendors/${id}/active`, null, { params: { value: newVal } });
    } catch {
      try {
        await api.put(`/vendors/${id}`, { ...row, active: newVal });
      } catch (putErr) {
        apply(!newVal);
        alert(putErr?.response?.data?.message || putErr?.message || "Failed to update status");
      }
    }
  };

  const removeVendor = async (row) => {
    const id = row?.id ?? row?._id;
    if (!id) return;
    if (!window.confirm(`Delete vendor "${getVendorName(row)}" (${getCode(row)})? This cannot be undone.`))
      return;

    const prev = rows;
    setRows((r) => r.filter((x) => (x?.id ?? x?._id) !== id));
    setTotalElements((n) => Math.max(0, n - 1));
    try {
      await api.delete(`/vendors/${id}`);
    } catch (e) {
      setRows(prev);
      setTotalElements(prev.length);
      alert(e?.response?.data?.message || e.message || "Failed to delete vendor");
    }
  };

  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  const visibleRows = useMemo(() => rows.slice(0, size), [rows, size]);
  const rowsForHeight = Math.max(1, Math.min(size, visibleRows.length || 0));

  return (
    <div className="vl-wrap">
      <div className="vl-topbar">
        <h2 className="vl-title">Vendors</h2>

        <div className="vl-tools">
          <input
            className="vl-search"
            placeholder="Search by name or code…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            aria-label="Search vendors"
          />
          <select
            className="vl-pagesize"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            aria-label="Rows per page"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
          <button className="vl-btn ghost" onClick={reload} title="Reload list">
            Reload
          </button>
          <button className="vl-btn-primary" onClick={goAdd}>
            + Add New Vendor
          </button>
        </div>

        <button className="vl-close" onClick={goBack} title="Close list and go back" aria-label="Close">
          ×
        </button>
      </div>

      <div className="vl-card">
        {loading && <div className="vl-info">Loading vendors…</div>}
        {error && !loading && <div className="vl-error">Error: {error}</div>}

        {!loading && !error && (
          <>
            <div className="vl-table-container" style={{ "--rows": rowsForHeight }}>
              <table className="vl-table">
                <thead>
                  <tr>
                    <Th label="Code" col="code" sortBy={sortBy} dir={dir} onSort={onSort} />
                    <Th label="Vendor" col="name" sortBy={sortBy} dir={dir} onSort={onSort} />
                    <Th label="Contact" col="contactPerson" sortBy={sortBy} dir={dir} onSort={onSort} />
                    <Th label="Email" col="email" sortBy={sortBy} dir={dir} onSort={onSort} />
                    <Th label="Phone" col="phone" sortBy={sortBy} dir={dir} onSort={onSort} />
                    <Th label="Status" col="active" sortBy={sortBy} dir={dir} onSort={onSort} />
                    <th className="vl-actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length ? (
                    visibleRows.map((v) => {
                      const key = v?.id ?? v?._id ?? v?.code;
                      const active = isActive(v);
                      return (
                        <tr key={key} onDoubleClick={() => goEdit(v)} title="Double-click to edit">
                          <td className="vl-col-code">{getCode(v)}</td>
                          <td className="vl-col-name" title={getVendorName(v)}>
                            <span className="vl-name-strong">{getVendorName(v)}</span>
                          </td>
                          <td className="vl-col-contact">{getContact(v)}</td>
                          <td className="vl-col-email" title={getEmail(v)}>{getEmail(v)}</td>
                          <td className="vl-col-phone">{getPhone(v)}</td>
                          <td className="vl-col-status">
                            <span className={`vl-badge ${active ? "ok" : "muted"}`}>{active ? "Active" : "Inactive"}</span>
                          </td>
                          <td className="vl-actions">
                            <button className="vl-btn ghost" onClick={() => goEdit(v)}>Edit</button>
                            <button className="vl-btn ghost" onClick={() => toggleActive(v)}>
                              {active ? "Deactivate" : "Activate"}
                            </button>
                            <button className="vl-btn danger" onClick={() => removeVendor(v)}>Delete</button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="vl-empty">No vendors found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="vl-pager">
              <span className="vl-total">Total: {totalElements}</span>
              <div className="vl-pager-controls">
                <button disabled={!canPrev} onClick={() => setPage((p) => Math.max(0, p - 1))}>‹ Prev</button>
                <span className="vl-pageinfo">Page {totalPages ? page + 1 : 0} / {totalPages || 0}</span>
                <button disabled={!canNext} onClick={() => setPage((p) => p + 1)}>Next ›</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Th({ label, col, sortBy, dir, onSort }) {
  const active = sortBy === col;
  return (
    <th className="vl-th" onClick={() => onSort(col)} role="button" tabIndex={0}>
      <span>{label}</span>
      <span className={`vl-sort ${active ? dir : ""}`} aria-hidden="true" />
    </th>
  );
}
