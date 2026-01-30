// src/components/ProductListModal.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from '../api/axios';
import ProductForm from './ProductForm';
import './ProductListModal.css';

const getProductId = (p) => p?._id || p?.id || p?.code || '';

const ProductListModal = ({ onClose, onSelect }) => {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch products (memoized fn for safety)
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/products');
      const sorted = [...(data || [])].sort((a, b) => {
        const aHex = (a?._id || '').slice(0, 8);
        const bHex = (b?._id || '').slice(0, 8);
        const ta = Number.isNaN(parseInt(aHex, 16)) ? 0 : parseInt(aHex, 16);
        const tb = Number.isNaN(parseInt(bHex, 16)) ? 0 : parseInt(bHex, 16);
        return ta - tb;
      });
      setProducts(sorted);
    } catch (err) {
      console.error('❌ Error loading products:', err);
      alert('Failed to load product list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filtered list (memoized)
  const filtered = useMemo(() => {
    const codeQ = (searchCode || '').trim().toLowerCase();
    const nameQ = (searchName || '').trim().toLowerCase();
    if (!codeQ && !nameQ) return products;

    return products.filter((p) => {
      const code = (p?.code || '').toLowerCase();
      const name = (p?.name || '').toLowerCase();
      const nameAr = (p?.nameAr || '').toLowerCase();
      return (
        (!codeQ || code.includes(codeQ)) &&
        (!nameQ || name.includes(nameQ) || nameAr.includes(nameQ))
      );
    });
  }, [products, searchCode, searchName]);

  const selectedProduct =
    filtered.find((p) => getProductId(p) === selectedId) || null;

  // Lock body scroll + keyboard shortcuts (Esc/Enter)
  useEffect(() => {
    document.body.classList.add('modal-open');

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && selectedProduct) onSelect(selectedProduct);
    };

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, onSelect, selectedProduct]); // ✅ no 'filtered' dependency

  // Actions
  const handleAddNew = () => {
    setEditProduct(null);
    setShowForm(true);
    setSelectedId(null);
  };

  const handleEdit = async () => {
    if (!selectedId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`/products/${selectedId}`);
      setEditProduct(data);
      setShowForm(true);
    } catch (err) {
      console.error('❌ Failed to fetch product details:', err);
      alert('Failed to load product for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      setLoading(true);
      await axios.delete(`/products/${selectedId}`);
      setProducts((prev) => prev.filter((p) => getProductId(p) !== selectedId));
      setSelectedId(null);
    } catch (err) {
      console.error('❌ Failed to delete product:', err);
      alert('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditProduct(null);
    setSelectedId(null);
    fetchProducts();
  };

  return (
    <>
      <div className="modal-overlay" role="dialog" aria-modal="true">
        <div className="product-modal">
          <div className="modal-header">
            <h2>PRODUCTS</h2>
            <button onClick={onClose} className="close-icon" aria-label="Close">
              ✕
            </button>
          </div>

          <div className="modal-filters">
            <input
              placeholder="Item Code"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              aria-label="Filter by Item Code"
            />
            <input
              placeholder="Item Name (EN/AR)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              aria-label="Filter by Item Name"
            />
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Barcode</th>
                <th>Item Code</th>
                <th>Product Name (EN / AR)</th>
                <th>Unit</th>
                <th>Cost</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 16, color: '#666' }}>
                    {loading ? 'Loading…' : 'No products found'}
                  </td>
                </tr>
              )}
              {filtered.map((p, idx) => {
                const id = getProductId(p);
                const isSel = id === selectedId;
                return (
                  <tr
                    key={id || `row-${idx}`}
                    className={isSel ? 'selected-row' : ''}
                    onClick={() => setSelectedId(id)}
                    onDoubleClick={() => onSelect(p)}
                  >
                    <td>{idx + 1}</td>
                    <td>{p?.barcode || '-'}</td>
                    <td>{p?.code || '-'}</td>
                    <td>
                      <div className="name-cell">
                        <span className="name-en">{p?.name || '-'}</span>
                        <span className="name-ar">{p?.nameAr || ''}</span>
                      </div>
                    </td>
                    <td>{p?.unit || '-'}</td>
                    <td>{p?.baseCost ?? '-'}</td>
                    <td>{p?.retail ?? '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="modal-actions">
            <button
              className="btn select"
              disabled={!selectedProduct}
              onClick={() => onSelect(selectedProduct)}
            >
              ✔ Select
            </button>
            <button className="btn add" onClick={handleAddNew} disabled={loading}>
              ➕ Add New
            </button>
            <button
              className="btn edit"
              disabled={!selectedProduct || loading}
              onClick={handleEdit}
            >
              ✎ Edit
            </button>
            <button
              className="btn delete"
              disabled={!selectedProduct || loading}
              onClick={handleDelete}
            >
              🗑 Delete
            </button>
            <button className="btn close" onClick={onClose}>
              ✖ Close
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <ProductForm
          mode={editProduct ? 'edit' : 'add'}
          editData={editProduct}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditProduct(null);
            setSelectedId(null);
          }}
        />
      )}
    </>
  );
};

ProductListModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default ProductListModal;
