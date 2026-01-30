import React, { useEffect, useState } from "react";
import {
  listManagers,
  getManagerAuth,
  updateManagerAuth,
  createManager,
} from "../api/managerAuth";
import "./ManagerAuthSettings.css";

export default function ManagerAuthSettings() {
  const [rows, setRows] = useState([]);        // [{id, fullName, role, enabled, pinSet?, cardUid?}]
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // edit auth
  const [pin, setPin] = useState("");
  const [cardUid, setCardUid] = useState("");
  const [saving, setSaving] = useState(false);

  // add manager (NO password field in UI)
  const [newMgr, setNewMgr] = useState({
    fullName: "",
    enabled: true,
    pin: "",
    cardUid: "",
  });
  const [adding, setAdding] = useState(false);
  const [lastCreatedUsername, setLastCreatedUsername] = useState("");

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshList = async () => {
    setLoading(true);
    try {
      const base = await listManagers();

      // enrich each manager with pinSet/cardUid to show them in the table
      const enriched = await Promise.all(
        (Array.isArray(base) ? base : []).map(async (m) => {
          try {
            const auth = await getManagerAuth(m.id);
            return { ...m, pinSet: !!auth?.pinSet, cardUid: auth?.cardUid || "" };
          } catch {
            return { ...m, pinSet: false, cardUid: "" };
          }
        })
      );

      setRows(enriched);
    } catch (e) {
      console.error(e);
      alert("Failed to load managers");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const onSelect = async (r) => {
    setSelected(r);
    setPin("");
    setCardUid(r?.cardUid || "");
  };

  const save = async () => {
    if (!selected) return alert("Select a manager first");
    if (pin && !/^\d{4,8}$/.test(pin)) return alert("PIN must be 4–8 digits");
    if (!pin && (cardUid ?? "") === (selected.cardUid ?? "")) {
      return alert("Enter a new PIN or change Card UID to update");
    }

    setSaving(true);
    try {
      await updateManagerAuth(selected.id, {
        pin: pin || undefined,
        cardUid: (cardUid || "").trim() || undefined,
      });
      alert("Updated ✔");
      await refreshList();
      setPin("");
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const addManager = async () => {
    const { fullName, enabled, pin, cardUid } = newMgr;
    if (!fullName?.trim()) return alert("Name is required");
    if (pin && !/^\d{4,8}$/.test(pin)) return alert("PIN must be 4–8 digits");

    setAdding(true);
    try {
      const created = await createManager({
        fullName: fullName.trim(),
        enabled: !!enabled,
        pin: pin || undefined,
        cardUid: (cardUid || "").trim() || undefined,
      });
      setLastCreatedUsername(created?.username || "");
      alert(
        `Manager added ✔ ${created?.username ? `(username: ${created.username})` : ""}`
      );

      setNewMgr({ fullName: "", enabled: true, pin: "", cardUid: "" });
      await refreshList();

      if (created?.id) {
        const match = (m) => m.id === created.id;
        const justAdded = (prev) => prev.find(match) || created;
        const finalSel = justAdded((await listManagers()) || []);
        onSelect(finalSel);
      }
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to add manager");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="ma-wrap">
      <h2 className="ma-title">Manager Return Authentication</h2>

      <div className="ma-grid">
        {/* Left: list */}
        <div className="ma-panel">
          <div className="ma-panel-head">Managers</div>

          {loading ? (
            <div className="ma-empty">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="ma-empty">No managers found.</div>
          ) : (
            <table className="ma-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>PIN Set</th>
                  <th>Card UID</th>
                  <th>Enabled</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onSelect(r)}
                    className={selected?.id === r.id ? "is-selected" : ""}
                  >
                    <td>{r.fullName || r.username}</td>
                    <td>{r.role}</td>
                    <td>{r.pinSet ? "Yes" : "No"}</td>
                    <td style={{ fontFamily: "monospace" }}>{r.cardUid || "—"}</td>
                    <td>{r.enabled ? "true" : "false"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div className="ma-right-col">
          {/* Add manager */}
          <div className="ma-panel ma-form">
            <div className="ma-panel-head">Add Manager</div>

            <div className="ma-field">
              <label>Full name *</label>
              <input
                value={newMgr.fullName}
                onChange={(e) =>
                  setNewMgr((s) => ({ ...s, fullName: e.target.value }))
                }
                placeholder="e.g. Store Manager"
              />
            </div>

            <div className="ma-field">
              <label>PIN (optional)</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d*"
                placeholder="4–8 digits"
                value={newMgr.pin}
                onChange={(e) =>
                  setNewMgr((s) => ({
                    ...s,
                    pin: e.target.value.replace(/[^\d]/g, ""),
                  }))
                }
              />
            </div>

            <div className="ma-field">
              <label>Card UID (optional)</label>
              <input
                value={newMgr.cardUid}
                onChange={(e) =>
                  setNewMgr((s) => ({ ...s, cardUid: e.target.value.trim() }))
                }
                placeholder="e.g. 04A1B2C3…"
              />
            </div>

            <div className="ma-field">
              <label className="ma-check">
                <input
                  type="checkbox"
                  checked={newMgr.enabled}
                  onChange={(e) =>
                    setNewMgr((s) => ({ ...s, enabled: e.target.checked }))
                  }
                />
                Enabled
              </label>
            </div>

            <button className="ma-btn" disabled={adding} onClick={addManager}>
              {adding ? "Adding…" : "Add Manager"}
            </button>

            {lastCreatedUsername && (
              <div className="ma-hint" style={{ marginTop: 8 }}>
                Generated username: <b>{lastCreatedUsername}</b>
              </div>
            )}
          </div>

          {/* Edit auth */}
          <div className="ma-panel ma-form">
            <div className="ma-panel-head">Edit Auth</div>

            <div className="ma-field">
              <label>Selected user</label>
              <div className="ma-value">
                {selected ? (selected.fullName || selected.username) : "—"}
              </div>
            </div>

            <div className="ma-field">
              <label>New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d*"
                placeholder="4–8 digits"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, ""))}
                disabled={!selected}
              />
              <small>Leave blank to keep existing PIN.</small>
            </div>

            <div className="ma-field">
              <label>Card UID</label>
              <input
                placeholder="e.g. 04A1B2C3…"
                value={cardUid}
                onChange={(e) => setCardUid(e.target.value.trim())}
                disabled={!selected}
              />
              <small>Leave blank to keep existing card.</small>
            </div>

            <button
              className="ma-btn"
              disabled={
                saving ||
                !selected ||
                (!pin && (cardUid ?? "") === (selected?.cardUid ?? ""))
              }
              onClick={save}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
