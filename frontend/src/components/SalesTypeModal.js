import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './SalesTypeModal.css';
import { FaTimes, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const TYPES = ['RETAIL', 'WHOLESALE', 'CREDIT'];

export default function SalesTypeModal({
  isOpen = true,
  defaultType = '',
  onSelect,
  onClose,
}) {
  const [selectedType, setSelectedType] = useState(defaultType || '');
  const boxRef = useRef(null);

  // keep selection in sync when defaultType changes
  useEffect(() => { setSelectedType(defaultType || ''); }, [defaultType]);

  // close on Esc, trap initial focus
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // focus the modal for screen readers/keyboard
    setTimeout(() => boxRef.current?.focus(), 0);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedType) onSelect(selectedType);
  };

  const onBackdropClick = (e) => {
    if (e.target.dataset.backdrop) onClose();
  };

  return (
    <div
      className="sales-type-modal"
      data-backdrop
      onClick={onBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stm-title"
    >
      <div
        className="sales-type-box"
        ref={boxRef}
        tabIndex={-1}
      >
        <div className="sales-type-header">
          <span id="stm-title">SALE TYPES</span>
          <button className="sales-type-close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="sales-type-options">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`sales-type-option ${selectedType === t ? 'active' : ''}`}
              onClick={() => setSelectedType(t)}
              aria-pressed={selectedType === t}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="sales-type-actions">
          <button
            className="ok-btn"
            onClick={handleConfirm}
            disabled={!selectedType}
          >
            <FaCheckCircle /> Ok
          </button>
          <button className="close-btn" onClick={onClose}>
            <FaTimesCircle /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

SalesTypeModal.propTypes = {
  isOpen: PropTypes.bool,           // optional: show/hide
  defaultType: PropTypes.string,    // optional: preselect 'RETAIL' | 'WHOLESALE' | 'CREDIT'
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
