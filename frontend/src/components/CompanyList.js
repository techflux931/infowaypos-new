// src/components/CompanyList.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from '../api/axios';
import CompanyForm from './CompanyForm';
import CompanyStickerPreview from './CompanyStickerPreview';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './CompanyList.css';

const normalizeRole = (r) => {
  const x = (r || '').toString().trim().toLowerCase();
  if (x === 'admin') return 'Admin';
  if (x === 'developer' || x === 'dev') return 'Developer';
  if (x === 'cashier' || x === 'client') return 'Cashier';
  return '';
};

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);
  const [search, setSearch] = useState('');
  const [previewCompany, setPreviewCompany] = useState(null); // for print preview (scan or button)
  const barcodeRef = useRef(null);

  const role = normalizeRole(localStorage.getItem('userRole'));
  const username = localStorage.getItem('username') || '';

  const fetchCompanies = useCallback(async () => {
    try {
      let res = null;
      if (role === 'Developer') {
        res = await axios.get('/companies');
      } else if (role === 'Admin') {
        res = await axios.get(`/companies/admin/${username}`);
      } else {
        // Cashier or unknown: no listing allowed
        setCompanies([]);
        return;
      }

      if (res?.data) {
        const data = Array.isArray(res.data) ? res.data : [res.data];
        setCompanies(data);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error('❌ Error fetching companies:', err);
      setCompanies([]);
    }
  }, [role, username]);

  useEffect(() => {
    fetchCompanies();
    // keep scanner focused
    barcodeRef.current?.focus();
  }, [fetchCompanies]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      await axios.delete(`/companies/${id}`);
      // Optimistic update + refetch to be safe
      setCompanies((prev) => prev.filter((c) => (c.id || c._id) !== id));
      fetchCompanies();
    } catch (err) {
      console.error('❌ Error deleting company:', err);
    }
  };

  const handlePDFExport = () => {
    const doc = new jsPDF();
    doc.text('🏢 Company List', 14, 14);
    const rows = companies.map((c, i) => [
      i + 1,
      c.name || '',
      c.trn || '',
      c.address || '',
      c.email || '',
    ]);
    doc.autoTable({
      head: [['#', 'Name', 'TRN', 'Address', 'Email']],
      body: rows,
      startY: 20,
    });
    doc.save('CompanyList.pdf');
  };

  const handleScan = async (e) => {
    const code = e.target.value.trim();
    if (!code) return;
    try {
      const res = await axios.get(`/companies/barcode/${encodeURIComponent(code)}`);
      // Normalize logo field for sticker preview
      const c = res.data || null;
      if (!c) throw new Error('not found');
      setPreviewCompany({
        name: c.name || '',
        nameAr: c.nameAr || '',
        trn: c.trn || '',
        address: c.address || '',
        logo: c.logoUrl || c.logo || '',
        barcode: c.barcode || c.shopId || '',
      });
    } catch (err) {
      alert('❌ Company not found');
      setPreviewCompany(null);
    } finally {
      e.target.value = '';
      barcodeRef.current?.focus();
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const needle = search.toLowerCase();
    const fields = [c.name, c.trn, c.email].map((v) => (v || '').toLowerCase());
    return fields.some((f) => f.includes(needle));
  });

  if (role === 'Cashier' || !role) {
    return <div className="access-denied">⛔ Access denied</div>;
  }

  return (
    <div className="company-list-container">
      <h2>🏢 Company List</h2>

      <div className="company-actions">
        {(role === 'Admin' || role === 'Developer') && (
          <button onClick={() => setEditingCompany({})}>+ Add Company</button>
        )}
        <button onClick={handlePDFExport}>⬇ Export PDF</button>

        <input
          type="text"
          placeholder="🔍 Search by name, TRN or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="text"
          ref={barcodeRef}
          placeholder="📷 Scan barcode and press Enter"
          onBlur={() => barcodeRef.current?.focus()}
          onKeyDown={(e) => e.key === 'Enter' && handleScan(e)}
        />
      </div>

      {/* Inline modal: add/edit */}
      {editingCompany && (
        <CompanyForm
          // If your CompanyForm supports receiving initial data:
          initialData={editingCompany}
          onClose={async () => {
            setEditingCompany(null);
            await fetchCompanies(); // refresh list without full reload
          }}
        />
      )}

      {/* Print preview (from scan or action) */}
      {previewCompany && (
        <CompanyStickerPreview
          company={previewCompany}
          // Default to thermal; if you want A4 here add a UI to choose mode
          mode="thermal"
          onClose={() => setPreviewCompany(null)}
        />
      )}

      <table className="company-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>TRN</th>
            <th>Address</th>
            <th>Email</th>
            <th style={{ width: 220 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCompanies.map((c) => {
            const key = c.id || c._id || c.shopId || c.trn || c.email || Math.random().toString(36);
            return (
              <tr key={key}>
                <td>{c.name || '-'}</td>
                <td>{c.trn || '-'}</td>
                <td>{c.address || '-'}</td>
                <td>{c.email || '-'}</td>
                <td>
                  <button onClick={() => setEditingCompany(c)}>✏️ Edit</button>

                  <button
                    onClick={() =>
                      setPreviewCompany({
                        name: c.name || '',
                        nameAr: c.nameAr || '',
                        trn: c.trn || '',
                        address: c.address || '',
                        logo: c.logoUrl || c.logo || '',
                        barcode: c.barcode || c.shopId || '',
                      })
                    }
                  >
                    🖨 Print (Thermal)
                  </button>

                  {role === 'Developer' && (
                    <button onClick={() => handleDelete(c.id || c._id)}>🗑 Delete</button>
                  )}
                </td>
              </tr>
            );
          })}
          {filteredCompanies.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '12px 0' }}>
                No companies found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyList;
