// src/components/Reports.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import './Reports.css';

/* Icons */
import agingIcon from '../assets/aging-reports.png';
import customerIcon from '../assets/customer-report.png';
import dayReportIcon from '../assets/day-report.png';
import expenseReportIcon from '../assets/expense-report.png';
import paymentReportIcon from '../assets/payment-report.png';
import productSalesIcon from '../assets/product-sales-report.png';
import purchaseReportIcon from '../assets/purchase-report.png';
import returnCancelIcon from '../assets/return-cancellation-report.png';
import salesSummaryIcon from '../assets/sales-summary.png';
import shiftReportIcon from '../assets/shift-report.png';
import vatReportIcon from '../assets/vat-report.png';
import vatSummaryIcon from '../assets/vat-summary-report.png';
import supplierOutstandingIcon from '../assets/supplier-outstanding.png';

/* Cards and routes */
const REPORTS = [
  { id: 'sales-summary',        label: 'Sales Summary',         icon: salesSummaryIcon,        route: '/reports/sales-summary' },
  { id: 'product-sales',        label: 'Product Sales Report',  icon: productSalesIcon,        route: '/reports/product-sales' },
  { id: 'dayz',                 label: 'Day Report / Z Report', icon: dayReportIcon,           route: '/reports/dayz' },
  { id: 'shift',                label: 'Shift Report',          icon: shiftReportIcon,         route: '/reports/shift' },
  { id: 'customer',             label: 'Customer Report',       icon: customerIcon,            route: '/reports/customer' },
  { id: 'purchase',             label: 'Purchase Report',       icon: purchaseReportIcon,      route: '/reports/purchase' },
  { id: 'returns',              label: 'Return / Cancellation', icon: returnCancelIcon,        route: '/reports/returns' },
  { id: 'payments',             label: 'Payment / Collection',  icon: paymentReportIcon,       route: '/reports/payments' },
  { id: 'vat',                  label: 'VAT Report',            icon: vatReportIcon,           route: '/reports/vat' },
  { id: 'vat-summary',          label: 'VAT Summary',           icon: vatSummaryIcon,          route: '/reports/vat-summary' },
  { id: 'aging',                label: 'Aging Report',          icon: agingIcon,               route: '/reports/aging' },
  { id: 'expenses',             label: 'Expense Report',        icon: expenseReportIcon,       route: '/reports/expenses' },
  { id: 'supplier-outstanding', label: 'Supplier Outstanding',  icon: supplierOutstandingIcon, route: '/reports/supplier-outstanding' },
];

export default function Reports() {
  const navigate = useNavigate();
  const open = (route) => navigate(route);

  const keyOpen = (e, route) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open(route);
    }
  };

  return (
    <div className="reports-wrapper">
      {/* Top Bar */}
      <div className="reports-topbar">
        <button
          className="home-btn"
          onClick={() => navigate('/dashboard')}
          title="Home"
          aria-label="Go to dashboard"
          type="button"
        >
          <FaHome aria-hidden="true" />
        </button>
        <h1 className="reports-title">Reports</h1>
        <div className="reports-spacer" />
      </div>

      {/* Cards Grid */}
      <div className="reports-grid" role="list">
        {REPORTS.map(({ id, label, icon, route }) => (
          <div
            key={id}
            className="report-card"
            role="button"
            tabIndex={0}
            aria-label={label}
            onClick={() => open(route)}
            onKeyDown={(e) => keyOpen(e, route)}
          >
            <img src={icon} alt={`${label} icon`} className="report-icon" />
            <span className="report-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
