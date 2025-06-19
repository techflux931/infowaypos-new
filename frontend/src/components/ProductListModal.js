import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ProductListModal.css';

const products = [
  { no: 1, barcode: '62910141', code: '101139', name: 'HAWAF TASTY FOODSTOO', arabic: 'DAجج', unit: 'PIECES', cost: '3.150', rate: '4.750' },
  { no: 2, barcode: '108456', code: '111', name: 'JEWA WATER 500 ml', arabic: 'بيدويوجد', unit: 'PIECES', cost: '3.150', rate: '4.750' },
  { no: 3, barcode: '84151655', code: '44163866', name: 'BRIAN PAN CAKE 100 g', arabic: 'بي ان ك', unit: 'PIECES', cost: '2.150', rate: '1.00' },
  { no: 4, barcode: '4160748', code: '14687815', name: 'VEGETABLES', arabic: 'الخضات', unit: 'PIECES', cost: '3.150', rate: '3.50' },
  { no: 5, barcode: '523385103', code: '006', name: 'MILK CAN', arabic: 'حليب', unit: 'PIECES', cost: '2.150', rate: '1.20' }
];

const ProductListModal = ({ onClose, onSelect, onAddNew, onEdit }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const selectedProduct = selectedIndex !== null ? products[selectedIndex] : null;
  

  return (
    <div className="modal-overlay">
      <div className="product-modal">
        <div className="modal-header">
          <h2>PRODUCTS</h2>
          <button onClick={onClose} className="close-icon">✕</button>
        </div>

        <div className="modal-filters">
          <input placeholder="Item Code" />
          <input placeholder="Item Name" />
        </div>

        <table>
          <thead>
            <tr>
              <th>No</th><th>Barcode</th><th>Item Code</th><th>Product Name</th>
              <th>Unit</th><th>Cost</th><th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr
                key={p.no}
                className={selectedIndex === idx ? 'selected-row' : ''}
                onClick={() => setSelectedIndex(idx)}
              >
                <td>{p.no}</td><td>{p.barcode}</td><td>{p.code}</td>
                <td>{p.name} <span className="arabic">{p.arabic}</span></td>
                <td>{p.unit}</td><td>{p.cost}</td><td>{p.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="modal-actions">
          <button
            className="btn select"
            disabled={!selectedProduct}
            onClick={() => {
              if (selectedProduct) onSelect(selectedProduct);
            }}
          >✔ Select</button>

          <button
            className="btn add"
            onClick={() => onAddNew()}
          >➕ Add New</button>

          <button
            className="btn edit"
            disabled={!selectedProduct}
            onClick={() => {
              if (selectedProduct){
                console.log('Editing:', selectedProduct);
              onEdit(selectedProduct);
              }
            }}
          >✎ Edit</button>

          <button className="btn close" onClick={onClose}>✖ Close</button>
        </div>
      </div>
    </div>
  );
};

ProductListModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onAddNew: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default ProductListModal;
