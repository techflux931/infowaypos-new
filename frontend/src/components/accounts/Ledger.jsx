// src/pages/accounts/Ledger.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaTimes, FaEdit, FaTrash, FaChevronDown } from "react-icons/fa";
import api from "../../api/axios";
import "./Ledger.css";

/* ====================== constants ====================== */
const BAL_TYPES = ["DEBIT", "CREDIT"];
const PAGE_SIZE = 10;

const EMPTY_FORM = Object.freeze({
  id: null,
  name: "",
  groupId: "",
  openingBalance: "0", // keep as string for the number input
  balanceType: "DEBIT",
  costCenterApplicable: false,
  remarks: "",
});

/* ====================== helpers ====================== */
const n2 = (v) => Number(v || 0).toFixed(2);

/* ====================== component ====================== */
export default function Ledger() {
  const navigate = useNavigate();

  // collapsibles
  const [openDetails, setOpenDetails] = useState(true);
  const [openList, setOpenList] = useState(true);

  // dropdown (Account Groups)
  const [groups, setGroups] = useState([]);

  // table
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // form
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* ============ API ============ */
  const loadGroups = useCallback(async (signal) => {
    try {
      const r = await api.get("/accounts/groups/all", { signal });
      setGroups(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      if (e?.name !== "CanceledError") console.error(e);
      setGroups([]);
    }
  }, []);

  const loadTable = useCallback(
    async (signal, pageArg = page, qArg = q) => {
      setLoading(true);
      try {
        const r = await api.get("/accounts/ledgers", {
          params: { q: qArg, page: pageArg, size: PAGE_SIZE },
          signal,
        });
        const content = r?.data?.content ?? [];
        setRows(Array.isArray(content) ? content : []);
        setTotalPages(Number(r?.data?.totalPages ?? 0));
      } catch (e) {
        if (e?.name !== "CanceledError") console.error(e);
        setRows([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    [page, q]
  );

  const refreshTableNow = useCallback(async () => {
    const ctrl = new AbortController();
    await loadTable(ctrl.signal);
    ctrl.abort();
  }, [loadTable]);

  /* ============ effects ============ */
  useEffect(() => {
    const ctrl = new AbortController();
    loadGroups(ctrl.signal);
    return () => ctrl.abort();
  }, [loadGroups]);

  useEffect(() => {
    const ctrl = new AbortController();
    loadTable(ctrl.signal);
    return () => ctrl.abort();
  }, [loadTable]);

  /* ============ handlers ============ */
  const resetForm = () => setForm({ ...EMPTY_FORM });

  const makePayload = () => ({
    name: form.name.trim(),
    groupId: form.groupId,
    openingBalance: Number(form.openingBalance || 0),
    balanceType: BAL_TYPES.includes(form.balanceType) ? form.balanceType : "DEBIT",
    costCenterApplicable: !!form.costCenterApplicable,
    remark: (form.remarks || "").trim(), // backend uses "remark"
  });

  const canSave = useMemo(() => {
    const nameOk = !!form.name.trim();
    const groupOk = !!form.groupId;
    const ob = Number(form.openingBalance);
    const obOk = form.openingBalance !== "" && Number.isFinite(ob);
    return !saving && nameOk && groupOk && obOk;
  }, [form, saving]);

  const onSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      const payload = makePayload();
      if (form.id) await api.put(`/accounts/ledgers/${form.id}`, payload);
      else await api.post("/accounts/ledgers", payload);

      resetForm();

      // Refresh table immediately; then go to first page so user sees the new row if API sorts desc
      await refreshTableNow();
      setPage(0);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to save ledger");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (r) => {
    setForm({
      id: r.id ?? null,
      name: r.name || "",
      groupId: r.groupId || "",
      openingBalance: String(r.openingBalance ?? "0"),
      balanceType: r.balanceType || "DEBIT",
      costCenterApplicable: !!r.costCenterApplicable,
      remarks: r.remark || r.remarks || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this ledger?")) return;
    try {
      await api.delete(`/accounts/ledgers/${id}`);
      const nextPage = rows.length === 1 && page > 0 ? page - 1 : page;

      if (nextPage !== page) {
        setPage(nextPage); // effect will reload
      } else {
        await refreshTableNow();
      }
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete ledger");
    }
  };

  /* ============ render ============ */
  return (
    <div className="led-wrap">
      {/* Top bar */}
      <header className="led-topbar">
        <button
          type="button"
          className="led-home"
          title="Dashboard"
          aria-label="Dashboard"
          onClick={() => navigate("/dashboard")}
        >
          <FaHome aria-hidden="true" />
        </button>
        <h1 className="led-title">Ledger Registration</h1>
        <button
          type="button"
          className="led-close"
          title="Close"
          aria-label="Close"
          onClick={() => navigate("/accounts")}
        >
          <FaTimes aria-hidden="true" />
        </button>
      </header>

      {/* Details */}
      <section className={`led-card ${openDetails ? "open" : "closed"}`}>
        <button type="button" className="led-card-head" onClick={() => setOpenDetails((v) => !v)}>
          <span>Details</span>
          <FaChevronDown className={`rot${openDetails ? " on" : ""}`} />
        </button>

        {openDetails && (
          <>
            <div className="led-form">
              <label>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ledger Name"
                  autoComplete="off"
                />
              </label>

              <label>
                <span>Group</span>
                <select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                >
                  <option value="">-- Select Group --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="led-oblock">
                <label className="led-grow">
                  <span>Opening Balance</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.openingBalance}
                    onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                  />
                </label>

                <label>
                  <span>Type</span>
                  <select
                    value={form.balanceType}
                    onChange={(e) => setForm({ ...form, balanceType: e.target.value })}
                  >
                    {BAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="led-chk left">
                <input
                  type="checkbox"
                  checked={form.costCenterApplicable}
                  onChange={(e) =>
                    setForm({ ...form, costCenterApplicable: e.target.checked })
                  }
                />
                <span>Cost Center Applicable</span>
              </label>

              <label className="led-remarks">
                <span>Remark</span>
                <textarea
                  rows={1}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </label>
            </div>

            <div className="led-actions">
              <button type="button" className="btn primary" onClick={onSave} disabled={!canSave}>
                {saving ? "Saving…" : form.id ? "Update" : "Save"}
              </button>
              <button type="button" className="btn" onClick={resetForm} disabled={saving}>
                Reset
              </button>
            </div>
          </>
        )}
      </section>

      {/* List */}
      <section className={`led-card ${openList ? "open" : "closed"}`}>
        <button type="button" className="led-card-head" onClick={() => setOpenList((v) => !v)}>
          <span>Ledger List</span>
          <FaChevronDown className={`rot${openList ? " on" : ""}`} />
        </button>

        {openList && (
          <>
            <div className="led-list-head">
              <input
                className="led-search"
                placeholder="Search"
                value={q}
                onChange={(e) => {
                  setPage(0);
                  setQ(e.target.value);
                }}
              />
            </div>

            <div className="led-table-wrap">
              <table className="led-table">
                <colgroup>
                  <col className="w-name" />
                  <col className="w-amt" />
                  <col className="w-type" />
                  <col className="w-group" />
                  <col className="w-actions" />
                </colgroup>

                <thead>
                  <tr>
                    <th className="col-name">Name</th>
                    <th className="col-amt right">Opening Balance</th>
                    <th className="col-type">Type</th>
                    <th className="col-group">Group</th>
                    <th className="col-actions">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="col-name">{r.name}</td>
                      <td className="col-amt right">{n2(r.openingBalance)}</td>
                      <td className="col-type">{r.balanceType}</td>
                      <td className="col-group">{r.groupName || "-"}</td>
                      <td className="col-actions">
                        <div className="led-actions-col">
                          <button
                            type="button"
                            className="icon"
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => onEdit(r)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className="icon danger"
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => onDelete(r.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!rows.length && (
                    <tr>
                      <td className="led-empty" colSpan={5}>
                        {loading ? "Loading…" : "No records"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="led-pager">
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
