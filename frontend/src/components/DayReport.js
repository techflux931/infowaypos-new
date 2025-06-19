import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CalendarModal from './CalendarModal';
import ConfirmModal from './PrintModal';
import './DayReport.css';

const DayReport = ({ onClose }) => {
  const [filter, setFilter] = useState('DATE');
  const [a5Checked, setA5Checked] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedDay, setSelectedDay] = useState('2025-05-24T00:00');
  const [showCalendar, setShowCalendar] = useState(false);
  const [targetField, setTargetField] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const openCalendar = (target) => {
    setTargetField(target);
    setShowCalendar(true);
  };

  const handleDateSelect = (date) => {
    const formatted = date.toLocaleDateString('en-GB');
    if (targetField === 'from') setFromDate(formatted);
    if (targetField === 'to') setToDate(formatted);
    setShowCalendar(false);
  };

  const handleOk = () => setShowConfirm(true);
  const handleConfirm = () => {
    setShowConfirm(false);
    window.print();
  };
  const handleCancel = () => setShowConfirm(false);

  return (
    <div className="day-report-modal">
      <div className="day-report-header">
        <h2>DAY REPORT</h2>
        <button className="close-button" onClick={onClose}>✖</button>
      </div>

      <div className="day-report-body">
        <fieldset className="filter-section">
          <legend>Filter by</legend>

          <div className="filter-option">
            <label htmlFor="filter-date">
              <input
                type="radio"
                id="filter-date"
                name="filter"
                checked={filter === 'DATE'}
                onChange={() => setFilter('DATE')}
              />
              <span>DATE</span>
            </label>
            {filter === 'DATE' && (
              <div className="date-range">
                <button id="from-date" onClick={() => openCalendar('from')}>
                  FROM : {fromDate}
                </button>
                <button id="to-date" onClick={() => openCalendar('to')}>
                  TO : {toDate}
                </button>
              </div>
            )}
          </div>

          <div className="filter-option">
            <label htmlFor="filter-day">
              <input
                type="radio"
                id="filter-day"
                name="filter"
                checked={filter === 'DAY'}
                onChange={() => setFilter('DAY')}
              />
              <span>DAY</span>
            </label>
            {filter === 'DAY' && (
              <input
                type="datetime-local"
                className="day-time-input"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              />
            )}
          </div>
        </fieldset>

        <div className="checkbox-section">
          <label htmlFor="a5-check">
            <input
              id="a5-check"
              type="checkbox"
              checked={a5Checked}
              onChange={() => setA5Checked(!a5Checked)}
            />
            <span>A5</span>
          </label>
        </div>

        <div className="day-report-actions">
          <button className="ok-btn" onClick={handleOk}>✔ Ok</button>
          <button className="close-btn" onClick={onClose}>✖ Close</button>
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

DayReport.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default DayReport;
