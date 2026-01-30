import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';   // ✅ Added Home icon
import './SalesPage.css';

import customersIcon from '../../assets/Customers.png';
import quotesIcon from '../../assets/quotes.png';
import challanIcon from '../../assets/delivery challan.png';
import invoiceIcon from '../../assets/invoice.png';
import paymentIcon from '../../assets/payment received.png';
import recurringIcon from '../../assets/recurring invoice.png';
import creditIcon from '../../assets/credit notes.png';

const salesModules = [
  { id: 'customers', label: 'Customers', icon: customersIcon, route: '/sales/customers' },
  { id: 'quotes', label: 'Quotes', icon: quotesIcon, route: '/sales/quotes' },
  { id: 'challans', label: 'Delivery Challans', icon: challanIcon, route: '/sales/delivery' },
  { id: 'invoice', label: 'Invoice', icon: invoiceIcon, route: '/invoice' }, 
  { id: 'payments', label: 'Payments Received', icon: paymentIcon, route: '/payment' },
  { id: 'recurring', label: 'Recurring Invoices', icon: recurringIcon, route: '/sales/recurring' },
  { id: 'creditnotes', label: 'Credit Notes', icon: creditIcon, route: '/sales/creditnotes' },
];

const SalesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="sales-container">
      {/* Header with Home button */}
      <div className="sales-header">
        <button
          className="icon-btn home-btn"
          title="Home"
          onClick={() => navigate('/dashboard')}
        >
          <FaHome />
        </button>
        <h2 className="sales-heading">Sales</h2>
      </div>

      {/* Grid of Sales modules */}
      <div className="sales-grid">
        {salesModules.map(({ id, label, icon, route }) => (
          <button
            key={id}
            type="button"
            className="sales-tile"
            onClick={() => navigate(route)}
            aria-label={`Go to ${label}`}
          >
            <img src={icon} alt={label} className="sales-icon" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SalesPage;
