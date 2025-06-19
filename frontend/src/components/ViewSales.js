// ViewSales.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CalendarModal from './CalendarModal';
import './ViewSales.css';
import { FaSearch, FaPrint, FaEdit, FaTrashAlt, FaCopy, FaTimes } from 'react-icons/fa';

const ViewSales = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [targetField, setTargetField] = useState('');

  const openCalendar = (field) => {
    setTargetField(field);
    setShowCalendar(true);
  };

  const handleDateSelect = (date) => {
    const formatted = new Date(date).toLocaleDateString('en-GB');
    if (targetField === 'from') setFromDate(formatted);
    if (targetField === 'to') setToDate(formatted);
    setShowCalendar(false);
  };

  return (
    <div className="view-sales-modal">
      <div className="view-sales-header">
        <h2>VIEW SALES</h2>
        <button className="close-button" onClick={onClose}><FaTimes /></button>
      </div>

      <div className="view-sales-filters">
        <div className="search-group">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <input
          type="text"
          placeholder="Date From"
          value={fromDate}
          onClick={() => openCalendar('from')}
          readOnly
        />
        <input
          type="text"
          placeholder="Date To"
          value={toDate}
          onClick={() => openCalendar('to')}
          readOnly
        />
      </div>

      <table className="sales-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Date</th>
            <th>Invoice No</th>
            <th>Customer</th>
            <th>Net Amount</th>
          </tr>
        </thead>
        <tbody>
          {/* Sales data rows go here */}
        </tbody>
      </table>

      <div className="view-sales-divider"></div>

      <div className="view-sales-actions">
        <button className="reprint-btn"><FaPrint /> Reprint</button>
        <button className="edit-btn"><FaEdit /> Edit</button>
        <button className="delete-btn"><FaTrashAlt /> Delete</button>
        <button className="copy-btn"><FaCopy /> Copy</button>
        <button className="close-btn" onClick={onClose}><FaTimes /> Close</button>
      </div>

      {showCalendar && (
        <CalendarModal onClose={() => setShowCalendar(false)} onSelect={handleDateSelect} />
      )}
    </div>
  );
};

ViewSales.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ViewSales;
