
import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import './AddCustomerModal';
import AddCustomerModal from './AddCustomerModal';

const Customer = ({ onClose, onSelect }) => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('❌ Error loading customers:', error);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchSearch =
      customer.name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.code?.toLowerCase().includes(search.toLowerCase());
    const matchType =
      typeFilter === 'All' || customer.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="customer-container">
      <h2><span role="img" aria-label="home">🏠</span> CUSTOMER</h2>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="type-filter">
          <span>Type: </span>
          <label><input type="radio" value="All" checked={typeFilter === 'All'} onChange={() => setTypeFilter('All')} /> All</label>
          <label><input type="radio" value="Cash" checked={typeFilter === 'Cash'} onChange={() => setTypeFilter('Cash')} /> Cash</label>
          <label><input type="radio" value="Credit" checked={typeFilter === 'Credit'} onChange={() => setTypeFilter('Credit')} /> Credit</label>
        </div>
      </div>

      <table className="customer-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Code</th>
            <th>Name</th>
            <th>Place</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map((customer, index) => (
            <tr key={customer._id}>
              <td>{index + 1}</td>
              <td>{customer.code}</td>
              <td>{customer.name}</td>
              <td>{customer.address}</td>
              <td>{customer.phone}</td>
              <td>{customer.email || '-'}</td>
              <td>{customer.type}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="customer-buttons">
        <button className="btn-green" onClick={() => onSelect && onSelect()}>
          ✅ Select
        </button>
        <button className="btn-blue" onClick={() => setShowAddModal(true)}>
          ➕ Add New
        </button>
        <button className="btn-red" onClick={onClose}>
          ❌ Close
        </button>
      </div>

      {showAddModal && (
        <AddCustomerModal
          onClose={() => {
            setShowAddModal(false);
            fetchCustomers(); // refresh after add
          }}
        />
      )}
    </div>
  );
};

export default CustomerModal;
