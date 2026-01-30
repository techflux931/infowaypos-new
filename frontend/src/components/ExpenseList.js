// src/components/ExpenseList.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './ExpenseList.css';

const AED = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' });
const fmtDate = v =>
  v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const getId = x => x?._id ?? x?.id ?? x?.uuid ?? null;

// Route helpers (match your ExpenseForm: useParams({ id }) )
const ROUTE_NEW  = '/total-purchase/expense';
const routeEdit  = id => `/total-purchase/expense/${id}`;

export default function ExpenseList() {
  const navigate = useNavigate();

  const [items, setItems]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { void fetchData(); }, []);

  async function fetchData() {
    try {
      setLoad(true);
      setError('');
      const { data } = await api.get('/expenses');
      setItems(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (e) {
      console.error(e);
      setError('Failed to fetch expenses. Please try again.');
    } finally {
      setLoad(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(e => {
      const name = (e?.name || e?.expenseName || '').toLowerCase();
      const cat  = (e?.category || '').toLowerCase();
      const ven  = (e?.vendor || '').toLowerCase();
      return name.includes(q) || cat.includes(q) || ven.includes(q);
    });
  }, [items, search]);

  const handleAdd   = () => navigate(ROUTE_NEW);
  const handleEdit  = (id) => id && navigate(routeEdit(id)); // <-- fixed route (no /edit)
  const handleDelete = async (id) => {
    if (!id || !window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      await fetchData();
    } catch (e) {
      console.error(e);
      setError('Delete failed. Please try again.');
    }
  };

  return (
    <div className="expense-list-wrapper">
      <div className="expense-list-header">
        <h2>Expense List</h2>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchData}>Refresh</button>
          <button className="btn-add" onClick={handleAdd}>+ Add Expense</button>
        </div>
      </div>

      <div className="expense-search">
        <input
          type="text"
          placeholder="Search by name, category, or vendor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search expenses"
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading expenses…</p>
      ) : (
        <table className="expense-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Date</th>
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>
                  {search ? 'No expenses match your search.' : 'No expenses found.'}
                </td>
              </tr>
            ) : (
              filtered.map(e => {
                const id = getId(e);
                const amount = Number(e?.amount || 0);
                return (
                  <tr key={id}>
                    <td>{e?.name || e?.expenseName || '-'}</td>
                    <td>{e?.category || '-'}</td>
                    <td>{e?.vendor || '-'}</td>
                    <td>{Number.isFinite(amount) ? AED.format(amount) : AED.format(0)}</td>
                    <td>{fmtDate(e?.date)}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(id)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(id)}>Delete</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
