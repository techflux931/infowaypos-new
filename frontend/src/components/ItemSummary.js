// src/components/ItemSummary.js
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import './ItemSummary.css';

import CalendarModal from './CalendarModal';
import ConfirmModal from './PrintModal';

export default function ItemSummary({ onClose }) {
  const [groupBy, setGroupBy] = useState('GROUP');     // GROUP | CATEGORY
  const [filterBy, setFilterBy] = useState('DATE');    // DATE | SHIFT | DAY
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(''); // 'from' | 'to'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [shift, setShift] = useState('');
  const [day, setDay] = useState('');
  const [selectType, setSelectType] = useState('');
  const [groupByDate, setGroupByDate] = useState(false);
  const [includeStock, setIncludeStock] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Esc closes; Enter opens print confirm
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') setShowConfirm(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const openCalendar = (target) => {
    if (filterBy !== 'DATE') return;
    setCalendarTarget(target);
    setShowCalendar(true);
  };

  const handleDateSelect = (date) => {
    const formatted = date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    if (calendarTarget === 'from') setFromDate(formatted);
    if (calendarTarget === 'to') setToDate(formatted);
    setShowCalendar(false);
  };

  const onPrintConfirm = () => {
    setShowConfirm(false);
    window.print(); // TODO: replace with API call
  };

  return (
    <>
      {/* Backdrop */}
      <div className="is-backdrop" onClick={onClose} />

      {/* Modal */}
      <div
        className="item-summary-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Item Summary Report"
      >
        <div className="item-summary-header">
          <h2>ITEM SUMMARY REPORT</h2>
          <button type="button" className="is-close" onClick={onClose} aria-label="Close">
            ✖
          </button>
        </div>

        <div className="item-summary-body">
          {/* Top row */}
          <div className="is-top">
            {/* Group by */}
            <div className="is-groupby">
              <label className="is-label">Group by</label>
              <div className="is-pills">
                <button
                  type="button"
                  className={groupBy === 'GROUP' ? 'is-pill active' : 'is-pill'}
                  onClick={() => setGroupBy('GROUP')}
                >
                  GROUP
                </button>
                <button
                  type="button"
                  className={groupBy === 'CATEGORY' ? 'is-pill active' : 'is-pill'}
                  onClick={() => setGroupBy('CATEGORY')}
                >
                  CATEGORY
                </button>
              </div>
            </div>

            {/* Filter by */}
            <div className="is-filter">
              {/* DATE */}
              <div className="is-filter-row">
                <input
                  id="f-date"
                  type="radio"
                  name="filter"
                  checked={filterBy === 'DATE'}
                  onChange={() => setFilterBy('DATE')}
                />
                <label htmlFor="f-date">DATE</label>

                <div className="is-date-range">
                  <div className="is-date">
                    <span>FROM—</span>
                    <input
                      type="text"
                      value={fromDate}
                      readOnly
                      placeholder="Select"
                      onClick={() => openCalendar('from')}
                      disabled={filterBy !== 'DATE'}
                    />
                  </div>
                  <div className="is-date">
                    <span>TO—</span>
                    <input
                      type="text"
                      value={toDate}
                      readOnly
                      placeholder="Select"
                      onClick={() => openCalendar('to')}
                      disabled={filterBy !== 'DATE'}
                    />
                  </div>
                </div>
              </div>

              {/* SHIFT */}
              <div className="is-filter-row">
                <input
                  id="f-shift"
                  type="radio"
                  name="filter"
                  checked={filterBy === 'SHIFT'}
                  onChange={() => setFilterBy('SHIFT')}
                />
                <label htmlFor="f-shift">SHIFT</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  disabled={filterBy !== 'SHIFT'}
                >
                  <option value="">-- Select Shift --</option>
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>

              {/* DAY */}
              <div className="is-filter-row">
                <input
                  id="f-day"
                  type="radio"
                  name="filter"
                  checked={filterBy === 'DAY'}
                  onChange={() => setFilterBy('DAY')}
                />
                <label htmlFor="f-day">DAY</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  disabled={filterBy !== 'DAY'}
                >
                  <option value="">-- Select Day --</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                </select>
              </div>
            </div>
          </div>

          {/* Select & flags */}
          <div className="is-select-row">
            <label className="is-checkbox">
              <input
                type="checkbox"
                checked={detailed}
                onChange={() => setDetailed((v) => !v)}
              />
              Detailed
            </label>

            <div className="is-select">
              <label htmlFor="group-select">
                <strong>{groupBy === 'CATEGORY' ? 'Category' : 'Group'}</strong>
              </label>
              <select
                id="group-select"
                value={selectType}
                onChange={(e) => setSelectType(e.target.value)}
              >
                <option value="">-- Select --</option>
                {groupBy === 'CATEGORY' ? (
                  <>
                    <option value="DEFAULT">DEFAULT CATEGORY</option>
                    <option value="BAKES">BAKES</option>
                  </>
                ) : (
                  <>
                    <option value="Group">Group</option>
                    <option value="Type">Type</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="is-flags">
            <label className="is-checkbox">
              <input
                type="checkbox"
                checked={groupByDate}
                onChange={() => setGroupByDate((v) => !v)}
              />
            Group by Date
            </label>

            <label className="is-checkbox">
              <input
                type="checkbox"
                checked={includeStock}
                onChange={() => setIncludeStock((v) => !v)}
              />
            Include Stock
            </label>
          </div>

          <div className="is-actions">
            <button type="button" className="is-ok" onClick={() => setShowConfirm(true)}>
              ✓ Ok
            </button>
            <button type="button" className="is-closebtn" onClick={onClose}>
              ✖ Close
            </button>
          </div>
        </div>

        {/* Calendar in a portal so it stacks above all modals */}
        {showCalendar &&
          createPortal(
            <div className="calendar-layer">
              <CalendarModal
                onSelect={handleDateSelect}
                onClose={() => setShowCalendar(false)}
              />
            </div>,
            document.body
          )
        }

        {/* Print confirm in portal too */}
        {showConfirm &&
          createPortal(
            <div className="calendar-layer">
              <ConfirmModal
                message="Print Report ?"
                onConfirm={onPrintConfirm}
                onCancel={() => setShowConfirm(false)}
              />
            </div>,
            document.body
          )
        }
      </div>
    </>
  );
}

ItemSummary.propTypes = {
  onClose: PropTypes.func.isRequired,
};
