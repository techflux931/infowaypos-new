import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './CustomerModal.css';

const CstModel = ({ onSelect, onClose }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [contact, setContact] = useState('');
  const [customers, setCustomers] = useState([]);

  const handleAdd = () => {
    if (code && name && place && contact) {
      const newCustomer = { code, name, place, contact };
      setCustomers([...customers, newCustomer]);
      setCode('');
      setName('');
      setPlace('');
      setContact('');
    }
  };

  return (
    <div className="customer-modal">
      <div className="customer-header">
        <h2>Customer</h2>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <input type="text" placeholder="Customer Code" value={code} onChange={(e) => setCode(e.target.value)} />
      <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="text" placeholder="Place" value={place} onChange={(e) => setPlace(e.target.value)} />
      <input type="text" placeholder="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />

      <div className="button-row">
        <button className="select-btn" onClick={() => onSelect && onSelect({ code, name, place, contact })}>✔ Select</button>
        <button className="add-btn" onClick={handleAdd}>➕ Add</button>
      </div>

      <table className="customer-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Place</th>
            <th>Contact</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((cust) => (
            <tr key={cust.code}>
              <td>{cust.code}</td>
              <td>{cust.name}</td>
              <td>{cust.place}</td>
              <td>{cust.contact}</td>
              <td>
                <button onClick={() => onSelect && onSelect(cust)}>Select</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

CstModel.propTypes = {
  onSelect: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

export default CstModel;
