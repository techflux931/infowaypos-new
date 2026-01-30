import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarModal.css';

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const CalendarModal = ({ onClose, onSelect, initialDate }) => {
  // selected date (what user will confirm)
  const [selectedDate, setSelectedDate] = useState(() => initialDate ? new Date(initialDate) : new Date());
  // which month the calendar is currently showing
  const [activeStartDate, setActiveStartDate] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // month/year for the dropdowns
  const activeYear = activeStartDate.getFullYear();
  const activeMonth = activeStartDate.getMonth(); // 0..11

  // build a reasonable year range (±50 years around today)
  const years = useMemo(() => {
    const nowY = new Date().getFullYear();
    const start = nowY - 50;
    const end = nowY + 50;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, []);

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const handleConfirm = () => {
    onSelect(selectedDate);
    onClose();
  };

  const handleMonthChange = (e) => {
    const m = clamp(parseInt(e.target.value, 10), 0, 11);
    setActiveStartDate(new Date(activeYear, m, 1));
  };

  const handleYearChange = (e) => {
    const y = parseInt(e.target.value, 10);
    setActiveStartDate(new Date(y, activeMonth, 1));
  };

  return (
    <div className="calendar-overlay">
      <div className="calendar-popup">
        <div className="calendar-header">
          <h3>SELECT DATE</h3>
          <button className="close-icon" onClick={onClose} aria-label="Close">✖</button>
        </div>

        {/* Month/Year selectors */}
        <div className="calendar-topbar">
          <select
            aria-label="Month"
            value={activeMonth}
            onChange={handleMonthChange}
            className="cal-select"
          >
            {['January','February','March','April','May','June','July','August','September','October','November','December']
              .map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>

          <select
            aria-label="Year"
            value={activeYear}
            onChange={handleYearChange}
            className="cal-select"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          // control which month is shown
          activeStartDate={activeStartDate}
          onActiveStartDateChange={({ activeStartDate: d }) => d && setActiveStartDate(d)}
          // nice nav: include « » to jump a year
          prev2Label="«"
          next2Label="»"
          calendarType="gregory"
          locale="en-GB"
          className="styled-calendar"
          showNeighboringMonth
        />

        <div className="calendar-buttons">
          <button className="select-btn" onClick={handleConfirm}>✔ Select</button>
          <button className="close-btn" onClick={onClose}>✖ Close</button>
        </div>
      </div>
    </div>
  );
};

CalendarModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  initialDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string])
};

export default CalendarModal;
