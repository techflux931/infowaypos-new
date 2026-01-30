import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaTimes } from 'react-icons/fa';
import axios from '../../api/axios';
import './SupplierOutstandingReport.css';

const AED = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' });
const money = (v) => AED.format(Number(v || 0));
const toYMD = (d) => {
  const dt = d instanceof Date ? d : new Date(d || Date.now());
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function SupplierOutstandingReport() {
  const navigate = useNavigate();
  const today = useMemo(() => toYMD(new Date()), []);

  const [filters, setFilters] = useState({
    asOf: today,
    supplier: '',
    groupBy: 'SUPPLIER', // SUPPLIER | INVOICE (if backend supports)
    onlyOverdue: true,
    page: 0,
    size: 20,
  });

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Aging buckets
  const buckets = useMemo(
    () => ([
      { key: 'current', label: 'Current' },
      { key: 'b1_30',  label: '1–30' },
      { key: 'b31_60', label: '31–60' },
      { key: 'b61_90', label: '61–90' },
      { key: 'b90p',   label: '90+' },
      { key: 'total',  label: 'Total' },
    ]),
    []
  );

  // Columns for SUPPLIER view
  const cols = useMemo(() => ([
    { key: 'supplier', label: 'SUPPLIER' },
    { key: 'code',     label: 'CODE' },
    { key: 'phone',    label: 'PHONE' },
    { key: 'current',  label: 'CURRENT', align: 'right', money: true },
    { key: 'b1_30',    label: '1–30',    align: 'right', money: true },
    { key: 'b31_60',   label: '31–60',   align: 'right', money: true },
    { key: 'b61_90',   label: '61–90',   align: 'right', money: true },
    { key: 'b90p',     label: '90+',     align: 'right', money: true },
    { key: 'total',    label: 'TOTAL',   align: 'right', money: true },
  ]), []);

  const setField = (k, v) =>
    setFilters((f) => ({
      ...f,
      [k]: v,
      page: ['asOf', 'supplier', 'groupBy', 'onlyOverdue', 'size'].includes(k) ? 0 : f.page,
    }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/reports/supplier-outstanding', {
        params: {
          asOf: filters.asOf,
          supplier: filters.supplier,
          groupBy: filters.groupBy,
          onlyOverdue: filters.onlyOverdue,
          page: filters.page,
          size: filters.size,
        },
      });

      const items = data?.items ?? data ?? [];
      setRows(items);
      setTotals(data?.totals ?? {});
      setCount(Number(data?.count ?? items.length));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportExcel = useCallback(async () => {
    try {
      const mod = await import('xlsx');
      const XLSX = mod?.default ?? mod;

      const sheet = (rows ?? []).map((r) =>
        Object.fromEntries(
          cols.map((c) => {
            let v = r[c.key];
            if (c.money) v = money(v);
            return [c.label, v ?? ''];
          })
        )
      );

      const ws = XLSX.utils.json_to_sheet(sheet);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SupplierOutstanding');
      XLSX.writeFile(wb, `Supplier_Outstanding_${filters.asOf}.xlsx`);
    } catch (err) {
      console.error(err);
      setError(`Export failed: ${err.message}`);
    }
  }, [rows, cols, filters.asOf]);

  return (
    <div className="rpt-wrap so-wrap">
      {/* Header */}
      <div className="rpt-header">
        <div className="left">
          <button className="iconbtn" onClick={() => navigate('/dashboard')} aria-label="Home">
            <FaHome />
          </button>
          <h2>Supplier Outstanding</h2>
        </div>
        <button className="iconbtn" onClick={() => navigate('/reports')} aria-label="Close">
          <FaTimes />
        </button>
      </div>

      {error && <div className="rpt-error">{error}</div>}

      {/* Toolbar */}
      <div className="rpt-toolbar">
        <div className="field">
          <label>As of</label>
          <input
            type="date"
            value={filters.asOf}
            onChange={(e) => setField('asOf', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Supplier</label>
          <input
            placeholder="Name / Code / Phone"
            value={filters.supplier}
            onChange={(e) => setField('supplier', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Group By</label>
          <select
            value={filters.groupBy}
            onChange={(e) => setField('groupBy', e.target.value)}
          >
            <option value="SUPPLIER">Supplier</option>
            <option value="INVOICE">Invoice (if available)</option>
          </select>
        </div>

        <div className="field">
          <label>Only overdue</label>
          <input
            type="checkbox"
            checked={filters.onlyOverdue}
            onChange={(e) => setField('onlyOverdue', e.target.checked)}
          />
        </div>

        <div className="field">
          <label>Rows</label>
          <select value={filters.size} onChange={(e) => setField('size', Number(e.target.value))}>
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
        </div>

        <div className="actions">
          <button className="act run" onClick={fetchData}>Run</button>
          <button className="act export" onClick={exportExcel}>Export</button>
          <button className="act print" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      {/* Table */}
      <div className="rpt-card">
        {loading ? (
          <div className="rpt-loading">Loading…</div>
        ) : (
          <div className="rpt-tablewrap">
            <table className="rpt-table">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c.key} style={{ textAlign: c.align || 'left' }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td className="rpt-empty" colSpan={cols.length}>
                      No data for selected filters
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    {cols.map((c) => {
                      let v = r[c.key];
                      if (c.money) v = money(v);
                      return (
                        <td key={c.key} style={{ textAlign: c.align || 'left' }}>
                          {v ?? '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals strip */}
      <div className="rpt-totals">
        {buckets.map((b) => (
          <div className="chip" key={b.key}>
            <span className="k">{b.label}</span>
            <span className="v">{money(totals?.[b.key])}</span>
          </div>
        ))}
      </div>

      {/* Pager */}
      <div className="rpt-pager">
        <button
          onClick={() => setField('page', Math.max(0, filters.page - 1))}
          disabled={filters.page === 0}
        >
          Prev
        </button>
        <span>Page {filters.page + 1}</span>
        <button
          onClick={() => setField('page', filters.page + 1)}
          disabled={(filters.page + 1) * filters.size >= count}
        >
          Next
        </button>
      </div>
    </div>
  );
}
