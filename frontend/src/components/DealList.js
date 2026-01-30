// src/components/DealList.jsx
import React from 'react';
import axios from '../api/axios';
import './styles/DealList.css';

const uaeOk = (n) => /^\+9715\d{8}$/.test(n || '');

const DealList = ({ deals }) => {
  const downloadSingle = async (deal) => {
    try {
      const res = await axios.get(`/deals/${deal.id || deal._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `deal_${deal.id || deal._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('❌ Download failed for this deal.');
    }
  };

  const sendOne = async (deal) => {
    const mobile = prompt('Enter UAE mobile (+9715XXXXXXXXX):', '+971');
    if (!mobile || !uaeOk(mobile.trim())) return alert('Invalid number. Use +9715XXXXXXXXX');
    try {
      await axios.post(`/deals/${deal.id || deal._id}/send`, { mobile: mobile.trim() });
      alert('✅ WhatsApp sent!');
    } catch {
      alert('❌ WhatsApp failed.');
    }
  };

  return (
    <div className="deal-list">
      <h2>Available Deals</h2>
      {deals.length === 0 ? (
        <p>No deals found.</p>
      ) : (
        <ul>
          {deals.map((d, i) => (
            <li key={d.id || d._id || i} className="deal-item">
              <h3>{d.title}</h3>
              <small>{d.date}</small>
              <p>{d.description}</p>
              {d.imageUrl && (
                <div style={{marginTop:6}}>
                  <img src={d.imageUrl.startsWith('http') ? d.imageUrl : `http://localhost:8080${d.imageUrl}`}
                       alt={d.title} style={{maxWidth:160, borderRadius:6}} />
                </div>
              )}
              <div style={{marginTop:8, display:'flex', gap:8}}>
                <button onClick={() => downloadSingle(d)}>Download PDF</button>
                <button onClick={() => sendOne(d)}>Send WhatsApp</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default DealList;
