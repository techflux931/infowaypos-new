// src/components/POSSetting.js
import React, { useState } from 'react';
import './POSSetting.css';

import GeneralTab from './tabs/GeneralTab';
import POSTab from './tabs/POSTab';
import TaxTab from './tabs/TaxTab';
import InvoiceCustomizationTab from './tabs/InvoiceCustomizationTab';
import ManagerAuthSettings from '../pages/ManagerAuthSettings';

import { FaWhatsapp, FaHome, FaFileInvoice, FaUserShield } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const POSSetting = () => {
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  const handleTabChange = (tab) => setActiveTab(tab);

  return (
    <div className="pos-setting-container">
      {/* Header */}
      <div className="pos-setting-header">
        <FaHome
          className="home-icon"
          title="Home"
          onClick={() => navigate('/dashboard')}
          role="button"
          tabIndex={0}
        />
        <h2>POS Settings</h2>
        <FaWhatsapp className="whatsapp-icon" title="WhatsApp Enabled" />
      </div>

      {/* Tab Buttons */}
      <div className="tab-buttons" role="tablist" aria-label="POS settings tabs">
        {['general', 'pos', 'tax', 'invoice', 'managerAuth'].map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => handleTabChange(tab)}
          >
            {tab === 'invoice' && <FaFileInvoice style={{ marginRight: 6 }} />}
            {tab === 'managerAuth' && <FaUserShield style={{ marginRight: 6 }} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'pos' && <POSTab />}
        {activeTab === 'tax' && <TaxTab />}
        {activeTab === 'invoice' && <InvoiceCustomizationTab />}
        {activeTab === 'managerAuth' && <ManagerAuthSettings />}
      </div>
    </div>
  );
};

export default POSSetting;
