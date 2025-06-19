// DayClose.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './DayClose.css';
import ConfirmModal from './PrintModal';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

const DayClose = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleOk = () => {
    if (password.trim() === '1234') {
      onClose();
    } else {
      setShowError(true);
    }
  };

  const handleErrorClose = () => {
    setShowError(false);
  };

  const onKeyboardInput = input => {
    setPassword(input);
  };

  return (
    <div className="auth-modal">
      <div className="auth-header">AUTHENTICATION</div>
      <div className="auth-body">
        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
        <div className="auth-actions">
          <button className="key-btn" onClick={() => setShowKeyboard(!showKeyboard)}>⌨ Keys</button>
          <button className="ok-btn" onClick={handleOk}>✔ Ok</button>
          <button className="close-btn" onClick={onClose}>✖ Close</button>
        </div>
        {showKeyboard && (
          <div className="keyboard-wrapper">
            <Keyboard
              layout={{ default: ['1 2 3 4 5 6 7 8 9 0', 'q w e r t y u i o p', 'a s d f g h j k l', 'z x c v b n m', '{bksp} {space}'] }}
              onChange={onKeyboardInput}
              inputName="auth-password"
            />
          </div>
        )}
      </div>

      {showError && (
        <ConfirmModal
          message="Incorrect Password."
          onConfirm={handleErrorClose}
          onCancel={handleErrorClose}
        />
      )}
    </div>
  );
};

DayClose.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default DayClose;
