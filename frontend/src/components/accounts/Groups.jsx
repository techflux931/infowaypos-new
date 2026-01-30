
// src/pages/accounts/Groups.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaTimes, FaInfoCircle, FaEdit, FaTrash, FaChevronDown } from "react-icons/fa";
import api from "../../api/axios";
import "./Groups.css";

/* ==================== constants ==================== */
const NATURES = ["ASSET", "LIABILITY", "INCOME", "EXPENSE"];
const PAGE_SIZE = 10;

const EMPTY_FORM = Object.freeze({
  id: null,
  name: "",
  underAccountId: "",          // "" => no parent
  nature: "ASSET",
  affectGrossProfit: false,
  remarks: "",
});

/* ==================== helpers ==================== */
const toStr = (v) => (v == null ? "" : String(v));

/** Trim long ids like: 68a757…a43b97 */
function shortId(id) {
  const s = toStr(id);
  if (!s) return "-";
  return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-6)}` : s;
}

/* ==================== component ==================== */
export default function Groups() {
  const navigate = useNavigate();

  // collapsibles
  const [openDetails, setOpenDetails] = useState(true);
  const [openList, setOpenList] = useState(true);

  // data
  const [allGroups, setAllGroups] = useState([]);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // form
  const [form, setForm] = useState(EMPTY_FORM);

  // ---------- derived display helpers ----------
  const idToName = useMemo(() => {
    const m = new Map();
    for (const g of allGroups) m.set(toStr(g.id), g.name);
    return m;
  }, [allGroups]);

  const displayUnder = useCallback(
    (r) => r?.underAccountName || idToName.get(toStr(r?.underAccountId)) || "-",
    [idToName]
  );

  // Build descendant set for current form.id so parent cannot be a descendant (prevents cycles)
  const descendantIds = useMemo(() => {
    if (!form.id) return new Set();

    // parent -> [children] index
    const byParent = allGroups.reduce((acc, g) => {
      const parent = g.underAccountId == null ? "" : String(g.underAccountId);
      (acc[parent] ||= []).push(String(g.id));
      return acc;
    }, {});

    const out = new Set();
    const stack = [String(form.id)];
    while (stack.length) {
      const cur = stack.pop();
      for (const child of byParent[cur] || []) {
        if (!out.has(child)) {
          out.add(child);
          stack.push(child);
        }
      }
    }
    return out;
  }, [allGroups, form.id]);

  // Parent dropdown options (no self, no descendants)
  const parentOptions = useMemo(() => {
    if (!form.id) return allGroups;
    const self = String(form.id);
    return allGroups.filter((g) => String(g.id) !== self && !descendantIds.has(String(g.id)));
  }, [allGroups, form.id, descendantIds]);

  // ---------- API ----------
  const loadAllGroups = useCallback(async (signal) => {
    try {
      const r = await api.get("/accounts/groups/all", { signal });
      setAllGroups(Array.isArray(r.data) ? r.data : []);
    } catch {
      setAllGroups([]);
    }
  }, []);

  const loadPagedGroups = useCallback(
    async (signal, pageParam, qParam) => {
      setLoading(true);
      try {
        const r = await api.get("/accounts/groups", {
          params: { q: qParam, page: pageParam, size: PAGE_SIZE },
          signal,
        });
        setRows(r.data?.content ?? []);
        setTotalPages(r.data?.totalPages ?? 0);
      } catch {
        setRows([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // initial + dropdown refresh
  useEffect(() => {
    const ctrl = new AbortController();
    loadAllGroups(ctrl.signal);
    return () => ctrl.abort();
  }, [loadAllGroups]);

  // table load whenever page or q changes
  useEffect(() => {
    const ctrl = new AbortController();
    loadPagedGroups(ctrl.signal, page, q);
    return () => ctrl.abort();
  }, [loadPagedGroups, page, q]);

  // ---------- handlers ----------
  const onReset = () => setForm(EMPTY_FORM);

  const onSave = async () => {
    const payload = {
      name: (form.name || "").trim(),
      underAccountId: form.underAccountId === "" ? null : String(form.underAccountId),
      nature: form.nature,
      affectGrossProfit: !!form.affectGrossProfit,
      remarks: form.remarks || "",
    };

    if (!payload.name) return alert("Enter group name");

    // prevent choosing self or a descendant as parent
    if (form.id && payload.underAccountId) {
      const self = String(form.id);
      if (payload.underAccountId === self || descendantIds.has(payload.underAccountId)) {
        return alert("Invalid parent: would create a loop.");
      }
    }

    try {
      setSaving(true);
      if (form.id) await api.put(`/accounts/groups/${form.id}`, payload);
      else await api.post("/accounts/groups", payload);

      onReset();

      // Refresh lists and reset to first page
      const ctrl = new AbortController();
      await Promise.all([loadPagedGroups(ctrl.signal, 0, q), loadAllGroups(ctrl.signal)]);
      setPage(0);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (r) => {
    setForm({
      id: r.id ?? null,
      name: r.name || "",
      underAccountId: r.underAccountId ?? "",
      nature: r.nature || "ASSET",
      affectGrossProfit: !!r.affectGrossProfit,
      remarks: r.remarks || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this group?")) return;
    try {
      await api.delete(`/accounts/groups/${id}`);

      // If we removed the last item on the page, go back a page (if possible)
      const nextPage = page > 0 && rows.length === 1 ? page - 1 : page;
      setPage(nextPage);

      const ctrl = new AbortController();
      await Promise.all([loadPagedGroups(ctrl.signal, nextPage, q), loadAllGroups(ctrl.signal)]);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete group");
    }
  };

  /* ==================== UI ==================== */
  return (
    <div className="grp-wrap">
      {/* Top bar */}
      <header className="grp-topbar">
        <button
          type="button"
          className="grp-home"
          title="Dashboard"
          aria-label="Dashboard"
          onClick={() => navigate("/dashboard")}
        >
          <FaHome aria-hidden="true" />
        </button>
        <h1 className="grp-title">Group Registration</h1>
        <button
          type="button"
          className="grp-close"
          title="Close"
          aria-label="Close"
          onClick={() => navigate("/accounts")}
        >
          <FaTimes aria-hidden="true" />
        </button>
      </header>

      {/* Details */}
      <section className={`grp-card ${openDetails ? "open" : "closed"}`}>
        <button type="button" className="grp-card-head" onClick={() => setOpenDetails((v) => !v)}>
          <span>Details</span>
          <FaChevronDown className={`rot${openDetails ? " on" : ""}`} />
        </button>

        {openDetails && (
          <>
            <div className="grp-form">
              <label>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Group Name"
                  autoComplete="off"
                />
              </label>

              <label>
                <span>Under Account</span>
                <select
                  value={form.underAccountId === "" ? "" : String(form.underAccountId)}
                  onChange={(e) => setForm({ ...form, underAccountId: e.target.value || "" })}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <option value="">-- None --</option>
                  {parentOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Nature</span>
                <select
                  value={form.nature}
                  onChange={(e) => setForm({ ...form, nature: e.target.value })}
                >
                  {NATURES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grp-remarks">
                <span>Remarks</span>
                <textarea
                  rows={1}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </label>

              <label
                className="grp-chk left"
                title="If checked, this group participates in Gross Profit (P&L)."
              >
                <input
                  type="checkbox"
                  checked={form.affectGrossProfit}
                  onChange={(e) => setForm({ ...form, affectGrossProfit: e.target.checked })}
                />
                <span>Affect Gross Profit</span>
                <FaInfoCircle className="grp-tip" aria-hidden="true" />
              </label>
            </div>

            <div className="grp-actions">
              <button
                type="button"
                className="btn primary"
                onClick={onSave}
                disabled={saving || !form.name.trim()}
              >
                {saving ? "Saving…" : form.id ? "Update" : "Save"}
              </button>
              <button type="button" className="btn" onClick={onReset} disabled={saving}>
                Reset
              </button>
            </div>
          </>
        )}
      </section>

      {/* List */}
      <section className={`grp-card ${openList ? "open" : "closed"}`}>
        <button type="button" className="grp-card-head" onClick={() => setOpenList((v) => !v)}>
          <span>Group List</span>
          <FaChevronDown className={`rot${openList ? " on" : ""}`} />
        </button>

        {openList && (
          <>
            <div className="grp-list-head">
              <input
                className="grp-search"
                placeholder="Search"
                value={q}
                onChange={(e) => {
                  setPage(0);
                  setQ(e.target.value);
                }}
              />
            </div>

            <div className="grp-table-wrap">
              <table className="grp-table">
                <thead>
                  <tr>
                    <th className="col-id">ID</th>
                    <th>Name</th>
                    <th>Under Account</th>
                    <th className="col-id">Under ID</th>
                    <th>Nature</th>
                    <th>Gross P/L</th>
                    <th className="col-actions" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="mono col-id" title={r.id}>
                        {shortId(r.id)}
                      </td>
                      <td title={r.name}>{r.name}</td>
                      <td title={displayUnder(r)}>{displayUnder(r)}</td>
                      <td className="mono col-id" title={toStr(r.underAccountId) || "-"}>
                        {shortId(r.underAccountId)}
                      </td>
                      <td>{r.nature}</td>
                      <td aria-label={r.affectGrossProfit ? "Affects Gross Profit" : "Does not affect Gross Profit"}>
                        {r.affectGrossProfit ? "Yes" : "No"}
                      </td>
                      <td className="grp-actions-col">
                        <button
                          type="button"
                          className="icon"
                          title="Edit"
                          aria-label={`Edit ${r.name}`}
                          onClick={() => onEdit(r)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className="icon danger"
                          title="Delete"
                          aria-label={`Delete ${r.name}`}
                          onClick={() => onDelete(r.id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td className="grp-empty" colSpan={7}>
                        {loading ? "Loading…" : "No records"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grp-pager">
              <button type="button" disabled={page <= 0} onClick={() => setPage(0)}>
                First
              </button>
              <button type="button" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span>
                {totalPages ? page + 1 : 0} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(totalPages - 1)}
              >
                Last
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
