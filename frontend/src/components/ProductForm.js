import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './ProductForm.css';

const ProductForm = ({ onClose, onSave, mode = 'add', editData = null }) => {
  const [form, setForm] = useState({
    barcode: '', code: '', name: '', baseCost: '', costTax: '', netCost: '',
    margin: '', retail: '', packQty: '', rate: '', stock: '', total: '',
    brand: '', purchaseAcc: '', salesAcc: '', prodGroup: '', category: '',
    unit: '', wholesale: '', credit: '', directSale: false
  });

  const firstInputRef = useRef(null);

  useEffect(() => {
  console.log('EditData received:', editData);
  if (editData) {
    setForm(editData);
  }
}, [editData]);


  useEffect(() => {
    const handleF1 = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        firstInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleF1);
    return () => window.removeEventListener('keydown', handleF1);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(form);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="product-form-overlay">
      <div className="product-form-container">
        <div className="form-header">
          <span>{mode === 'edit' ? 'Edit Product' : 'Add Product'}</span>
          <button className="form-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
            <input ref={firstInputRef} name="barcode" value={form.barcode} onChange={handleChange} placeholder="Barcode" />
            <input name="code" value={form.code} onChange={handleChange} placeholder="Product Code" />
            <input name="name" value={form.name} onChange={handleChange} placeholder="Product Name" />
            <input name="baseCost" value={form.baseCost} onChange={handleChange} placeholder="Base Cost" />
            <input name="costTax" value={form.costTax} onChange={handleChange} placeholder="Cost Tax" />
            <input name="netCost" value={form.netCost} onChange={handleChange} placeholder="Net Cost" />
            <input name="margin" value={form.margin} onChange={handleChange} placeholder="Margin %" />
            <input name="retail" value={form.retail} onChange={handleChange} placeholder="Retail Price" />
            <input name="packQty" value={form.packQty} onChange={handleChange} placeholder="Pack Quantity" />
            <input name="rate" value={form.rate} onChange={handleChange} placeholder="Rate" />
            <input name="stock" value={form.stock} onChange={handleChange} placeholder="Opening Stock" />
            <input name="total" value={form.total} onChange={handleChange} placeholder="Total Value" />
            <input name="brand" value={form.brand} onChange={handleChange} placeholder="Brand Name" />
            <input name="purchaseAcc" value={form.purchaseAcc} onChange={handleChange} placeholder="Purchase Account" />
            <input name="salesAcc" value={form.salesAcc} onChange={handleChange} placeholder="Sales Account" />
            <input name="prodGroup" value={form.prodGroup} onChange={handleChange} placeholder="Product Group" />
            <input name="category" value={form.category} onChange={handleChange} placeholder="Category Name" />
            <input name="unit"  value={form.unit} onChange={handleChange} placeholder="Unit Name" />
            <input name="wholesale" value={form.wholesale} onChange={handleChange} placeholder="Wholesale Price" />
            <input name="credit"  value={form.credit} onChange={handleChange} placeholder="Credit Price"/>
            
            </div>

          <div className="bottom-controls">
            <div className="checkbox-inline" style={{ marginTop: '10px', marginBottom: '15px' }}>
              <label>
                <input
                  type="checkbox"
                  name="directSale"
                  checked={form.directSale}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                      />
                Direct Sale Item
              </label>
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn green">Save</button>
              <button type="button" className="btn red" onClick={onClose}>Close</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

ProductForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  mode: PropTypes.string,
  editData: PropTypes.object
};


export default ProductForm;
