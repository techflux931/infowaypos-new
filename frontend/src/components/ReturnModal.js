import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ReturnModal.css';
import { FaLock, FaCheck, FaTimes, FaCreditCard } from 'react-icons/fa';

const ReturnModal = ({ onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [cardScan, setCardScan] = useState('');
  const [error, setError] = useState('');
  const passwordRef = useRef(null);

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  const handleConfirm = () => {
    if (password === '1234') {
      setError('');
      onSubmit();
    } else {
      setError('Invalid password. Please try again.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="return-modal">
      <div className="return-header">
        <h2>RETURN AUTHENTICATION</h2>
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
      </div>

      <div className="return-body">
        <label>Password <FaLock /></label>
        <input
          ref={passwordRef}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter Password"
          onKeyDown={handleKeyDown}
        />

        <label>Card Scan <FaCreditCard /></label>
        <input
          type="text"
          value={cardScan}
          onChange={(e) => setCardScan(e.target.value)}
          placeholder="Scan Card"
        />

        {error && <div className="error-msg">{error}</div>}

        <div className="return-actions">
          <button className="ok-btn" onClick={handleConfirm}><FaCheck /> OK</button>
          <button className="cancel-btn" onClick={onClose}><FaTimes /> Cancel</button>
        </div>
      </div>
    </div>
  );
};

ReturnModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ReturnModal;
