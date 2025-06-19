import React, { useState } from 'react';
import './Customer.css';
import { FaCheckCircle, FaTimesCircle, FaPlusCircle } from 'react-icons/fa';

const mockCustomers = [
  { code: 'C001', name: 'John Doe', place: 'Abu Dhabi', contact: '0501234567' },
  { code: 'C002', name: 'Fatima Ali', place: 'Dubai', contact: '0509876543' },
  { code: 'C003', name: 'Ahmed Khan', place: 'Sharjah', contact: '0523456789' }
];

const Customer = () => {
  const [search, setSearch] = useState('');

  const filtered = mockCustomers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="customer-view-container">
      <h2>CUSTOMER</h2>
      <input
        type="text"
        placeholder="Search"
        className="customer-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="customer-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Code</th>
            <th>Name</th>
            <th>Place</th>
            <th>Contact</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((cust, i) => (
            <tr key={cust.code}>
              <td>{i + 1}</td>
              <td>{cust.code}</td>
              <td>{cust.name}</td>
              <td>{cust.place}</td>
              <td>{cust.contact}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="customer-actions">
        <button className="select-btn">
          <FaCheckCircle /> Select
        </button>
        <button className="add-btn">
          <FaPlusCircle /> Add New
        </button>
        <button className="close-btn">
          <FaTimesCircle /> Close
        </button>
      </div>
    </div>
  );
};

export default Customer;
