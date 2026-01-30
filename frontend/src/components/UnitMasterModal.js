// src/components/UnitMasterModal.js
import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './UnitMasterModal.css';

const UnitMasterModal = ({ onClose, onUnitAdded }) => {
  const [units, setUnits] = useState([]);
  const [formData, setFormData] = useState({ id: '', name: '', symbol: '', remarks: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await axios.get('/units');
      const updated = res.data.map(u => ({
        ...u,
        id: u.id || u._id // support both formats
      }));
      setUnits(updated);
    } catch (err) {
      console.error('❌ Error fetching units:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const { id, name, symbol, remarks } = formData;
      if (!name.trim() || !symbol.trim()) {
        alert('Unit Name and Symbol are required');
        return;
      }

      if (isEditing) {
        await axios.put(`/units/${id}`, { name, symbol, remarks });
      } else {
        await axios.post('/units', { name, symbol, remarks });
      }

      setFormData({ id: '', name: '', symbol: '', remarks: '' });
      setIsEditing(false);
      fetchUnits();
      if (onUnitAdded) onUnitAdded(name);
    } catch (err) {
      console.error('❌ Save error:', err);
    }
  };

  const handleEdit = (unit) => {
    setFormData({
      id: unit.id || unit._id,
      name: unit.name,
      symbol: unit.symbol,
      remarks: unit.remarks || ''
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure to delete this unit?')) {
      try {
        await axios.delete(`/units/${id}`);
        fetchUnits();
      } catch (err) {
        console.error('❌ Delete error:', err);
      }
    }
  };

  const handleReset = () => {
    setFormData({ id: '', name: '', symbol: '', remarks: '' });
    setIsEditing(false);
  };

  return (
    <div className="unit-modal-overlay">
      <div className="unit-modal-container">
        <div className="unit-form">
          <h3>Unit Details</h3>
          <input name="name" placeholder="Unit Name" value={formData.name} onChange={handleChange} />
          <input name="symbol" placeholder="Symbol" value={formData.symbol} onChange={handleChange} />
          <textarea name="remarks" placeholder="Remarks" value={formData.remarks} onChange={handleChange} />
          <div className="unit-buttons">
            <button className="btn blue" onClick={handleSave}>
              💾 {isEditing ? 'Update' : 'Save'}
            </button>
            <button className="btn orange" onClick={handleReset}>🔁 Reset</button>
            <button className="btn red" onClick={onClose}>❌ Close</button>
          </div>
        </div>

        <div className="unit-table-section">
          <table>
            <thead>
              <tr>
                <th>Unit Name</th>
                <th>Symbol</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td>{unit.name}</td>
                  <td>{unit.symbol}</td>
                  <td>{unit.remarks}</td>
                  <td>
                    <button onClick={() => handleEdit(unit)}>✏️</button>
                    <button onClick={() => handleDelete(unit.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr>
                  <td colSpan="4">No units added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UnitMasterModal;
