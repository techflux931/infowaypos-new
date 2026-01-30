// src/components/DeveloperPanel.js
import React, { useEffect, useState } from 'react';
import './DeveloperPanel.css';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSyncAlt, FaDownload, FaUpload } from 'react-icons/fa';
import axios from '../api/axios';

const DeveloperPanel = () => {
  const navigate = useNavigate();

  const [systemInfo, setSystemInfo] = useState({
    ip: 'Fetching...',
    os: '',
    browser: '',
    version: 'v1.0.3',
    lastLogin: localStorage.getItem('lastLogin') || 'Not recorded',
  });

  const [shops, setShops] = useState([]);
  const [posSettings, setPosSettings] = useState({
    scaleEmbedPrice: false,
    autoShowOnPole: false,
  });
  const [error, setError] = useState(false);

  // ✅ Get system info
  useEffect(() => {
    const os = navigator.platform;
    const browser = (() => {
      const userAgent = navigator.userAgent;
      if (/Edg/.test(userAgent)) return 'Edge';
      if (/OPR|Opera/.test(userAgent)) return 'Opera';
      if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) return 'Chrome';
      if (/Firefox/.test(userAgent)) return 'Firefox';
      if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
      return 'Unknown';
    })();

    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => {
        setSystemInfo((prev) => ({
          ...prev,
          ip: data.ip,
          os,
          browser,
        }));
      })
      .catch(() => {
        setSystemInfo((prev) => ({
          ...prev,
          os,
          browser,
          ip: 'Unavailable',
        }));
      });
  }, []);

  // ✅ Fetch Multiple Shops (mock or backend)
  useEffect(() => {
    // Example static data (replace with axios.get from backend)
    setShops([
      { name: 'SuperMart Dubai', location: 'Dubai Main', lastLogin: '2025-08-04 10:30 AM', amc: '2026-01-01' },
      { name: 'SuperMart Sharjah', location: 'Sharjah Central', lastLogin: '2025-08-03 11:15 AM', amc: '2025-12-15' },
      { name: 'SuperMart Ajman', location: 'Ajman City', lastLogin: '2025-08-02 09:50 AM', amc: '2026-02-10' },
    ]);
  }, []);

  // ✅ Fetch Pole Scale Settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/pos-settings');
      setPosSettings(res.data);
      setError(false);
    } catch (err) {
      console.error('❌ Failed to fetch POS settings:', err);
      setError(true);
    }
  };

  const handleToggle = async (key) => {
    const updated = {
      ...posSettings,
      [key]: !posSettings[key],
    };
    try {
      const res = await axios.put('/pos-settings', updated);
      setPosSettings(res.data);
    } catch (err) {
      console.error('❌ Failed to update setting:', err);
      setError(true);
    }
  };

  // 🔁 Restart frontend
  const handleRestart = () => window.location.reload();

  // 📦 Backup
  const handleBackup = () => {
    try {
      window.open('http://localhost:8080/api/backup', '_blank');
    } catch (err) {
      console.error('❌ Backup failed:', err);
    }
  };

  // 🔁 Restore
  const handleRestore = () => {
    document.getElementById('restoreFile')?.click();
  };

  // 📂 Upload file and restore
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      return alert('❌ File too large (max 50MB)');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8080/api/restore', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('✅ Restore completed successfully!');
      } else {
        alert('❌ Restore failed.');
      }
    } catch (err) {
      console.error('❌ Restore Error:', err);
      alert('❌ Restore failed. Please try again.');
    }
  };

  return (
    <div className="developer-panel">
      {/* 🔧 Header */}
      <div className="dev-header">
        <button onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back
        </button>
        <h2>🔧 Developer Panel</h2>
      </div>

      {/* ℹ️ Info Section */}
      <div className="dev-info">
        <p><strong>Role:</strong> Developer</p>
        <p><strong>Version:</strong> {systemInfo.version}</p>
        <p><strong>Last Login:</strong> {systemInfo.lastLogin}</p>
        <p><strong>OS:</strong> {systemInfo.os}</p>
        <p><strong>Browser:</strong> {systemInfo.browser}</p>
        <p><strong>IP Address:</strong> {systemInfo.ip}</p>
      </div>

      {/* 🏬 Multiple Shops Usage */}
      <div className="shops-section">
        <h3>Multiple Shops Usage</h3>
        <table>
          <thead>
            <tr>
              <th>Shop Name</th>
              <th>Location</th>
              <th>Last Login</th>
              <th>AMC Expiry</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop, index) => (
              <tr key={index}>
                <td>{shop.name}</td>
                <td>{shop.location}</td>
                <td>{shop.lastLogin}</td>
                <td>{shop.amc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ⚖ Pole Scale Settings */}
      <div className="dev-settings">
        <h3>Pole Scale & Weighing Machine</h3>
        {error && <p className="error-msg">❌ Failed to load settings</p>}

        <div className="setting-item">
          <label>SCALE_EMBED_PRICE</label>
          <button
            className={posSettings.scaleEmbedPrice ? 'toggle-on' : 'toggle-off'}
            onClick={() => handleToggle('scaleEmbedPrice')}
          >
            {posSettings.scaleEmbedPrice ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="setting-item">
          <label>AUTO_SHOW_ON_POLE</label>
          <button
            className={posSettings.autoShowOnPole ? 'toggle-on' : 'toggle-off'}
            onClick={() => handleToggle('autoShowOnPole')}
          >
            {posSettings.autoShowOnPole ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* ⌨ POS Screen Access */}
      <div className="pos-access">
        <h3>POS Screen Access</h3>
        <div className="access-buttons">
          {['Product (F1)', 'Clear All (F2)', 'View Sales (F3)', 'Hold (F4)', 'Recall Invoice (F5)',
            'Card Pay (F6)', 'Card w/o Print (F7)', 'Credit (F8)', 'Quick Pay', 'Commit (F9)',
            'Discount (F10)', 'Return (F11)', 'Options (F12)', 'Save & Print'
          ].map((btn, idx) => (
            <button key={idx} className="pos-btn">{btn}</button>
          ))}
        </div>
      </div>

      {/* 🛠 Actions */}
      <div className="dev-actions">
        <button onClick={handleRestart}>
          <FaSyncAlt /> Restart Frontend
        </button>
        <button onClick={handleBackup}>
          <FaDownload /> Backup
        </button>
        <button onClick={handleRestore}>
          <FaUpload /> Restore
        </button>
        <input
          type="file"
          id="restoreFile"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default DeveloperPanel;
