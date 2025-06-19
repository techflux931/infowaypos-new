import React from 'react';
import './Dash.css';
import { useNavigate } from 'react-router-dom';

import productIcon from '../assets/product.png';
import billingIcon from '../assets/barcode.png';
import customerIcon from '../assets/customer.png';
import reportsIcon from '../assets/reports.png';
import analyticsIcon from '../assets/analytics.png';
import totalPurchaseIcon from '../assets/totalpurchase.png';
import stockTransferIcon from '../assets/stocktransfer.png';
import posOrderIcon from '../assets/posordertotal.png';
import infowaysLogo from '../assets/logo.png';

const Dash = () => {
  const navigate = useNavigate();

  const items = [
    { label: 'POS', icon: billingIcon, path: '/pos' },
    { label: 'PRODUCT MASTER', icon: productIcon, path: '/products' },
    { label: 'CUSTOMER ENTRY', icon: customerIcon, path: '/customers' },
    { label: 'REPORTS', icon: reportsIcon, path: '/reports' },
    { label: 'ANALYTICS', icon: analyticsIcon, path: '/analytics', subtext: 'DAILY | WEEKLY | MONTHLY' },
    { label: 'TOTAL PURCHASE', icon: totalPurchaseIcon, path: '/total-purchase' },
    { label: 'STOCK TRANSFER', icon: stockTransferIcon, path: '/stock-transfer' },
    { label: 'POS ORDER TOTAL', icon: posOrderIcon, path: '/pos-orders' }
  ];

  return (
    <div className="dash-container">
      <div className="dash-header">
        <img src={infowaysLogo} alt="Infoways Logo" className="dash-logo" />
        <h1 className="dash-title">INFOWAYS POS</h1>
      </div>
      <div className="dash-grid">
        {items.map((item) => (
          <button
            key={item.label}
            className="dash-tile"
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <img src={item.icon} alt={item.label} className="tile-icon" />
            <div className="tile-label">{item.label}</div>
            {item.subtext && <div className="tile-subtext">{item.subtext}</div>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dash;
