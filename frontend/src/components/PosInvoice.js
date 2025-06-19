import React from 'react';
import PropTypes from 'prop-types';
import './PosInvoice.css'; // ✅ Fixed case

const PosInvoice = ({ invoiceData, onClose }) => {
  const {
    invoiceNo = 'INV123456',
    date = new Date().toLocaleDateString(),
    time = new Date().toLocaleTimeString(),
    cashier = 'Admin',
    items = [],
    subTotal = 0,
    discount = 0,
    tax = 0,
    total = 0,
    paid = 0,
    change = 0,
    shopName = 'INFOWAYS BAKALA',
    address = 'Street 1, Abu Dhabi, UAE',
    phone = '+971 123456789',
    footerNote = 'Thank you! Visit again.',
  } = invoiceData;

  return (
    <div className="invoice-container">
      <div className="invoice-header">
        <h1>{shopName}</h1>
        <p>{address}</p>
        <p>Tel: {phone}</p>
      </div>

      <div className="invoice-info">
        <div>
          <p>Invoice: {invoiceNo}</p>
          <p>Cashier: {cashier}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p>Date: {date}</p>
          <p>Time: {time}</p>
        </div>
      </div>

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td>{item.name}</td>
              <td>{item.qty}</td>
              <td>{item.price?.toFixed(2)}</td>
              <td>{(item.qty * item.price)?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-total">
        <p>Sub Total: {subTotal.toFixed(2)}</p>
        <p>Discount: {discount.toFixed(2)}</p>
        <p>Tax: {tax.toFixed(2)}</p>
        <p>Total: {total.toFixed(2)}</p>
        <p>Paid: {paid.toFixed(2)}</p>
        <p>Change: {change.toFixed(2)}</p>
      </div>

      <div className="invoice-footer">
        <p>{footerNote}</p>
      </div>
    </div>
  );
};

PosInvoice.propTypes = {
  invoiceData: PropTypes.shape({
    invoiceNo: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    cashier: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        qty: PropTypes.number,
        price: PropTypes.number,
      })
    ),
    subTotal: PropTypes.number,
    discount: PropTypes.number,
    tax: PropTypes.number,
    total: PropTypes.number,
    paid: PropTypes.number,
    change: PropTypes.number,
    shopName: PropTypes.string,
    address: PropTypes.string,
    phone: PropTypes.string,
    footerNote: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func,
};

export default PosInvoice;
