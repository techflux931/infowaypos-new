import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaTimes } from 'react-icons/fa';
import axios from '../../api/axios';
import './AgingReport.css';

/* ---------- utils ---------- */
const AED = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' });
const money = (v) => AED.format(Number(v || 0));
const toYMD = (d) => {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const GROUPS = [
  { key: 'CUSTOMER', label: 'Customer' },
  { key: 'INVOICE',  label: 'Invoice'  },
];

/* Fallback getters so minor API differences don't break UI */
const getters = {
  party: (r) => r.customerName ?? r.customer ?? r.name ?? r.party ?? '',
  partyCode: (r) => r.customerCode ?? r.code ?? r.customerId ?? r.id ?? '',
  phone: (r) => r.mobile ?? r.phone ?? r.phoneNumber ?? '',
  invoiceNo: (r) => r.invoiceNo ?? r.billNo ?? r.invNo ?? r.reference ?? '',
  date: (r) => r.date ?? r.invoiceDate ?? r.createdAt ?? null,

  current:  (r) => pickMoney(r, ['current', 'notDue', 'b0', 'b0_0']),
  d1_30:    (r) => pickMoney(r, ['d1_30','b1_30','b0_30','bucket1']),
  d31_60:   (r) => pickMoney(r, ['d31_60','b31_60','bucket2']),
  d61_90:   (r) => pickMoney(r, ['d61_90','b61_90','bucket3']),
  d91_plus: (r) => pickMoney(r, ['d91_plus','b91_plus','b90_plus','over90','bucket4']),
  totalDue: (r) => pickMoney(r, ['totalDue','balance','outstanding','total']),
};

function pickMoney(row, keys) {
  for (const k of keys) {
    if (row[k] != null) return Number(row[k]);
  }
  return 0;
}

/* Build columns for selected grouping */
function buildColumns(groupBy) {
  const buckets = [
    { key: 'current',  label: 'CURRENT',  align: 'right', money: true },
    { key: 'd1_30',    label: '1–30',     align: 'right', money: true },
    { key: 'd31_60',   label: '31–60',    align: 'right', money: true },
    { key: 'd61_90',   label: '61–90',    align: 'right', money: true },
    { key: 'd91_plus', label: '90+',      align: 'right', money: true },
    { key: 'totalDue', label: 'TOTAL',    align: 'right', money: true },
  ];

  if (groupBy === 'INVOICE') {
    return [
      { key: 'invoiceNo', label: 'INVOICE #' },
      { key: 'party',     label: 'CUSTOMER'  },
      { key: 'date',      label: 'DATE'      },
      ...buckets,
    ];
  }

  // CUSTOMER
  return [
    { key: 'party',     label: 'CUSTOMER' },
    { key: 'partyCode', label: 'CODE'     },
    { key: 'phone',     label: 'PHONE'    },
    ...buckets,
  ];
}

/* ---------- component ---------- */
export default function AgingReport() {
  const navigate = useNavigate();
  const today = useMemo(() => toYMD(new Date()), []);

  const [filters, setFilters] = useState({
    asOf: today,
    customer: '',
    onlyOverdue: true,
    groupBy: 'CUSTOMER',     // CUSTOMER | INVOICE
    sortBy: '',
    sortDir: 'DESC',
    page: 0,
    size: 20,
  });

  const cols = useMemo(() => buildColumns(filters.groupBy), [filters.groupBy]);

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) =>
    setFilters((f) => ({
      ...f,
      [k]: v,
      page: ['asOf','customer','onlyOverdue','groupBy','size'].includes(k) ? 0 : f.page,
    }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/reports/aging', {
        params: {
          asOf: filters.asOf,
          customer: filters.customer,
          overdueOnly: filters.onlyOverdue ? 1 : 0,
          groupBy: filters.groupBy,
          sortBy: filters.sortBy || undefined,
          sortDir: filters.sortDir,
          page: filters.page,
          size: filters.size,
        },
      });

      const items = data?.items ?? data ?? [];
      setRows(items);

      // server totals or compute client-side as fallback
      const t = data?.totals ?? sumTotals(items);
      setTotals(t);

      setCount(Number(data?.count ?? items.length));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  }, [
    filters.asOf,
    filters.customer,
    filters.onlyOverdue,
    filters.groupBy,
    filters.sortBy,
    filters.sortDir,
    filters.page,
    filters.size,
  ]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* sorting */
  const toggleSort = (key) => {
    setFilters((f) => {
      if (f.sortBy !== key) return { ...f, sortBy: key, sortDir: 'ASC', page: 0 };
      return { ...f, sortDir: f.sortDir === 'ASC' ? 'DESC' : 'ASC', page: 0 };
    });
  };
  const sortIndicator = (key) => (filters.sortBy === key ? (
    <span className="ar-sort">{filters.sortDir === 'ASC' ? '▲' : '▼'}</span>
  ) : null);

  /* pager */
  const next = () => setFilters((f) => ({ ...f, page: f.page + 1 }));
  const prev = () => setFilters((f) => ({ ...f, page: Math.max(0, f.page - 1) }));

  /* export */
  const exportExcel = useCallback(async () => {
    try {
      const mod = await import('xlsx');
      const XLSX = mod?.default ?? mod;

      const sheetData = (rows ?? []).map((r) =>
        Object.fromEntries(
          cols.map((c) => {
            let v = val(r, c.key);
            if (c.key === 'date' && v) v = toYMD(v);
            if (c.money) v = money(v);
            return [c.label, v ?? ''];
          })
        )
      );

      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Aging');
      XLSX.writeFile(wb, `Aging_${filters.asOf}_${filters.groupBy}.xlsx`);
    } catch (err) {
      console.error(err);
      setError(`Export failed: ${err.message}`);
    }
  }, [rows, cols, filters.asOf, filters.groupBy]);

  return (
    <div className="ar-wrap">
      {/* Header */}
      <div className="ar-header">
        <div className="ar-left">
          <button className="ar-iconbtn" aria-label="Home" onClick={() => navigate('/dashboard')}>
            <FaHome />
          </button>
          <h2 className="ar-title">Aging Report</h2>
        </div>
        <div className="ar-right">
          <button className="ar-close" aria-label="Close" onClick={() => navigate('/reports')}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ar-toolbar">
        <div className="ar-field">
          <label>As of</label>
          <input type="date" value={filters.asOf} onChange={(e) => setField('asOf', e.target.value)} />
        </div>
        <div className="ar-field">
          <label>Customer</label>
          <input
            placeholder="Name / Code / Phone"
            value={filters.customer}
            onChange={(e) => setField('customer', e.target.value)}
          />
        </div>
        <div className="ar-field">
          <label>Group By</label>
          <select value={filters.groupBy} onChange={(e) => setField('groupBy', e.target.value)}>
            {GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>

        <div className="ar-field chk">
          <label className="inline">
            <input
              type="checkbox"
              checked={filters.onlyOverdue}
              onChange={(e) => setField('onlyOverdue', e.target.checked)}
            />
            Only overdue
          </label>
        </div>

        <div className="ar-field">
          <label>Rows</label>
          <select value={filters.size} onChange={(e) => setField('size', Number(e.target.value))}>
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>

        <div className="ar-actions">
          <button className="act run" onClick={fetchData}>Run</button>
          <button className="act export" onClick={exportExcel}>Export</button>
          <button className="act print" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      {error && <div className="ar-error">{error}</div>}

      {/* Table */}
      <div className="ar-card">
        {loading ? (
          <div className="ar-loading">Loading…</div>
        ) : (
          <div className="ar-tablewrap">
            <table className="ar-table">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c.key}
                      style={{ textAlign: c.align || 'left' }}
                      className="ar-th-sortable"
                      onClick={() => toggleSort(c.key)}
                    >
                      <span className="ar-th-lbl">{c.label}</span>
                      {sortIndicator(c.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={cols.length} className="ar-empty">No data for selected filters</td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    {cols.map((c) => {
                      let v = val(r, c.key);
                      if (c.key === 'date' && v) v = toYMD(v);
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

      {/* Totals */}
      <div className="ar-summary">
        <div className="box"><div className="k">Current</div><div className="v">{money(totals.current)}</div></div>
        <div className="box"><div className="k">1–30</div>   <div className="v">{money(totals.d1_30)}</div></div>
        <div className="box"><div className="k">31–60</div>  <div className="v">{money(totals.d31_60)}</div></div>
        <div className="box"><div className="k">61–90</div>  <div className="v">{money(totals.d61_90)}</div></div>
        <div className="box"><div className="k">90+</div>    <div className="v">{money(totals.d91_plus)}</div></div>
        <div className="box"><div className="k">Total</div>  <div className="v">{money(totals.totalDue)}</div></div>
      </div>

      {/* Pager */}
      <div className="ar-pager">
        <button onClick={prev} disabled={filters.page === 0}>Prev</button>
        <span>Page {filters.page + 1}</span>
        <button onClick={next} disabled={(filters.page + 1) * filters.size >= count}>Next</button>
      </div>
    </div>
  );
}

/* ----- helpers ----- */
function val(row, key) {
  switch (key) {
    case 'party': return getters.party(row);
    case 'partyCode': return getters.partyCode(row);
    case 'phone': return getters.phone(row);
    case 'invoiceNo': return getters.invoiceNo(row);
    case 'date': return getters.date(row);
    case 'current': return getters.current(row);
    case 'd1_30': return getters.d1_30(row);
    case 'd31_60': return getters.d31_60(row);
    case 'd61_90': return getters.d61_90(row);
    case 'd91_plus': return getters.d91_plus(row);
    case 'totalDue': return getters.totalDue(row);
    default: return row[key];
  }
}

function sumTotals(items) {
  const t = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d91_plus: 0, totalDue: 0 };
  for (const r of items || []) {
    t.current  += getters.current(r);
    t.d1_30    += getters.d1_30(r);
    t.d31_60   += getters.d31_60(r);
    t.d61_90   += getters.d61_90(r);
    t.d91_plus += getters.d91_plus(r);
    t.totalDue += getters.totalDue(r);
  }
  return t;
}
