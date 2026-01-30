import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DeveloperScreen.css';

const DeveloperScreen = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole');

  // Default sample data (will be replaced with backend fetch later)
  const [devData, setDevData] = useState({
    shopName: 'SuperMart UAE',
    location: 'Dubai Main Branch',
    version: 'v1.0.5',
    amcExpiry: '2026-01-01',
    shopsCount: 3,
    usersCount: 35,
    phone: '+971 50 123 4567',
    trn: '100234567800003',
    email: 'info@supermart.ae',
    lastLoginAdmin: '2025-08-01 10:23 AM',
    lastLoginCashier: '2025-08-02 09:05 AM',
    lastLoginDeveloper: '2025-08-04 11:40 AM',
    ipAddress: '192.168.1.20',
    deviceInfo: 'Windows 11 / Chrome 138',
    shopsList: [
      { name: 'SuperMart Dubai', location: 'Dubai Main', lastLogin: '2025-08-04 10:30 AM', amcExpiry: '2026-01-01' },
      { name: 'SuperMart Sharjah', location: 'Sharjah Central', lastLogin: '2025-08-03 11:15 AM', amcExpiry: '2025-12-15' },
      { name: 'SuperMart Ajman', location: 'Ajman City', lastLogin: '2025-08-02 09:50 AM', amcExpiry: '2026-02-10' }
    ]
  });

  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [settings, setSettings] = useState({
    scaleEmbedPrice: false,
    autoShowOnPole: false
  });

  const startEdit = (field, value) => {
    setEditField(field);
    setEditValue(value);
  };

  const saveEdit = () => {
    setDevData({ ...devData, [editField]: editValue });
    setEditField(null);
    setEditValue('');
    // TODO: Send update to backend
  };

  const cancelEdit = () => {
    setEditField(null);
    setEditValue('');
  };

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    // TODO: Send toggle update to backend
  };

  const handlePOSAction = (action) => {
    alert(`Triggering: ${action}`);
  };

  const handleBackup = () => alert('📦 Backup started');
  const handleRestore = () => alert('♻ Restore started');
  const handleRestartFrontend = () => window.location.reload();

  const isEditable = role === 'developer';

  // Restrict access
  if (role !== 'developer') {
    return <div className="access-denied">Access Denied</div>;
  }

  return (
    <div className="dev-container">
      <header className="dev-header">
        <button onClick={() => navigate('/dashboard')} className="home-btn">🏠</button>
        <h1>Developer Settings</h1>
      </header>

      {/* System Info */}
      <section className="dev-info">
        <h2>System Info</h2>
        <table>
          <tbody>
            {[
              { label: '🏪 Shop Name', field: 'shopName' },
              { label: '📍 Location', field: 'location' },
              { label: '🔢 Version', field: 'version' },
              { label: '📆 AMC Expiry', field: 'amcExpiry' },
              { label: '🏬 Shops Count', field: 'shopsCount' },
              { label: '👥 Users Count', field: 'usersCount' },
              { label: '📞 Phone Number', field: 'phone' },
              { label: '🧾 TRN Number', field: 'trn' },
              { label: '✉️ Email', field: 'email' },
              { label: '⌚ Last Login (Admin)', field: 'lastLoginAdmin' },
              { label: '⌚ Last Login (Cashier)', field: 'lastLoginCashier' },
              { label: '⌚ Last Login (Developer)', field: 'lastLoginDeveloper' },
              { label: '🌐 IP Address', field: 'ipAddress' },
              { label: '💻 Device Info', field: 'deviceInfo' }
            ].map(({ label, field }) => (
              <tr key={field}>
                <td>{label}:</td>
                <td>
                  {isEditable && editField === field ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                      <button onClick={saveEdit}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {devData[field]}
                      {isEditable && !['lastLoginAdmin', 'lastLoginCashier', 'lastLoginDeveloper', 'ipAddress', 'deviceInfo'].includes(field) && (
                        <button className="edit-btn" onClick={() => startEdit(field, devData[field])}>✏️</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Multiple Shops */}
      <section className="dev-shops">
        <h2>Multiple Shops Usage</h2>
        <table className="shops-table">
          <thead>
            <tr>
              <th>Shop Name</th>
              <th>Location</th>
              <th>Last Login</th>
              <th>AMC Expiry</th>
            </tr>
          </thead>
          <tbody>
            {devData.shopsList.map((shop, idx) => (
              <tr key={idx}>
                <td>{shop.name}</td>
                <td>{shop.location}</td>
                <td>{shop.lastLogin}</td>
                <td className={new Date(shop.amcExpiry) < new Date() ? 'expired' : ''}>
                  {shop.amcExpiry}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Pole Scale Settings */}
      <section className="dev-settings">
        <h2>Pole Scale & Weighing Machine</h2>
        <div className="toggle-row">
          <label>SCALE_EMBED_PRICE</label>
          <input
            type="checkbox"
            checked={settings.scaleEmbedPrice}
            onChange={() => handleToggle('scaleEmbedPrice')}
          />
        </div>
        <div className="toggle-row">
          <label>AUTO_SHOW_ON_POLE</label>
          <input
            type="checkbox"
            checked={settings.autoShowOnPole}
            onChange={() => handleToggle('autoShowOnPole')}
          />
        </div>
      </section>

      {/* POS Screen Access */}
      <section className="dev-keytest">
        <h2>POS Screen Access</h2>
        <div className="key-buttons">
          {[
            'Product (F1)', 'Clear All (F2)', 'View Sales (F3)', 'Hold (F4)', 'Recall Invoice (F5)',
            'Card Pay (F6)', 'Card w/o Print (F7)', 'Credit (F8)', 'Quick Pay', 'Commit (F9)',
            'Discount (F10)', 'Return (F11)', 'Options (F12)', 'Save & Print'
          ].map(action => (
            <button key={action} onClick={() => handlePOSAction(action)}>{action}</button>
          ))}
        </div>
      </section>

      {/* Maintenance Tools */}
      <section className="dev-tools">
        <h2>Maintenance Tools</h2>
        <div className="dev-buttons">
          <button onClick={handleBackup}>📦 Backup</button>
          <button onClick={handleRestore}>♻ Restore</button>
          <button onClick={handleRestartFrontend}>🔄 Restart Frontend</button>
        </div>
      </section>
    </div>
  );
};

export default DeveloperScreen;
