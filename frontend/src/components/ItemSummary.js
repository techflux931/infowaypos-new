import React, { useState } from 'react';
import './ItemSummary.css';
import PropTypes from 'prop-types';
import CalendarModal from './CalendarModal';
import ConfirmModal from './PrintModal';

const ItemSummary = ({ onClose }) => {
  const [groupBy, setGroupBy] = useState('GROUP');
  const [filterBy, setFilterBy] = useState('DATE');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectType, setSelectType] = useState('');
  const [groupByDate, setGroupByDate] = useState(false);
  const [includeStock, setIncludeStock] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDateClick = (target) => {
    setCalendarTarget(target);
    setShowCalendar(true);
  };

  const handleDateSelect = (date) => {
    const formatted = date.toLocaleDateString('en-GB');
    if (calendarTarget === 'from') setFromDate(formatted);
    if (calendarTarget === 'to') setToDate(formatted);
    setShowCalendar(false);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    window.print();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <div className="item-summary-modal">
      <div className="item-summary-header">
        <h2>ITEM SUMMARY REPORT</h2>
        <button className="close-button" onClick={onClose}>✖</button>
      </div>

      <div className="item-summary-body">
        <div className="top-section">
          <div className="group-by">
            <label htmlFor="group-button">Group by</label>
            <button
              id="group-button"
              className={groupBy === 'GROUP' ? 'active' : ''}
              onClick={() => setGroupBy('GROUP')}
            >
              GROUP
            </button>
            <button
              className={groupBy === 'CATEGORY' ? 'active' : ''}
              onClick={() => setGroupBy('CATEGORY')}
            >
              CATEGORY
            </button>
          </div>

          <div className="filter-by">
            

            <div className="filter-radio-group">
              <div className="filter-radio-option">
                <input
                  id="filter-date"
                  type="radio"
                  name="filter"
                  checked={filterBy === 'DATE'}
                  onChange={() => setFilterBy('DATE')}
                />
                <label htmlFor="filter-date">DATE</label>
                <div className="date-range">
                  <div className="date-field">
                    <span>FROM–</span>
                    <input
                      type="text"
                      value={fromDate}
                      readOnly
                      onClick={() => handleDateClick('from')}
                    />
                  </div>
                  <div className="date-field">
                    <span>TO–</span>
                    <input
                      type="text"
                      value={toDate}
                      readOnly
                      onClick={() => handleDateClick('to')}
                    />
                  </div>
                </div>
              </div>

              <div className="filter-radio-option">
                <input
                  id="filter-shift"
                  type="radio"
                  name="filter"
                  checked={filterBy === 'SHIFT'}
                  onChange={() => setFilterBy('SHIFT')}
                />
                <label htmlFor="filter-shift">SHIFT</label>
                <select>
                  <option>-- Select Shift --</option>
                  <option>Morning</option>
                  <option>Evening</option>
                </select>
              </div>

              <div className="filter-radio-option">
                <input
                  id="filter-day"
                  type="radio"
                  name="filter"
                  checked={filterBy === 'DAY'}
                  onChange={() => setFilterBy('DAY')}
                />
                <label htmlFor="filter-day">DAY</label>
                <select>
                  <option>-- Select Day --</option>
                  <option>Today</option>
                  <option>Yesterday</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="select-by-section">
          <div className="select-left">
            <label htmlFor="detailed">
              <input
                id="detailed"
                type="checkbox"
                checked={detailed}
                onChange={() => setDetailed(!detailed)}
              />
              {' '}Detailed
            </label>
          </div>
          <div className="select-right">
            <label htmlFor="group-select">
              <strong>{groupBy === 'CATEGORY' ? 'Category' : 'Group'}</strong>
            </label>
            <select
              id="group-select"
              value={selectType}
              onChange={(e) => setSelectType(e.target.value)}
            >
              <option value="">--Select--</option>
              {groupBy === 'CATEGORY' ? (
                <>
                  <option value="DEFAULT">DEFAULT CATEGORY</option>
                  <option value="BAKES">BAKES</option>
                </>
              ) : (
                <>
                  <option value="group">Group</option>
                  <option value="type">Type</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="check-section">
          <label htmlFor="groupByDate">
            <input
              id="groupByDate"
              type="checkbox"
              checked={groupByDate}
              onChange={() => setGroupByDate(!groupByDate)}
            />
            {' '}Group by Date
          </label>
          <label htmlFor="includeStock">
            <input
              id="includeStock"
              type="checkbox"
              checked={includeStock}
              onChange={() => setIncludeStock(!includeStock)}
            />
            {' '}Include Stock
          </label>
        </div>

        <div className="action-buttons">
          <button className="ok-btn" onClick={() => setShowConfirm(true)}><span>✔</span> Ok</button>
          <button className="close-btn" onClick={onClose}><span>✖</span> Close</button>
        </div>
      </div>

      {showCalendar && (
        <CalendarModal
          onSelect={handleDateSelect}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {showConfirm && (
        <ConfirmModal
          message="Print Report ?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

ItemSummary.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ItemSummary;
