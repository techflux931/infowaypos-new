// src/components/Sales/CustomerPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import './CustomerPage.css';

// Keep a single, consistent shape for the form
const emptyCustomer = {
  id: '',
  code: '',
  firstName: '',
  lastName: '',
  addressType: '',
  address: '',
  day: '',
  dispenser: '',
  bottle: '',
  trn: '',
  place: '',
  state: '',
  nationality: '',
  contactPerson: '',
  mobileNo: '',
  phoneNo: '',
  email: '',
  creditPeriod: '',
  creditAmount: '',
  joinDate: '',
  customerType: '',
  remark: '',
};

// Make incoming records robust to casing / _id vs id
function normalizeCustomer(c = {}) {
  return {
    id: c.id ?? c.Id ?? c._id ?? '',
    code: c.code ?? c.Code ?? '',
    firstName: c.firstName ?? c.FirstName ?? '',
    lastName: c.lastName ?? c.LastName ?? '',
    addressType: c.addressType ?? c.AddressType ?? '',
    address: c.address ?? c.Address ?? '',
    day: c.day ?? c.Day ?? '',
    dispenser: c.dispenser ?? c.Dispenser ?? '',
    bottle: c.bottle ?? c.Bottle ?? '',
    trn: c.trn ?? c.TRN ?? '',
    place: c.place ?? c.Place ?? '',
    state: c.state ?? c.State ?? '',
    nationality: c.nationality ?? c.Nationality ?? '',
    contactPerson: c.contactPerson ?? c.ContactPerson ?? '',
    mobileNo: c.mobileNo ?? c.MobileNo ?? '',
    phoneNo: c.phoneNo ?? c.PhoneNo ?? '',
    email: c.email ?? c.Email ?? '',
    creditPeriod: c.creditPeriod ?? c.CreditPeriod ?? '',
    creditAmount: c.creditAmount ?? c.CreditAmount ?? '',
    joinDate: c.joinDate ?? c.JoinDate ?? '',
    customerType: c.customerType ?? c.CustomerType ?? '',
    remark: c.remark ?? c.Remark ?? '',
  };
}

const CustomerPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyCustomer);
  const [customerList, setCustomerList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [search, setSearch] = useState({ code: '', name: '', type: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const res = await axios.get('/customers');
      const rows = Array.isArray(res.data) ? res.data : [];
      setCustomerList(rows.map(normalizeCustomer));
    } catch (err) {
      console.error('Failed to load customers', err);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }

  async function handleSave() {
    // simple validation
    if (!formData.code?.trim() || !formData.firstName?.trim()) {
      alert('Please enter at least Code and First Name.');
      return;
    }

    try {
      if (formData.id) {
        await axios.put(`/customers/${formData.id}`, formData);
      } else {
        await axios.post('/customers', formData);
      }
      await fetchCustomers();
      setFormData(emptyCustomer);
      setEditIndex(null);
      alert('✅ Saved');
    } catch (err) {
      console.error('Save failed', err);
      alert('❌ Save failed');
    }
  }

  function handleEdit(index) {
    const selected = customerList[index];
    setFormData(normalizeCustomer(selected));
    setEditIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(index) {
    const id = customerList[index]?.id;
    if (!id) return;
    if (!window.confirm('Delete this customer?')) return;

    try {
      await axios.delete(`/customers/${id}`);
      await fetchCustomers();
      if (editIndex === index) {
        setFormData(emptyCustomer);
        setEditIndex(null);
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('❌ Delete failed');
    }
  }

  function handleSearchChange(e) {
    const { name, value } = e.target;
    setSearch((p) => ({ ...p, [name]: value }));
  }

  // Filtering
  const filteredList = customerList.filter((c) => {
    const byCode = (c.code || '').toLowerCase().includes(search.code.toLowerCase());
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
    const byName = fullName.includes(search.name.toLowerCase());
    const byType = !search.type || (c.customerType || '').toLowerCase() === search.type.toLowerCase();
    return byCode && byName && byType;
  });

  // For a nice order in the form
  const fieldOrder = [
    'code',
    'firstName',
    'lastName',
    'addressType',
    'address',
    'day',
    'dispenser',
    'bottle',
    'trn',
    'place',
    'state',
    'nationality',
    'contactPerson',
    'mobileNo',
    'phoneNo',
    'email',
    'creditPeriod',
    'creditAmount',
    'joinDate',
    'customerType',
    'remark',
  ];

  const labelize = (key) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase());

  return (
    <div className="customer-page">
      <div className="customer-form">
        <div className="customer-header">
          <h2>Customer Entry</h2>
          <div className="actions">
            <button className="home-btn" title="Dashboard" onClick={() => navigate('/dashboard')}>
              🏠
            </button>
            <button className="close-btn" title="Back to Sales" onClick={() => navigate('/sales')}>
              X
            </button>
          </div>
        </div>

        <div className="form-grid">
          {fieldOrder.map((key) => (
            <div key={key} className="form-group">
              <label>{labelize(key)}</label>
              <input
                type={
                  key === 'joinDate'
                    ? 'date'
                    : key === 'creditAmount'
                    ? 'number'
                    : key === 'email'
                    ? 'email'
                    : 'text'
                }
                step={key === 'creditAmount' ? '0.01' : undefined}
                name={key}
                value={formData[key] ?? ''}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="save" onClick={handleSave}>
            {formData.id ? 'Update' : 'Save'}
          </button>
          <button className="reset" onClick={() => setFormData(emptyCustomer)}>
            Reset
          </button>
          <button className="close" onClick={() => navigate('/dashboard')}>
            Close
          </button>
        </div>
      </div>

      <div className="customer-table">
        <h2>Customer List</h2>

        <div className="search-panel">
          <input
            type="text"
            name="code"
            placeholder="🔎 Code"
            value={search.code}
            onChange={handleSearchChange}
          />
          <input
            type="text"
            name="name"
            placeholder="🔎 Name"
            value={search.name}
            onChange={handleSearchChange}
          />
          <select name="type" value={search.type} onChange={handleSearchChange}>
            <option value="">All</option>
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Type</th>
                <th>CR Period</th>
                <th>CR Amt</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length ? (
                filteredList.map((c, idx) => (
                  <tr key={c.id || idx}>
                    <td>{c.code || '-'}</td>
                    <td>{`${c.firstName || ''} ${c.lastName || ''}`.trim() || '-'}</td>
                    <td>{c.mobileNo || '-'}</td>
                    <td>{c.phoneNo || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.customerType || '-'}</td>
                    <td>{c.creditPeriod || '-'}</td>
                    <td>{c.creditAmount || '-'}</td>
                    <td>
                      <button onClick={() => handleEdit(idx)}>✏️</button>
                      <button onClick={() => handleDelete(idx)}>🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center' }}>
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerPage;
