// src/components/Customer.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Customer.css";
import {
  FaTimes,
  FaFileExport,
  FaFileImport,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import AddCustomerModal from "./AddCustomerModal";

const PAGE_SIZE = 50;

export default function Customer() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef(null);

  /* ------------------------- data load ------------------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/customers");
        if (!cancelled) setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error fetching customers:", err?.message || err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return customers.filter((c) => {
      const name = `${c?.firstName || ""} ${c?.lastName || ""}`.trim();
      const code = c?.code || "";
      const type = (c?.customerType || c?.type || "Cash").toString();
      const matchSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q);
      const matchType =
        typeFilter === "All" ||
        type.toLowerCase() === typeFilter.toLowerCase();
      return matchSearch && matchType;
    });
  }, [customers, searchTerm, typeFilter]);

  const indexOfLast = currentPage * PAGE_SIZE;
  const indexOfFirst = indexOfLast - PAGE_SIZE;
  const currentCustomers = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const refresh = async () => {
    const { data } = await api.get("/customers");
    setCustomers(Array.isArray(data) ? data : []);
  };

  const handleCustomerAdded = async () => {
    await refresh();
    setSelectedCustomer(null);
    setCurrentPage(Math.max(1, Math.ceil(customers.length / PAGE_SIZE)));
  };

  /* ------------------------- actions -------------------------- */
  const handleAdd = () => {
    setEditData(null);
    setShowAddModal(true);
  };

  const handleEdit = () => {
    if (!selectedCustomer) return alert("Select a customer to edit.");
    setEditData(selectedCustomer);
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return alert("Select a customer to delete.");
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      const id = selectedCustomer.id || selectedCustomer._id;
      await api.delete(`/customers/${id}`);
      await refresh();
      setSelectedCustomer(null);
    } catch (err) {
      console.error("❌ Error deleting customer:", err?.message || err);
      alert("Failed to delete customer.");
    }
  };

  const csvEscape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleExport = () => {
    const rows = [
      ["Code", "FirstName", "LastName", "Address", "Phone", "Email", "Type"],
      ...filtered.map((c) => [
        c.code || "",
        c.firstName || "",
        c.lastName || "",
        c.address || "",
        c.mobileNo || c.phoneNo || c.phone || "",
        c.email || "",
        c.customerType || c.type || "",
      ]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "customers.csv";
    a.click();
  };

  /* ----------------------- import Excel/CSV -------------------- */
  const triggerImport = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      // Lazy-load XLSX (SheetJS)
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      // Expected columns (case-insensitive): Code, FirstName, LastName, Name, Address, Phone, Email, Type
      let ok = 0, dup = 0, fail = 0;
      for (const r of rows) {
        const code = (r.Code || r.code || "").toString().trim();
        if (!code) { fail++; continue; }

        let firstName = (r.FirstName || r.firstname || "").toString().trim();
        let lastName  = (r.LastName  || r.lastname  || "").toString().trim();
        const name    = (r.Name || r.name || "").toString().trim();
        if (!firstName && name) {
          const parts = name.split(" ");
          firstName = parts.shift() || "";
          lastName  = parts.join(" ");
        }

        const payload = {
          code,
          firstName,
          lastName,
          address: (r.Address || r.address || "").toString().trim(),
          email:   (r.Email   || r.email   || "").toString().trim(),
          mobileNo:(r.Phone   || r.phone   || "").toString().trim(),
          type:    (r.Type    || r.type    || "Cash").toString().trim(),
        };

        try {
          await api.post("/customers", payload);
          ok++;
        } catch (err) {
          // 409 from duplicate code is common during import
          if (err?.response?.status === 409) dup++;
          else fail++;
        }
      }

      await refresh();
      alert(`Import finished.\nAdded: ${ok}\nDuplicates: ${dup}\nFailed: ${fail}`);
    } catch (err) {
      console.error("❌ Import failed:", err);
      alert("Import failed. Please check the file format.");
    } finally {
      setImporting(false);
      e.target.value = ""; // reset file input
    }
  };

  /* ------------------------- header --------------------------- */
  const handleClose = () => navigate("/dashboard");

  /* ------------------------- render --------------------------- */
  const isSelected = (c) =>
    (selectedCustomer?.id || selectedCustomer?._id) === (c?.id || c?._id);

  return (
    <div className="customer-container">
      {/* Header */}
      <div className="customer-header">
        <div className="header-left">
          <button
            className="home-btn"
            onClick={() => navigate("/dashboard")}
            aria-label="Go to Dashboard"
            title="Home"
          >
            <img src={require("../assets/Home.png")} alt="" />
          </button>
        </div>

        <h2 className="header-title">CUSTOMER</h2>

        <div className="header-right">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
          <button className="export-btn" onClick={triggerImport} disabled={importing} title="Import Excel/CSV">
            <FaFileImport /> {importing ? "Importing..." : "Import"}
          </button>
          <button className="export-btn" onClick={handleExport} title="Export CSV">
            <FaFileExport /> Export
          </button>
          <button className="close-btn" onClick={handleClose} title="Close">
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="search-type-container">
        <input
          type="text"
          placeholder="Search by code / name"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />
        <div className="type-filter">
          <strong>Type:</strong>
          {["All", "Cash", "Credit"].map((t) => (
            <label key={t}>
              <input
                type="radio"
                value={t}
                checked={typeFilter === t}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="customer-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Code</th>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {currentCustomers.map((c, idx) => {
              const name =
                `${c?.firstName || ""} ${c?.lastName || ""}`.trim() ||
                c?.name ||
                "-";
              return (
                <tr
                  key={c?.id || c?._id || idx}
                  onClick={() => setSelectedCustomer(c)}
                  className={isSelected(c) ? "row-selected" : ""}
                >
                  <td>{indexOfFirst + idx + 1}</td>
                  <td>{c?.code || "-"}</td>
                  <td>{name}</td>
                  <td>{c?.address || "-"}</td>
                  <td>{c?.mobileNo || c?.phoneNo || c?.phone || "-"}</td>
                  <td>{c?.email || "-"}</td>
                  <td>{c?.customerType || c?.type || "-"}</td>
                </tr>
              );
            })}
            {currentCustomers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", opacity: 0.7 }}>
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="action-buttons">
        <button
          className="select-btn"
          onClick={() =>
            selectedCustomer
              ? alert(
                  `Selected: ${(
                    (selectedCustomer.firstName || "") +
                    " " +
                    (selectedCustomer.lastName || "")
                  ).trim()}`
                )
              : alert("Please select a customer.")
          }
        >
          ✔ Select
        </button>
        <button className="add-btn" onClick={handleAdd}>
          <FaPlus /> Add New
        </button>
        <button className="edit-btn" onClick={handleEdit}>
          <FaEdit /> Edit
        </button>
        <button className="delete-btn" onClick={handleDelete}>
          <FaTrash /> Delete
        </button>
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? "active" : ""}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Modal */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onCustomerAdded={handleCustomerAdded}
          editData={editData}
        />
      )}
    </div>
  );
}
