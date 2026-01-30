import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaTimes } from 'react-icons/fa';
import axios from '../../api/axios';
import './ExpenseReport.css';

/* ---------- utils ---------- */
const AED = new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' });
const money = (v) => AED.format(Number(v || 0));
const toYMD = (d) => {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const num = (v) => Number(v || 0);

/* tolerant getters (handle small backend name changes) */
const g = {
  date:     (r) => r.date ?? r.txnDate ?? r.createdAt ?? null,
  vno:      (r) => r.voucherNo ?? r.docNo ?? r.refNo ?? '',
  category: (r) => r.category ?? r.expenseCategory ?? '',
  vendor:   (r) => r.vendor ?? r.payee ?? r.supplier ?? '',
  notes:    (r) => r.notes ?? r.remarks ?? r.description ?? '',
  amount:   (r) => num(r.amount ?? r.baseAmount ?? r.subtotal),
  tax:      (r) => num(r.tax ?? r.vat ?? r.taxes),
  total:    (r) => num(r.total ?? r.gross ?? (g.amount(r) + g.tax(r))),
  count:    (r) => Number(r.count ?? r.items ?? r.bills ?? 0),
};

/* Group options */
const GROUPS = [
  { key: 'DETAIL',   label: 'Detail'   },
  { key: 'CATEGORY', label: 'Category' },
  { key: 'DAY',      label: 'Day'      },
  { key: 'VENDOR',   label: 'Vendor'   },
];

/* columns per group */
function buildCols(groupBy) {
  const moneyCols = [
    { key: 'amount', label: 'AMOUNT', align: 'right', money: true },
    { key: 'tax',    label: 'TAX',    align: 'right', money: true },
    { key: 'total',  label: 'TOTAL',  align: 'right', money: true },
  ];

  if (groupBy === 'DETAIL') {
    return [
      { key: 'date',     label: 'DATE' },
      { key: 'vno',      label: 'VOUCHER #' },
      { key: 'category', label: 'CATEGORY' },
      { key: 'vendor',   label: 'VENDOR' },
      { key: 'notes',    label: 'NOTES' },
      ...moneyCols,
    ];
  }

  if (groupBy === 'CATEGORY') {
    return [
      { key: 'category', label: 'CATEGORY' },
      { key: 'count',    label: 'COUNT', align: 'right' },
      ...moneyCols,
    ];
  }

  if (groupBy === 'DAY') {
    return [
      { key: 'date',  label: 'DATE' },
      { key: 'count', label: 'COUNT', align: 'right' },
      ...moneyCols,
    ];
  }

  // VENDOR
  return [
    { key: 'vendor', label: 'VENDOR' },
    { key: 'count',  label: 'COUNT', align: 'right' },
    ...moneyCols,
  ];
}

/* ---------- component ---------- */
export default function ExpenseReport() {
  const navigate = useNavigate();
  const today = useMemo(() => toYMD(new Date()), []);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
    category: '',
    q: '',
    groupBy: 'DETAIL',      // DETAIL | CATEGORY | DAY | VENDOR
    sortBy: 'date',
    sortDir: 'DESC',
    page: 0,
    size: 20,
  });

  const cols = useMemo(() => buildCols(filters.groupBy), [filters.groupBy]);

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ amount: 0, tax: 0, total: 0, count: 0 });
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) =>
    setFilters((f) => ({
      ...f,
      [k]: v,
      page: ['from','to','category','q','groupBy','size'].includes(k) ? 0 : f.page,
    }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/reports/expenses', {
        params: {
          from: filters.from,
          to: filters.to,
          category: filters.category || undefined,
          q: filters.q || undefined,              // notes/vendor search
          groupBy: filters.groupBy,
          sortBy: filters.sortBy,
          sortDir: filters.sortDir,
          page: filters.page,
          size: filters.size,
        },
      });

      const items = data?.items ?? data ?? [];
      setRows(items);

      const t = data?.totals ?? sumTotals(items, filters.groupBy);
      setTotals({
        amount: num(t.amount),
        tax:    num(t.tax),
        total:  num(t.total),
        count:  Number(t.count ?? items.length),
      });

      setCount(Number(data?.count ?? items.length));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  }, [
    filters.from, filters.to, filters.category, filters.q,
    filters.groupBy, filters.sortBy, filters.sortDir, filters.page, filters.size
  ]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* sorting */
  const toggleSort = (key) => {
    setFilters((f) => {
      if (f.sortBy !== key) return { ...f, sortBy: key, sortDir: 'ASC', page: 0 };
      return { ...f, sortDir: f.sortDir === 'ASC' ? 'DESC' : 'ASC', page: 0 };
    });
  };
  const sortIndicator = (key) =>
    filters.sortBy === key ? <span className="exr-sort">{filters.sortDir === 'ASC' ? '▲' : '▼'}</span> : null;

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
            let v;
            switch (c.key) {
              case 'date':     v = g.date(r) ? toYMD(g.date(r)) : ''; break;
              case 'vno':      v = g.vno(r); break;
              case 'category': v = g.category(r); break;
              case 'vendor':   v = g.vendor(r); break;
              case 'notes':    v = g.notes(r); break;
              case 'count':    v = g.count(r); break;
              case 'amount':   v = g.amount(r); break;
              case 'tax':      v = g.tax(r); break;
              case 'total':    v = g.total(r); break;
              default:         v = r[c.key];
            }
            if (c.money) v = money(v);
            return [c.label, v ?? ''];
          })
        )
      );

      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
      XLSX.writeFile(wb, `Expense_Report_${filters.from}_${filters.to}_${filters.groupBy}.xlsx`);
    } catch (err) {
      console.error(err);
      setError(`Export failed: ${err.message}`);
    }
  }, [rows, cols, filters.from, filters.to, filters.groupBy]);

  return (
    <div className="exr-wrap">
      {/* Header */}
      <div className="exr-header">
        <div className="exr-left">
          <button className="exr-iconbtn" aria-label="Home" onClick={() => navigate('/dashboard')}>
            <FaHome />
          </button>
          <h2 className="exr-title">Expense Report</h2>
        </div>
        <div className="exr-right">
          <button className="exr-close" aria-label="Close" onClick={() => navigate('/reports')}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="exr-toolbar">
        <div className="exr-field">
          <label>From</label>
          <input type="date" value={filters.from} onChange={(e) => setField('from', e.target.value)} />
        </div>
        <div className="exr-field">
          <label>To</label>
          <input type="date" value={filters.to} onChange={(e) => setField('to', e.target.value)} />
        </div>

        <div className="exr-field">
          <label>Category</label>
          <input
            placeholder="Category name"
            value={filters.category}
            onChange={(e) => setField('category', e.target.value)}
          />
        </div>

        <div className="exr-field grow">
          <label>Search</label>
          <input
            placeholder="Notes / Vendor"
            value={filters.q}
            onChange={(e) => setField('q', e.target.value)}
          />
        </div>

        <div className="exr-field">
          <label>Group By</label>
          <select value={filters.groupBy} onChange={(e) => setField('groupBy', e.target.value)}>
            {GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>

        <div className="exr-field">
          <label>Rows</label>
          <select value={filters.size} onChange={(e) => setField('size', Number(e.target.value))}>
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>

        <div className="exr-actions">
          <button className="act run" onClick={fetchData}>Run</button>
          <button className="act export" onClick={exportExcel}>Export</button>
          <button className="act print" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      {error && <div className="exr-error">{error}</div>}

      {/* Table */}
      <div className="exr-card">
        {loading ? (
          <div className="exr-loading">Loading…</div>
        ) : (
          <div className="exr-tablewrap">
            <table className="exr-table">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c.key}
                      className="exr-th-sortable"
                      style={{ textAlign: c.align || 'left' }}
                      onClick={() => toggleSort(c.key)}
                    >
                      <span className="exr-th-lbl">{c.label}</span>
                      {sortIndicator(c.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={cols.length} className="exr-empty">No data for selected filters</td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    {cols.map((c) => {
                      let v;
                      switch (c.key) {
                        case 'date':     v = g.date(r) ? toYMD(g.date(r)) : ''; break;
                        case 'vno':      v = g.vno(r); break;
                        case 'category': v = g.category(r); break;
                        case 'vendor':   v = g.vendor(r); break;
                        case 'notes':    v = g.notes(r); break;
                        case 'count':    v = g.count(r); break;
                        case 'amount':   v = g.amount(r); break;
                        case 'tax':      v = g.tax(r); break;
                        case 'total':    v = g.total(r); break;
                        default:         v = r[c.key];
                      }
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
      <div className="exr-summary">
        {(filters.groupBy !== 'DETAIL') && (
          <div className="box"><div className="k">Count</div> <div className="v">{totals.count ?? 0}</div></div>
        )}
        <div className="box"><div className="k">Amount</div> <div className="v">{money(totals.amount)}</div></div>
        <div className="box"><div className="k">Tax</div>    <div className="v">{money(totals.tax)}</div></div>
        <div className="box"><div className="k">Total</div>  <div className="v">{money(totals.total)}</div></div>
      </div>

      {/* Pager */}
      <div className="exr-pager">
        <button onClick={prev} disabled={filters.page === 0}>Prev</button>
        <span>Page {filters.page + 1}</span>
        <button onClick={next} disabled={(filters.page + 1) * filters.size >= count}>Next</button>
      </div>
    </div>
  );
}

/* ----- totals helper ----- */
function sumTotals(items, groupBy) {
  const t = { amount: 0, tax: 0, total: 0, count: 0 };
  for (const r of items || []) {
    t.amount += g.amount(r);
    t.tax    += g.tax(r);
    t.total  += g.total(r);
    if (groupBy !== 'DETAIL') t.count += g.count(r) || 1;
  }
  return t;
}
