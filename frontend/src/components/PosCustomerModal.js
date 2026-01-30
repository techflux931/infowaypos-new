import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from '../api/axios';
import './PosCustomerModal.css';

const PosCustomerModal = ({ onSelect, onClose }) => {
  const [type, setType] = useState('Cash');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
    }
  };

  const handleAdd = async () => {
    if (code && name && phone && address) {
      const newCustomer = {
        type,
        code,
        name,
        phoneNo: phone,
        mobileNo: phone,
        address
      };
      try {
        const res = await axios.post('/customers', newCustomer);
        setCustomers([...customers, res.data]);
        setCode('');
        setName('');
        setPhone('');
        setAddress('');
      } catch (error) {
        console.error('❌ Error adding customer:', error);
        alert('Failed to add customer');
      }
    } else {
      alert('Please fill all fields');
    }
  };

  const handleSelect = (cust) => {
    if (onSelect) onSelect(cust);
    onClose();
  };

  const filteredCustomers = customers.filter((cust) => {
    const nameVal = typeof cust.name === 'string' ? cust.name.toLowerCase() : '';
    const codeVal = typeof cust.code === 'string' ? cust.code.toLowerCase() : '';
    const search = searchTerm.toLowerCase();
    return nameVal.includes(search) || codeVal.includes(search);
  });

  return (
    <div className="pos-customer-modal">
      <div className="modal-header">
        <h3>Customer Entry</h3>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <div className="radio-group">
        <label>
          <input type="radio" value="Cash" checked={type === 'Cash'} onChange={() => setType('Cash')} />
          Cash
        </label>
        <label>
          <input type="radio" value="Credit" checked={type === 'Credit'} onChange={() => setType('Credit')} />
          Credit
        </label>
      </div>

      <div className="input-group">
        <input type="text" placeholder="Customer Code" value={code} onChange={(e) => setCode(e.target.value)} />
        <input type="text" placeholder="Customer Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <button className="add-btn" onClick={handleAdd}>Add</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name or code"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="search-btn">Search</button>
      </div>

      <table className="customer-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Code</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map((cust, index) => (
            <tr key={index}>
              <td>{cust.type}</td>
              <td>{cust.code}</td>
              <td>{cust.name}</td>
              <td>{cust.phone || cust.phoneNo || cust.mobileNo || '-'}</td>
              <td>{cust.address}</td>
              <td>
                <button className="select-btn" onClick={() => handleSelect(cust)}>✔</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

PosCustomerModal.propTypes = {
  onSelect: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

export default PosCustomerModal;
