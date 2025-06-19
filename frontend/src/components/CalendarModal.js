import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarModal.css';

const CalendarModal = ({ onClose, onSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleConfirm = () => {
    onSelect(selectedDate);
    onClose();
  };

  return (
    <div className="calendar-overlay">
      <div className="calendar-popup">
        <div className="calendar-header">
          <h3>SELECT DATE</h3>
          <button className="close-icon" onClick={onClose}>✖</button>
        </div>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          calendarType="gregory"
          locale="en-US"
          className="styled-calendar"
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
};

export default CalendarModal;
